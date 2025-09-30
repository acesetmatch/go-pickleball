from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI(title="Embed Service", version="1.0")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

class EmbedReq(BaseModel): 
    texts: List[str]

class EmbedResp(BaseModel): 
    vectors: List[List[float]]

@app.post("/embed", response_model=EmbedResp)
def embed(req: EmbedReq):
    vecs = model.encode(req.texts, normalize_embeddings=True).tolist()
    return EmbedResp(vectors=vecs)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)
