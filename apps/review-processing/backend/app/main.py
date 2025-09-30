from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, Dict, List
from .db import run_migrations
from .ingest import upsert_video_and_captions, ingest_channel, is_channel_url
from .search import build_chunks_for_video, build_chunks_for_all_videos, search_chunks
from .analyzer import get_video_analysis, find_section_content, get_section_timestamps
from .summarize import summarize_video

class IngestRequest(BaseModel):
    url: str

class IngestResponse(BaseModel):
    video_id: Optional[str] = None
    chunks: int
    is_channel: bool = False
    successful_videos: Optional[List[str]] = None
    failed_videos: Optional[List[str]] = None
    total_videos: Optional[int] = None

class BuildChunksRequest(BaseModel):
    video_id: Optional[str] = None
    chunk_size_seconds: int = 30
    overlap_seconds: int = 5

class BuildChunksResponse(BaseModel):
    processed_videos: Dict[str, int]
    total_chunks: int

class SearchRequest(BaseModel):
    query: str
    video_id: Optional[str] = None
    limit: int = 10

class ChunkResult(BaseModel):
    video_id: str
    start_ms: int
    end_ms: int
    text: str
    video_title: Optional[str]
    video_channel: Optional[str]
    video_url: str
    similarity_score: float
    start_seconds: float
    end_seconds: float

class SearchResponse(BaseModel):
    query: str
    results: List[ChunkResult]
    count: int

class AnalyzeRequest(BaseModel):
    video_id: str

class SectionInfo(BaseModel):
    caption_count: int
    percentage: float
    summary: str
    time_range: Dict[str, float]
    captions: List[Dict]

class AnalysisResponse(BaseModel):
    video_id: str
    title: Optional[str]
    channel: Optional[str]
    url: str
    sections: Dict[str, SectionInfo]

class SectionRequest(BaseModel):
    video_id: str
    section_name: str

class TimeRange(BaseModel):
    start_seconds: float
    end_seconds: float
    text_preview: str

class SectionTimestampsResponse(BaseModel):
    video_id: str
    section_name: str
    ranges: List[TimeRange]

class SummarizeResponse(BaseModel):
    summary: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run migrations on startup
    try:
        run_migrations()
        print("✅ Migrations completed successfully")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    yield

app = FastAPI(
    title="YouCap API",
    description="YouTube Caption Search and Analysis API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "YouCap API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/ingest", response_model=IngestResponse)
async def ingest_video_or_channel(request: IngestRequest):
    """
    Ingest a YouTube video or entire channel: extract metadata, download transcripts, and store in database.
    Automatically builds chunks and embeddings for search functionality.
    
    Supports:
    - Single video URLs: https://www.youtube.com/watch?v=VIDEO_ID
    - Channel URLs: https://www.youtube.com/channel/CHANNEL_ID
    - Channel handles: https://www.youtube.com/@username
    - Legacy usernames: https://www.youtube.com/user/username
    """
    try:
        if is_channel_url(request.url):
            # Handle channel ingestion
            result = await ingest_channel(request.url, max_videos=200)
            
            # Build chunks for all successfully ingested videos
            total_chunks = 0
            for video_id in result["successful"]:
                try:
                    chunk_count = build_chunks_for_video(video_id, chunk_size_seconds=30, overlap_seconds=5)
                    total_chunks += chunk_count
                except Exception as e:
                    print(f"Failed to build chunks for {video_id}: {e}")
            
            return IngestResponse(
                chunks=total_chunks,
                is_channel=True,
                successful_videos=result["successful"],
                failed_videos=result["failed"],
                total_videos=len(result["successful"]) + len(result["failed"])
            )
        else:
            # Handle single video ingestion
            video_id = await upsert_video_and_captions(request.url)
            # Automatically build chunks and embeddings after ingesting
            chunk_count = build_chunks_for_video(video_id, chunk_size_seconds=30, overlap_seconds=5)
            return IngestResponse(video_id=video_id, chunks=chunk_count, is_channel=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest: {str(e)}")

@app.post("/build-chunks", response_model=BuildChunksResponse)
async def build_chunks(request: BuildChunksRequest):
    """
    Build chunks and embeddings for videos.
    If video_id is provided, processes only that video.
    Otherwise, processes all videos with captions but no chunks.
    """
    try:
        if request.video_id:
            # Process single video
            chunk_count = build_chunks_for_video(
                request.video_id, 
                request.chunk_size_seconds, 
                request.overlap_seconds
            )
            processed_videos = {request.video_id: chunk_count}
        else:
            # Process all videos that need chunks
            processed_videos = build_chunks_for_all_videos()
        
        total_chunks = sum(processed_videos.values())
        return BuildChunksResponse(
            processed_videos=processed_videos,
            total_chunks=total_chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build chunks: {str(e)}")

@app.post("/search", response_model=SearchResponse)
async def search_videos(request: SearchRequest):
    """
    Search for video chunks using semantic similarity.
    Returns chunks ranked by relevance to the query.
    """
    try:
        results = search_chunks(
            query=request.query,
            video_id=request.video_id,
            limit=request.limit
        )
        
        # Convert to Pydantic models
        chunk_results = [
            ChunkResult(
                video_id=result['video_id'],
                start_ms=result['start_ms'],
                end_ms=result['end_ms'],
                text=result['text'],
                video_title=result['video_title'],
                video_channel=result['video_channel'],
                video_url=result['video_url'],
                similarity_score=result['similarity_score'],
                start_seconds=result['start_seconds'],
                end_seconds=result['end_seconds']
            )
            for result in results
        ]
        
        return SearchResponse(
            query=request.query,
            results=chunk_results,
            count=len(chunk_results)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_video(request: AnalyzeRequest):
    """
    Analyze a video and categorize its content into sections like pros, cons, price, etc.
    Returns a structured breakdown of the video content with summaries for each section.
    """
    try:
        analysis = get_video_analysis(request.video_id)
        
        # Convert to Pydantic models
        sections_dict = {}
        for section_name, section_data in analysis["sections"].items():
            sections_dict[section_name] = SectionInfo(
                caption_count=section_data["caption_count"],
                percentage=section_data["percentage"],
                summary=section_data["summary"],
                time_range=section_data["time_range"],
                captions=section_data["captions"]
            )
        
        return AnalysisResponse(
            video_id=analysis["video_id"],
            title=analysis["title"],
            channel=analysis["channel"],
            url=analysis["url"],
            sections=sections_dict
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/section-timestamps", response_model=SectionTimestampsResponse)
async def get_section_timestamps_endpoint(request: SectionRequest):
    """
    Get timestamp ranges where a specific section (e.g., 'pros', 'cons') is discussed.
    Useful for jumping directly to relevant parts of the video.
    """
    try:
        ranges = get_section_timestamps(request.video_id, request.section_name)
        
        time_ranges = [
            TimeRange(
                start_seconds=r["start_seconds"],
                end_seconds=r["end_seconds"],
                text_preview=r["text_preview"]
            )
            for r in ranges
        ]
        
        return SectionTimestampsResponse(
            video_id=request.video_id,
            section_name=request.section_name,
            ranges=time_ranges
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get section timestamps: {str(e)}")

@app.get("/summarize/{video_id}", response_model=SummarizeResponse)
async def summarize_video_endpoint(video_id: str, minutes: Optional[int] = 9999):
    """
    Generate a TL;DR summary of a video with bullet outline and key quotes.
    Optional minutes parameter limits the summary to first N minutes of video.
    """
    try:
        summary = summarize_video(video_id, minutes)
        return SummarizeResponse(summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to summarize video: {str(e)}")

# The /docs endpoint is automatically generated by FastAPI
