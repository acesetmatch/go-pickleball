import os
from typing import List, Dict, Optional
from sqlalchemy import text
from .db import SessionLocal
from .search import search_chunks, get_embedding_model
import numpy as np
from sklearn.cluster import KMeans
from collections import defaultdict
import re

# Common review sections and their keywords
REVIEW_SECTIONS = {
    "pros": [
        "pros", "advantages", "benefits", "good", "great", "excellent", "love", "like", 
        "positive", "strength", "strong", "best", "amazing", "fantastic", "perfect",
        "impressed", "recommend", "favorite", "works well", "high quality"
    ],
    "cons": [
        "cons", "disadvantages", "problems", "issues", "bad", "terrible", "hate", 
        "dislike", "negative", "weakness", "weak", "worst", "awful", "disappointing",
        "frustrated", "annoying", "doesn't work", "poor quality", "overpriced"
    ],
    "price": [
        "price", "cost", "expensive", "cheap", "budget", "affordable", "money", 
        "dollars", "$", "worth", "value", "investment", "pricing", "fee", "charge"
    ],
    "features": [
        "features", "specs", "specifications", "capabilities", "functions", "options",
        "settings", "modes", "technology", "design", "build", "materials", "construction"
    ],
    "performance": [
        "performance", "speed", "fast", "slow", "responsive", "lag", "smooth", 
        "efficient", "effective", "accuracy", "precision", "reliability", "durability"
    ],
    "comparison": [
        "compared to", "versus", "vs", "better than", "worse than", "similar to",
        "alternative", "competitor", "other options", "different from"
    ],
    "setup": [
        "setup", "installation", "install", "configure", "assembly", "unboxing",
        "getting started", "first time", "initial", "out of the box"
    ],
    "conclusion": [
        "conclusion", "summary", "overall", "final thoughts", "recommendation",
        "verdict", "bottom line", "in conclusion", "to summarize", "wrap up"
    ]
}

