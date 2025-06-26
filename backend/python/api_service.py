import os
import json
import logging
from typing import List, Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from paddle_scraper import PaddleScraperService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("PaddleScraperAPI")

# Initialize FastAPI app
app = FastAPI(title="Paddle Scraper API", description="API for scraping pickleball paddle specifications")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scraper service
scraper_service = PaddleScraperService(model="deepseek-r1")

# Define request/response models
class ScrapeRequest(BaseModel):
    urls: List[HttpUrl]
    save_to_file: bool = False
    output_file: Optional[str] = None

class ScrapeResponse(BaseModel):
    job_id: str
    message: str

class PaddleData(BaseModel):
    metadata: Dict[str, Any]
    specs: Dict[str, Any]
    performance: Dict[str, Any]

class ScrapeResult(BaseModel):
    status: str
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

# Store background jobs
scrape_jobs = {}

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_paddles(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """
    Start a background job to scrape paddle specifications from the provided URLs.
    """
    # Generate a job ID
    import uuid
    job_id = str(uuid.uuid4())
    
    # Initialize job status
    scrape_jobs[job_id] = {
        "status": "pending",
        "urls": [str(url) for url in request.urls],
        "total_urls": len(request.urls),
        "completed_urls": 0,
        "results": [],
        "save_to_file": request.save_to_file,
        "output_file": request.output_file or f"paddle_scrape_{job_id}.json"
    }
    
    # Add scraping task to background tasks
    background_tasks.add_task(
        process_scrape_job,
        job_id=job_id
    )
    
    return ScrapeResponse(
        job_id=job_id,
        message=f"Scraping job started for {len(request.urls)} URLs"
    )

async def process_scrape_job(job_id: str):
    """Process a scraping job in the background"""
    job = scrape_jobs[job_id]
    job["status"] = "running"
    
    try:
        # Scrape the URLs
        results = await scraper_service.batch_scrape(job["urls"])
        
        # Save to file if requested
        if job["save_to_file"]:
            scraper_service.save_to_json(results, job["output_file"])
        
        # Update job status
        job["status"] = "completed"
        job["results"] = results
        job["completed_urls"] = len(results)
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        job["status"] = "failed"
        job["error"] = str(e)

@app.get("/jobs/{job_id}", response_model=ScrapeResult)
async def get_job_status(job_id: str):
    """
    Get the status and results of a scraping job.
    """
    if job_id not in scrape_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = scrape_jobs[job_id]
    
    return ScrapeResult(
        status=job["status"],
        data=job["results"] if job["status"] == "completed" else None,
        error=job.get("error")
    )

@app.get("/jobs", response_model=Dict[str, str])
async def list_jobs():
    """
    List all scraping jobs and their statuses.
    """
    return {job_id: job["status"] for job_id, job in scrape_jobs.items()}

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("api_service:app", host="0.0.0.0", port=8000, reload=True) 