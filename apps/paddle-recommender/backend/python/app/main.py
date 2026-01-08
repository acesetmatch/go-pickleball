from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.config import settings
from app.database import get_db
from app.models import UserPreferences, PaddleRecommendation
from app.recommendation.engine import RecommendationEngine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Paddle Recommendation API",
    description="AI-powered pickleball paddle recommendations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize recommendation engine
recommendation_engine = RecommendationEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize vector store on startup"""
    db = next(get_db())
    try:
        recommendation_engine.initialize(db, force_sync=False)
        logger.info("Recommendation engine initialized")
    finally:
        db.close()

@app.post("/api/recommendations", response_model=List[PaddleRecommendation])
async def get_recommendations(
    preferences: UserPreferences,
    db: Session = Depends(get_db)
) -> List[PaddleRecommendation]:
    """Get paddle recommendations based on user preferences"""
    try:
        recommendations = recommendation_engine.get_recommendations(
            db=db,
            preferences=preferences,
            limit=5
        )

        if not recommendations:
            raise HTTPException(status_code=404, detail="No recommendations found")

        return recommendations

    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "paddle-recommendation"}

@app.post("/api/sync-paddles")
async def sync_paddles(
    force: bool = False,
    db: Session = Depends(get_db)
):
    """Manually trigger paddle sync to vector store"""
    try:
        recommendation_engine.initialize(db, force_sync=force)
        return {"status": "success", "message": "Paddles synced to vector store"}
    except Exception as e:
        logger.error(f"Error syncing paddles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
