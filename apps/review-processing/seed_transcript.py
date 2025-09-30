#!/usr/bin/env python3
import psycopg
import json

# Transcript data
transcript_data = [
    {"text": "Let's talk about the carbon true foam", "offset": 18.64, "duration": 2.08},
    {"text": "wave series and find out if this is the", "offset": 20.72, "duration": 2.399},
    {"text": "wave you should ride. Carbon fixed", "offset": 23.119, "duration": 2.561},
    {"text": "Genesis's biggest problem but created a", "offset": 25.68, "duration": 2.24},
    {"text": "new one. The waves are consistent, but", "offset": 27.92, "duration": 2.24},
    {"text": "less forgiving, and they still cost 280", "offset": 30.16, "duration": 3.2},
    {"text": "bucks. That partial fiberglass patch in", "offset": 33.36, "duration": 2.56},
    {"text": "Genesis created unpredictable hot spots,", "offset": 35.92, "duration": 2.56},
    {"text": "causing balls to jump off the face with", "offset": 38.48, "duration": 2},
    {"text": "more pace than expected. Players", "offset": 40.48, "duration": 2.079},
    {"text": "complained about that inconsistency.", "offset": 42.559, "duration": 1.68},
    {"text": "Carbon listened and redesigned the face", "offset": 44.239, "duration": 2.081},
    {"text": "with full fiberglass coverage for the", "offset": 46.32, "duration": 2.079},
    {"text": "Wave series. But here's what you need to", "offset": 48.399, "duration": 1.921},
    {"text": "know up front. Fixing that inconsistency", "offset": 50.32, "duration": 2.64},
    {"text": "came with a trade-off. The sweet spot", "offset": 52.96, "duration": 1.919},
    {"text": "got smaller and less forgiving. When I", "offset": 54.879, "duration": 2.16},
    {"text": "switched between Genesis and Ways during", "offset": 57.039, "duration": 1.761},
    {"text": "testing, the differences were", "offset": 58.8, "duration": 1.599},
    {"text": "noticeable. My friends noticed it, too.", "offset": 60.399, "duration": 1.921}
]

# Connect to database
conn = psycopg.connect("postgresql://youcap:youcap@localhost:5432/youcap")
cur = conn.cursor()

# Insert captions
video_id = "6As_OJe9nDo"
for entry in transcript_data:
    start_ms = int(entry["offset"] * 1000)
    end_ms = int((entry["offset"] + entry["duration"]) * 1000)
    text = entry["text"]
    
    cur.execute("""
        INSERT INTO captions (video_id, start_ms, end_ms, text)
        VALUES (%s, %s, %s, %s)
    """, (video_id, start_ms, end_ms, text))

conn.commit()
print(f"Inserted {len(transcript_data)} captions for video {video_id}")
conn.close()
