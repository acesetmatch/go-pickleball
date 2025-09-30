import os
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from .db import SessionLocal
import numpy as np

# Initialize the embedding model
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
model = None

def get_embedding_model():
    """
    Lazy load the sentence transformer model to avoid loading during imports
    """
    global model
    if model is None:
        print(f"Loading embedding model: {EMBEDDING_MODEL}")
        model = SentenceTransformer(EMBEDDING_MODEL)
        print(f"Model loaded successfully. Embedding dimension: {model.get_sentence_embedding_dimension()}")
    return model

def chunk_captions(video_id: str, chunk_size_seconds: int = 30, overlap_seconds: int = 5) -> List[Dict]:
    """
    Create overlapping chunks from video captions
    
    Args:
        video_id: The video ID to process
        chunk_size_seconds: Size of each chunk in seconds
        overlap_seconds: Overlap between chunks in seconds
    
    Returns:
        List of chunk dictionaries with text, start_time, end_time
    """
    print(f"Creating chunks for video {video_id} (chunk_size: {chunk_size_seconds}s, overlap: {overlap_seconds}s)")
    
    db = SessionLocal()
    try:
        # Get all captions for the video, ordered by start time
        result = db.execute(text("""
            SELECT start_ms, end_ms, text 
            FROM captions 
            WHERE video_id = :video_id 
            ORDER BY start_ms
        """), {"video_id": video_id})
        
        captions = result.fetchall()
        
        if not captions:
            print(f"No captions found for video {video_id}")
            return []
        
        print(f"Found {len(captions)} captions for video {video_id}")
        
        chunks = []
        chunk_size_ms = chunk_size_seconds * 1000
        overlap_ms = overlap_seconds * 1000
        
        # Convert to list of dicts for easier processing
        caption_list = [
            {
                'start_ms': row[0],
                'end_ms': row[1], 
                'text': row[2]
            }
            for row in captions
        ]
        
        # Find the total duration
        if not caption_list:
            return []
            
        total_duration_ms = max(cap['end_ms'] for cap in caption_list)
        
        # Create chunks with overlap
        current_start_ms = 0
        chunk_id = 0
        
        while current_start_ms < total_duration_ms:
            chunk_end_ms = current_start_ms + chunk_size_ms
            
            # Get captions that overlap with this chunk
            chunk_captions = []
            for cap in caption_list:
                # Caption overlaps with chunk if it starts before chunk ends and ends after chunk starts
                if cap['start_ms'] < chunk_end_ms and cap['end_ms'] > current_start_ms:
                    chunk_captions.append(cap)
            
            if chunk_captions:
                # Combine text from all captions in this chunk
                chunk_text = ' '.join(cap['text'] for cap in chunk_captions).strip()
                
                if chunk_text:  # Only create chunk if there's text
                    # Calculate actual start and end times based on captions
                    actual_start_ms = min(cap['start_ms'] for cap in chunk_captions)
                    actual_end_ms = max(cap['end_ms'] for cap in chunk_captions)
                    
                    chunks.append({
                        'chunk_id': chunk_id,
                        'start_ms': actual_start_ms,
                        'end_ms': actual_end_ms,
                        'text': chunk_text,
                        'caption_count': len(chunk_captions)
                    })
                    chunk_id += 1
            
            # Move to next chunk (with overlap)
            current_start_ms += chunk_size_ms - overlap_ms
            
            # Prevent infinite loop
            if current_start_ms >= chunk_end_ms:
                break
        
        print(f"Created {len(chunks)} chunks for video {video_id}")
        return chunks
        
    finally:
        db.close()

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of texts using sentence-transformers
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors (as lists of floats)
    """
    if not texts:
        return []
    
    print(f"Generating embeddings for {len(texts)} texts")
    
    model = get_embedding_model()
    
    # Generate embeddings
    embeddings = model.encode(texts, convert_to_tensor=False, show_progress_bar=True)
    
    # Convert to list of lists for database storage
    embedding_lists = [embedding.tolist() for embedding in embeddings]
    
    print(f"Generated {len(embedding_lists)} embeddings, dimension: {len(embedding_lists[0]) if embedding_lists else 0}")
    
    return embedding_lists

def store_chunks_with_embeddings(video_id: str, chunks: List[Dict], embeddings: List[List[float]]) -> int:
    """
    Store chunks and their embeddings in the database
    
    Args:
        video_id: The video ID
        chunks: List of chunk dictionaries
        embeddings: List of embedding vectors
        
    Returns:
        Number of chunks stored
    """
    if len(chunks) != len(embeddings):
        raise ValueError(f"Mismatch: {len(chunks)} chunks but {len(embeddings)} embeddings")
    
    print(f"Storing {len(chunks)} chunks with embeddings for video {video_id}")
    
    db = SessionLocal()
    try:
        # Clear existing chunks for this video
        db.execute(text("DELETE FROM chunks WHERE video_id = :video_id"), {"video_id": video_id})
        
        # Insert new chunks
        for chunk, embedding in zip(chunks, embeddings):
            # Convert embedding to string format for PostgreSQL vector type
            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
            db.execute(text("""
                INSERT INTO chunks (video_id, start_ms, end_ms, content, embedding)
                VALUES (:video_id, :start_ms, :end_ms, :content, :embedding)
            """), {
                "video_id": video_id,
                "start_ms": chunk['start_ms'],
                "end_ms": chunk['end_ms'],
                "content": chunk['text'],
                "embedding": embedding_str
            })
        
        db.commit()
        print(f"Successfully stored {len(chunks)} chunks for video {video_id}")
        return len(chunks)
        
    finally:
        db.close()

def build_chunks_for_video(video_id: str, chunk_size_seconds: int = 30, overlap_seconds: int = 5) -> int:
    """
    Complete pipeline: chunk captions, generate embeddings, and store in database
    
    Args:
        video_id: The video ID to process
        chunk_size_seconds: Size of each chunk in seconds
        overlap_seconds: Overlap between chunks in seconds
        
    Returns:
        Number of chunks created
    """
    print(f"Building chunks for video {video_id}")
    
    try:
        # Step 1: Create chunks from captions
        chunks = chunk_captions(video_id, chunk_size_seconds, overlap_seconds)
        
        if not chunks:
            print(f"No chunks created for video {video_id} (no captions available)")
            return 0
        
        # Step 2: Generate embeddings for chunk texts
        chunk_texts = [chunk['text'] for chunk in chunks]
        embeddings = generate_embeddings(chunk_texts)
        
        # Step 3: Store chunks with embeddings
        stored_count = store_chunks_with_embeddings(video_id, chunks, embeddings)
        
        print(f"✅ Successfully built {stored_count} chunks for video {video_id}")
        return stored_count
        
    except Exception as e:
        print(f"❌ Failed to build chunks for video {video_id}: {str(e)}")
        raise

def build_chunks_for_all_videos() -> Dict[str, int]:
    """
    Build chunks for all videos that have captions but no chunks
    
    Returns:
        Dictionary mapping video_id to number of chunks created
    """
    print("Building chunks for all videos with captions")
    
    db = SessionLocal()
    try:
        # Find videos that have captions but no chunks
        result = db.execute(text("""
            SELECT DISTINCT v.video_id, v.title
            FROM videos v
            INNER JOIN captions c ON v.video_id = c.video_id
            LEFT JOIN chunks ch ON v.video_id = ch.video_id
            WHERE ch.video_id IS NULL
        """))
        
        videos_to_process = result.fetchall()
        
        if not videos_to_process:
            print("No videos found that need chunk processing")
            return {}
        
        print(f"Found {len(videos_to_process)} videos to process")
        
        results = {}
        for video_id, title in videos_to_process:
            try:
                chunk_count = build_chunks_for_video(video_id)
                results[video_id] = chunk_count
                print(f"✅ Processed {video_id} ({title}): {chunk_count} chunks")
            except Exception as e:
                print(f"❌ Failed to process {video_id} ({title}): {str(e)}")
                results[video_id] = 0
        
        total_chunks = sum(results.values())
        print(f"🎉 Chunk building complete! Total chunks created: {total_chunks}")
        return results
        
    finally:
        db.close()

def search_chunks(query: str, video_id: Optional[str] = None, limit: int = 10) -> List[Dict]:
    """
    Search for chunks using semantic similarity
    
    Args:
        query: Search query text
        video_id: Optional video ID to limit search to specific video
        limit: Maximum number of results to return
        
    Returns:
        List of matching chunks with similarity scores
    """
    print(f"Searching chunks for query: '{query}'" + (f" in video {video_id}" if video_id else ""))
    
    # Generate embedding for the query
    query_embedding = generate_embeddings([query])[0]
    # Convert to string format for PostgreSQL vector type
    query_embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
    
    db = SessionLocal()
    try:
        # Build the search query
        where_clause = "WHERE c.video_id = :video_id" if video_id else ""
        params = {"query_embedding": query_embedding_str, "limit": limit}
        if video_id:
            params["video_id"] = video_id
        
        # Use cosine similarity for search
        result = db.execute(text(f"""
            SELECT 
                c.video_id,
                c.start_ms,
                c.end_ms,
                c.content,
                v.title,
                v.channel,
                v.url,
                (c.embedding <=> :query_embedding) as similarity_score
            FROM chunks c
            JOIN videos v ON c.video_id = v.video_id
            {where_clause}
            ORDER BY c.embedding <=> :query_embedding
            LIMIT :limit
        """), params)
        
        chunks = []
        for row in result:
            chunks.append({
                'video_id': row[0],
                'start_ms': row[1],
                'end_ms': row[2],
                'text': row[3],
                'video_title': row[4],
                'video_channel': row[5],
                'video_url': row[6],
                'similarity_score': float(row[7]),
                'start_seconds': row[1] / 1000.0,
                'end_seconds': row[2] / 1000.0
            })
        
        print(f"Found {len(chunks)} matching chunks")
        return chunks
        
    finally:
        db.close()
