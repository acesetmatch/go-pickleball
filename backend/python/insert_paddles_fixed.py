#!/usr/bin/env python3
"""
Script to insert scraped paddles from JSON file into the database with data validation fixes.
"""

import json
import requests
import logging
from typing import List, Dict, Any
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PaddleInserter:
    def __init__(self, api_base_url: str = "http://localhost:8080"):
        self.api_base_url = api_base_url
        
    def load_paddles_from_json(self, json_file_path: str) -> List[Dict[str, Any]]:
        """Load paddles from JSON file."""
        try:
            with open(json_file_path, 'r') as f:
                paddles = json.load(f)
            logger.info(f"Loaded {len(paddles)} paddles from {json_file_path}")
            return paddles
        except Exception as e:
            logger.error(f"Error loading JSON file: {e}")
            return []
    
    def fix_paddle_data(self, paddle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fix common data issues in paddle data."""
        # Fix null average_weight
        if paddle_data["specs"].get("average_weight") is None:
            paddle_data["specs"]["average_weight"] = 8.0  # Default weight
        
        # Fix null core
        if paddle_data["specs"].get("core") is None:
            paddle_data["specs"]["core"] = 16.0  # Default core thickness
        
        return paddle_data
    
    def transform_paddle_data(self, paddle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform the JSON data to match the API format for /api/paddles."""
        # Fix data issues first
        paddle_data = self.fix_paddle_data(paddle_data)
        
        # Remove 'id' and 'source' from metadata, keep only brand and model
        meta = {
            "brand": paddle_data["metadata"]["brand"],
            "model": paddle_data["metadata"]["model"]
        }
        
        return {
            "metadata": meta,
            "specs": paddle_data["specs"],
            "performance": paddle_data["performance"]
        }
    
    def insert_paddle(self, paddle_data: Dict[str, Any]) -> bool:
        """Insert a single paddle into the database via API."""
        try:
            response = requests.post(
                f"{self.api_base_url}/api/paddles",
                json=paddle_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 201:
                logger.info(f"Successfully inserted paddle: {paddle_data['metadata']['brand']} {paddle_data['metadata']['model']}")
                return True
            elif response.status_code == 409:
                logger.warning(f"Paddle already exists: {paddle_data['metadata']['brand']} {paddle_data['metadata']['model']}")
                return True  # Consider this a success since the paddle exists
            else:
                logger.error(f"Failed to insert paddle {paddle_data['metadata']['brand']} {paddle_data['metadata']['model']}: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error for paddle {paddle_data['metadata']['brand']} {paddle_data['metadata']['model']}: {e}")
            return False
    
    def insert_paddles(self, json_file_path: str, batch_size: int = 10) -> None:
        """Insert all paddles from JSON file into database."""
        paddles = self.load_paddles_from_json(json_file_path)
        
        if not paddles:
            logger.error("No paddles to insert")
            return
        
        successful_inserts = 0
        failed_inserts = 0
        
        logger.info(f"Starting to insert {len(paddles)} paddles...")
        
        for i, paddle_data in enumerate(paddles):
            # Transform the data to match API format
            transformed_paddle = self.transform_paddle_data(paddle_data)
            
            # Insert the paddle
            if self.insert_paddle(transformed_paddle):
                successful_inserts += 1
            else:
                failed_inserts += 1
            
            # Add a small delay to avoid overwhelming the server
            time.sleep(0.1)
            
            # Log progress every batch_size
            if (i + 1) % batch_size == 0:
                logger.info(f"Progress: {i + 1}/{len(paddles)} paddles processed")
        
        logger.info(f"Insertion complete! Successful: {successful_inserts}, Failed: {failed_inserts}")

def main():
    """Main function to run the paddle insertion."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Insert scraped paddles into database")
    parser.add_argument("--json-file", default="scraped_paddles_galaxy.json", 
                       help="Path to JSON file containing paddle data")
    parser.add_argument("--api-url", default="http://localhost:8080",
                       help="Base URL of the API server")
    parser.add_argument("--batch-size", type=int, default=10,
                       help="Number of paddles to process before logging progress")
    
    args = parser.parse_args()
    
    inserter = PaddleInserter(args.api_url)
    inserter.insert_paddles(args.json_file, args.batch_size)

if __name__ == "__main__":
    main()
