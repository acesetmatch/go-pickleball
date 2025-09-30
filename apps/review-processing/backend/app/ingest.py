import re, httpx, os, time, json, tempfile, random
from typing import Dict, List, Optional
import yt_dlp
from sqlalchemy import text
from .db import SessionLocal

_YT_RE = re.compile(r"(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})")
_CHANNEL_RE = re.compile(r"(?:youtube\.com/(?:c/|channel/|user/|@))([A-Za-z0-9_-]+)")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def extract_video_id(url: str) -> str:
    m = _YT_RE.search(url)
    if not m:
        raise ValueError("Could not parse video_id from URL")
    return m.group(1)

def is_channel_url(url: str) -> bool:
    """Check if URL is a YouTube channel URL"""
    return bool(_CHANNEL_RE.search(url))

def extract_channel_identifier(url: str) -> str:
    """Extract channel identifier from URL"""
    m = _CHANNEL_RE.search(url)
    if not m:
        raise ValueError("Could not parse channel identifier from URL")
    return m.group(1)

async def fetch_metadata(video_id: str) -> Dict:
    if not YOUTUBE_API_KEY:
        return {"title": None, "channel": None, "publishedAt": None}
    params = {"part": "snippet", "id": video_id, "key": YOUTUBE_API_KEY}
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get("https://www.googleapis.com/youtube/v3/videos", params=params)
        r.raise_for_status()
        items = r.json().get("items", [])
        if not items:
            return {"title": None, "channel": None, "publishedAt": None}
        it = items[0]
        return {
            "title": it["snippet"]["title"],
            "channel": it["snippet"]["channelTitle"],
            "publishedAt": it["snippet"].get("publishedAt")
        }

async def get_channel_id_from_handle_or_username(identifier: str) -> Optional[str]:
    """Convert channel handle (@username) or username to channel ID"""
    if not YOUTUBE_API_KEY:
        return None
    
    # Try as handle first (for @username format)
    if identifier.startswith('@'):
        handle = identifier
    else:
        handle = f"@{identifier}"
    
    async with httpx.AsyncClient(timeout=20) as client:
        try:
            # Search for the channel by handle
            params = {
                "part": "snippet",
                "q": handle,
                "type": "channel",
                "maxResults": 1,
                "key": YOUTUBE_API_KEY
            }
            r = await client.get("https://www.googleapis.com/youtube/v3/search", params=params)
            r.raise_for_status()
            items = r.json().get("items", [])
            if items:
                return items[0]["snippet"]["channelId"]
        except:
            pass
    
    # Try as username (legacy format)
    try:
        params = {
            "part": "id",
            "forUsername": identifier,
            "key": YOUTUBE_API_KEY
        }
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get("https://www.googleapis.com/youtube/v3/channels", params=params)
            r.raise_for_status()
            items = r.json().get("items", [])
            if items:
                return items[0]["id"]
    except:
        pass
    
    return None

async def fetch_channel_videos(channel_identifier: str, max_videos: int = 50) -> List[str]:
    """Fetch video IDs from a YouTube channel"""
    if not YOUTUBE_API_KEY:
        raise ValueError("YouTube API key required for channel ingestion")
    
    print(f"Fetching videos from channel: {channel_identifier}")
    
    # First, get the channel ID
    channel_id = None
    if channel_identifier.startswith('UC') and len(channel_identifier) == 24:
        # Already a channel ID
        channel_id = channel_identifier
    else:
        # Convert handle/username to channel ID
        channel_id = await get_channel_id_from_handle_or_username(channel_identifier)
    
    if not channel_id:
        raise ValueError(f"Could not find channel ID for: {channel_identifier}")
    
    print(f"Found channel ID: {channel_id}")
    
    # Get the uploads playlist ID
    async with httpx.AsyncClient(timeout=30) as client:
        params = {
            "part": "contentDetails",
            "id": channel_id,
            "key": YOUTUBE_API_KEY
        }
        r = await client.get("https://www.googleapis.com/youtube/v3/channels", params=params)
        r.raise_for_status()
        items = r.json().get("items", [])
        if not items:
            raise ValueError(f"Channel not found: {channel_id}")
        
        uploads_playlist_id = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]
        print(f"Uploads playlist ID: {uploads_playlist_id}")
    
    # Fetch videos from the uploads playlist
    video_ids = []
    next_page_token = None
    
    while len(video_ids) < max_videos:
        params = {
            "part": "contentDetails",
            "playlistId": uploads_playlist_id,
            "maxResults": min(50, max_videos - len(video_ids)),
            "key": YOUTUBE_API_KEY
        }
        if next_page_token:
            params["pageToken"] = next_page_token
        
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get("https://www.googleapis.com/youtube/v3/playlistItems", params=params)
            r.raise_for_status()
            data = r.json()
            
            for item in data.get("items", []):
                video_id = item["contentDetails"]["videoId"]
                video_ids.append(video_id)
            
            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break
    
    print(f"Found {len(video_ids)} videos in channel")
    return video_ids

