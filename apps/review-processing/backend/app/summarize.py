from sqlalchemy import text
from .db import SessionLocal

SYSTEM_TLDR = (
    "You are a precise note-taker. Write a one-paragraph TL;DR, a bullet outline, and 5 timestamped key quotes."
)

def call_llm(prompt: str) -> str:
    # TODO: plug in OpenAI or local model. MVP just echoes the full prompt for now.
    return prompt

def summarize_video(video_id: str, minutes: int = 9999):
    db = SessionLocal()
    try:
        rows = db.execute(text("SELECT start_ms,text FROM captions WHERE video_id=:v ORDER BY start_ms"), {"v": video_id}).fetchall()
        blob = []
        limit = minutes * 60 * 1000
        for r in rows:
            if r.start_ms <= limit:
                mm = r.start_ms // 60000; ss = (r.start_ms % 60000)//1000
                blob.append(f"[{mm:02d}:{ss:02d}] {r.text}")
        joined = "\n".join(blob)  # Remove character limit to show full transcript
        prompt = f"{SYSTEM_TLDR}\n\nTRANSCRIPT:\n{joined}\n\nNow produce: TL;DR; Outline; 5 key quotes with timestamps."
        return call_llm(prompt)
    finally:
        db.close()