def get_video_captions(video_id: str) -> List[Dict]:
    """
    Get all captions for a video with timestamps
    """
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT start_ms, end_ms, text 
            FROM captions 
            WHERE video_id = :video_id 
            ORDER BY start_ms
        """), {"video_id": video_id})
        
        captions = []
        for row in result:
            captions.append({
                'start_ms': row[0],
                'end_ms': row[1],
                'text': row[2],
                'start_seconds': row[0] / 1000.0,
                'end_seconds': row[1] / 1000.0
            })
        
        return captions
    finally:
        db.close()

def classify_caption_by_keywords(text: str, sections: Dict[str, List[str]]) -> Dict[str, float]:
    """
    Classify a caption based on keyword matching
    Returns scores for each section
    """
    text_lower = text.lower()
    scores = {}
    
    for section, keywords in sections.items():
        score = 0
        for keyword in keywords:
            # Count occurrences of each keyword
            count = text_lower.count(keyword.lower())
            # Weight longer keywords more heavily
            weight = len(keyword.split()) * 1.5
            score += count * weight
        
        # Normalize by text length to avoid bias toward longer captions
        scores[section] = score / max(len(text.split()), 1)
    
    return scores

def classify_caption_by_embeddings(text: str, section_embeddings: Dict[str, np.ndarray]) -> Dict[str, float]:
    """
    Classify a caption using semantic similarity to section embeddings
    """
    model = get_embedding_model()
    text_embedding = model.encode([text])[0]
    
    scores = {}
    for section, section_emb in section_embeddings.items():
        # Calculate cosine similarity
        similarity = np.dot(text_embedding, section_emb) / (
            np.linalg.norm(text_embedding) * np.linalg.norm(section_emb)
        )
        scores[section] = float(similarity)
    
    return scores

def create_section_embeddings(sections: Dict[str, List[str]]) -> Dict[str, np.ndarray]:
    """
    Create embeddings for each section based on their keywords
    """
    model = get_embedding_model()
    section_embeddings = {}
    
    for section, keywords in sections.items():
        # Combine keywords into a representative text
        section_text = " ".join(keywords)
        embedding = model.encode([section_text])[0]
        section_embeddings[section] = embedding
    
    return section_embeddings

def analyze_video_sections(video_id: str, confidence_threshold: float = 0.1) -> Dict[str, List[Dict]]:
    """
    Analyze a video and categorize captions into sections
    """
    print(f"Analyzing video {video_id} for content sections")
    
    # Get all captions
    captions = get_video_captions(video_id)
    if not captions:
        print(f"No captions found for video {video_id}")
        return {}
    
    print(f"Found {len(captions)} captions to analyze")
    
    # Create section embeddings for semantic classification
    section_embeddings = create_section_embeddings(REVIEW_SECTIONS)
    
    # Classify each caption
    sections = defaultdict(list)
    
    for caption in captions:
        # Get keyword-based scores
        keyword_scores = classify_caption_by_keywords(caption['text'], REVIEW_SECTIONS)
        
        # Get embedding-based scores
        embedding_scores = classify_caption_by_embeddings(caption['text'], section_embeddings)
        
        # Combine scores (weighted average)
        combined_scores = {}
        for section in REVIEW_SECTIONS.keys():
            combined_scores[section] = (
                keyword_scores.get(section, 0) * 0.6 + 
                embedding_scores.get(section, 0) * 0.4
            )
        
        # Find the best matching section
        best_section = max(combined_scores, key=combined_scores.get)
        best_score = combined_scores[best_section]
        
        # Only assign if confidence is above threshold
        if best_score > confidence_threshold:
            caption_with_score = caption.copy()
            caption_with_score['confidence'] = best_score
            caption_with_score['section'] = best_section
            sections[best_section].append(caption_with_score)
        else:
            # Add to "other" section if no clear match
            caption_with_score = caption.copy()
            caption_with_score['confidence'] = best_score
            caption_with_score['section'] = 'other'
            sections['other'].append(caption_with_score)
    
    # Sort captions within each section by timestamp
    for section in sections:
        sections[section].sort(key=lambda x: x['start_ms'])
    
    print(f"Categorized captions into {len(sections)} sections")
    for section, captions_list in sections.items():
        print(f"  {section}: {len(captions_list)} captions")
    
    return dict(sections)

def summarize_section(section_name: str, captions: List[Dict], max_length: int = 200) -> str:
    """
    Create a summary for a section based on its captions
    """
    if not captions:
        return ""
    
    # Combine all text from the section
    all_text = " ".join([cap['text'] for cap in captions])
    
    # Simple extractive summarization - pick most representative sentences
    sentences = re.split(r'[.!?]+', all_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    if not sentences:
        return all_text[:max_length] + "..." if len(all_text) > max_length else all_text
    
    # For now, return first few sentences up to max_length
    summary = ""
    for sentence in sentences:
        if len(summary + sentence) > max_length:
            break
        summary += sentence + ". "
    
    return summary.strip()

def get_video_analysis(video_id: str) -> Dict:
    """
    Get complete analysis of a video including sections and summaries
    """
    print(f"Getting complete analysis for video {video_id}")
    
    # Get video metadata
    db = SessionLocal()
    try:
        result = db.execute(text("""
            SELECT title, channel, url FROM videos WHERE video_id = :video_id
        """), {"video_id": video_id})
        video_info = result.fetchone()
        
        if not video_info:
            raise ValueError(f"Video {video_id} not found")
        
        title, channel, url = video_info
    finally:
        db.close()
    
    # Analyze sections
    sections = analyze_video_sections(video_id)
    
    # Create summaries for each section
    analysis = {
        "video_id": video_id,
        "title": title,
        "channel": channel,
        "url": url,
        "sections": {}
    }
    
    total_captions = sum(len(captions) for captions in sections.values())
    
    for section_name, captions in sections.items():
        if captions:  # Only include sections with content
            summary = summarize_section(section_name, captions)
            
            analysis["sections"][section_name] = {
                "caption_count": len(captions),
                "percentage": round((len(captions) / total_captions) * 100, 1) if total_captions > 0 else 0,
                "summary": summary,
                "time_range": {
                    "start_seconds": captions[0]['start_seconds'],
                    "end_seconds": captions[-1]['end_seconds']
                },
                "captions": captions[:3]  # Include first 3 captions as examples
            }
    
    print(f"Analysis complete for video {video_id}")
    return analysis

def find_section_content(video_id: str, section_name: str) -> List[Dict]:
    """
    Find all content related to a specific section (e.g., "pros", "cons")
    """
    sections = analyze_video_sections(video_id)
    return sections.get(section_name.lower(), [])

def get_section_timestamps(video_id: str, section_name: str) -> List[Dict]:
    """
    Get timestamp ranges where a specific section is discussed
    """
    captions = find_section_content(video_id, section_name)
    
    if not captions:
        return []
    
    # Group consecutive captions into time ranges
    ranges = []
    current_range = None
    
    for caption in captions:
        if current_range is None:
            current_range = {
                "start_seconds": caption['start_seconds'],
                "end_seconds": caption['end_seconds'],
                "text_preview": caption['text'][:100] + "..." if len(caption['text']) > 100 else caption['text']
            }
        else:
            # If this caption is close to the previous one (within 10 seconds), extend the range
            if caption['start_seconds'] - current_range['end_seconds'] <= 10:
                current_range['end_seconds'] = caption['end_seconds']
            else:
                # Start a new range
                ranges.append(current_range)
                current_range = {
                    "start_seconds": caption['start_seconds'],
                    "end_seconds": caption['end_seconds'],
                    "text_preview": caption['text'][:100] + "..." if len(caption['text']) > 100 else caption['text']
                }
    
    if current_range:
        ranges.append(current_range)
    
    return ranges