def fetch_transcript_with_ytdlp(video_id: str, max_retries: int = 3) -> List[Dict]:
    """
    Fetch transcript using yt-dlp with retry logic and exponential backoff
    """
    print(f"Attempting to fetch transcript for {video_id} using yt-dlp (max retries: {max_retries})")
    
    for attempt in range(max_retries + 1):
        try:
            return _fetch_transcript_attempt(video_id, attempt)
        except Exception as e:
            error_str = str(e).lower()
            
            # Check if this is a retryable error
            is_rate_limit = '429' in error_str or 'too many requests' in error_str
            is_network_error = 'network' in error_str or 'timeout' in error_str or 'connection' in error_str
            is_temporary_error = 'temporary' in error_str or 'unavailable' in error_str
            
            if attempt < max_retries and (is_rate_limit or is_network_error or is_temporary_error):
                # Calculate exponential backoff with jitter
                base_delay = 2 ** attempt  # 1, 2, 4 seconds
                jitter = random.uniform(0.5, 1.5)  # Add randomness to avoid thundering herd
                delay = base_delay * jitter
                
                print(f"Attempt {attempt + 1} failed for {video_id}: {str(e)}")
                print(f"Retrying in {delay:.1f} seconds... ({max_retries - attempt} attempts remaining)")
                time.sleep(delay)
                continue
            else:
                # Non-retryable error or max retries reached
                print(f"Final attempt failed for {video_id}: {str(e)}")
                raise ValueError(f"Could not extract transcript for {video_id} after {max_retries + 1} attempts: {str(e)}")

def _fetch_transcript_attempt(video_id: str, attempt: int) -> List[Dict]:
    """
    Single attempt to fetch transcript - separated for cleaner retry logic
    """
    # Configure yt-dlp options with headers to avoid bot detection
    ydl_opts = {
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US', 'en-GB'],
        'subtitlesformat': 'json3',
        'skip_download': True,  # Don't download the video, just get subtitles
        'quiet': True,  # Reduce output noise
        'no_warnings': True,
        # Add headers to mimic a real browser - vary slightly per attempt
        'http_headers': {
            'User-Agent': f'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.{attempt} Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip,deflate',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
            'Keep-Alive': '300',
            'Connection': 'keep-alive',
        },
        # Additional options to avoid detection
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
                'player_skip': ['webpage'],
            }
        }
    }
    
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Extract info to get available subtitles
        info = ydl.extract_info(url, download=False)
        
        if not info:
            raise ValueError(f"Could not extract video info for {video_id}")
        
        # Check for subtitles
        subtitles = info.get('subtitles', {})
        automatic_captions = info.get('automatic_captions', {})
        
        if attempt == 0:  # Only log on first attempt to avoid spam
            print(f"Available subtitles: {list(subtitles.keys())}")
            print(f"Available automatic captions: {list(automatic_captions.keys())}")
        
        # Try to get subtitles in order of preference
        subtitle_data = None
        subtitle_source = None
        
        # First try manual subtitles
        for lang in ['en', 'en-US', 'en-GB']:
            if lang in subtitles:
                subtitle_data = subtitles[lang]
                subtitle_source = f"manual-{lang}"
                break
        
        # If no manual subtitles, try automatic captions
        if not subtitle_data:
            for lang in ['en', 'en-US', 'en-GB']:
                if lang in automatic_captions:
                    subtitle_data = automatic_captions[lang]
                    subtitle_source = f"auto-{lang}"
                    break
        
        if not subtitle_data:
            raise ValueError(f"No English subtitles or captions available for {video_id}")
        
        # Find the JSON3 format subtitle
        json3_subtitle = None
        for sub_format in subtitle_data:
            if sub_format.get('ext') == 'json3':
                json3_subtitle = sub_format
                break
        
        if not json3_subtitle:
            raise ValueError(f"No JSON3 format subtitles available for {video_id}")
        
        if attempt == 0:  # Only log on first attempt
            print(f"Using {subtitle_source} subtitles for {video_id}")
        
        # Download the subtitle content with retry-aware headers
        subtitle_url = json3_subtitle['url']
        
        # Use httpx with retry-friendly configuration
        with httpx.Client(timeout=30.0) as client:
            # Add some delay between requests to be respectful
            if attempt > 0:
                time.sleep(1)
                
            response = client.get(subtitle_url, headers={
                'User-Agent': f'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.{attempt} Safari/537.36',
                'Referer': 'https://www.youtube.com/',
            })
            response.raise_for_status()
            subtitle_json = response.json()
        
        # Parse the JSON3 subtitle format
        transcript_entries = []
        events = subtitle_json.get('events', [])
        
        for event in events:
            if 'segs' not in event:
                continue
                
            start_time = event.get('tStartMs', 0) / 1000.0  # Convert to seconds
            duration = event.get('dDurationMs', 0) / 1000.0  # Convert to seconds
            
            # Combine all segments in this event
            text_parts = []
            for seg in event['segs']:
                if 'utf8' in seg:
                    text_parts.append(seg['utf8'])
            
            if text_parts:
                text = ''.join(text_parts).strip()
                if text:  # Only add non-empty text
                    transcript_entries.append({
                        'start': start_time,
                        'duration': duration,
                        'text': text
                    })
        
        print(f"Successfully extracted {len(transcript_entries)} transcript entries for {video_id}")
        return transcript_entries

async def upsert_video_and_captions(url: str):
    vid = extract_video_id(url)
    meta = await fetch_metadata(vid)
    db = SessionLocal()
    try:
        db.execute(text(
            """
            INSERT INTO videos (video_id, title, channel, url, published_at)
            VALUES (:vid, :title, :channel, :url, COALESCE(:publishedAt, now()))
            ON CONFLICT (video_id) DO UPDATE SET title=EXCLUDED.title, channel=EXCLUDED.channel, url=EXCLUDED.url
            """
        ), {"vid": vid, "title": meta.get("title"), "channel": meta.get("channel"), "url": url, "publishedAt": meta.get("publishedAt")})
        
        # clear existing
        db.execute(text("DELETE FROM captions WHERE video_id=:v"), {"v": vid})
        
        try:
            transcript = fetch_transcript_with_ytdlp(vid)
            for row in transcript:
                s = int(row['start']*1000); e = int((row['start']+row['duration'])*1000)
                db.execute(text("INSERT INTO captions(video_id,start_ms,end_ms,text) VALUES (:v,:s,:e,:t)"), {"v": vid, "s": s, "e": e, "t": row['text']})
            print(f"Successfully stored {len(transcript)} caption entries for {vid}")
        except ValueError as e:
            # If no transcripts available, still store the video metadata
            print(f"Warning: {e}")
        
        db.commit()
    finally:
        db.close()
    return vid

async def ingest_channel(url: str, max_videos: int = 200) -> Dict[str, List[str]]:
    """
    Ingest all videos from a YouTube channel
    
    Args:
        url: YouTube channel URL
        max_videos: Maximum number of videos to ingest (default 50)
    
    Returns:
        Dict with 'successful' and 'failed' lists of video IDs
    """
    channel_identifier = extract_channel_identifier(url)
    video_ids = await fetch_channel_videos(channel_identifier, max_videos)
    
    successful = []
    failed = []
    
    print(f"Starting ingestion of {len(video_ids)} videos from channel")
    
    for i, video_id in enumerate(video_ids, 1):
        try:
            print(f"Processing video {i}/{len(video_ids)}: {video_id}")
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            await upsert_video_and_captions(video_url)
            successful.append(video_id)
            print(f"✅ Successfully ingested {video_id}")
            
            # Add small delay to avoid rate limiting
            time.sleep(1)
            
        except Exception as e:
            print(f"❌ Failed to ingest {video_id}: {str(e)}")
            failed.append(video_id)
            continue
    
    print(f"Channel ingestion complete: {len(successful)} successful, {len(failed)} failed")
    return {
        "successful": successful,
        "failed": failed
    }
