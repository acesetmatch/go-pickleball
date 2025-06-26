import os
import json
import logging
import argparse
import asyncio
import hashlib
import time
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
import re
import random

# Load environment variables from .env file
load_dotenv()

# ANSI color codes for colored logging
class ColoredFormatter(logging.Formatter):
    """Custom formatter to add colors to log messages."""
    
    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[97m',      # Bright White
        'INFO': '\033[94m',       # Bright Blue
        'SUCCESS': '\033[92m',    # Bright Green for success messages
        'WARNING': '\033[93m',    # Bright Yellow
        'ERROR': '\033[91m',      # Bright Red
        'CRITICAL': '\033[97;41m' # White on Red
    }
    RESET = '\033[0m'
    
    def format(self, record):
        # Get the original formatted message
        formatted_msg = super().format(record)
        
        # Check if this is a success message
        if hasattr(record, 'success') and record.success:
            return f"{self.COLORS['SUCCESS']}{formatted_msg}{self.RESET}"
        
        # Add color based on log level
        if record.levelname in self.COLORS:
            return f"{self.COLORS[record.levelname]}{formatted_msg}{self.RESET}"
        return formatted_msg

# Configure logging with colors
def setup_colored_logging(log_level):
    """Set up colored logging with the specified log level."""
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove any existing handlers
    for handler in root_logger.handlers:
        root_logger.removeHandler(handler)
    
    # Create console handler with colored formatter
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    
    # Create colored formatter
    formatter = ColoredFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    
    # Add the handler to the root logger
    root_logger.addHandler(console_handler)

# Data classes mirroring Go structs
@dataclass
class Metadata:
    brand: str
    model: str
    source: str  # New field to store the scraping source

@dataclass
class Specs:
    shape: str
    surface: str
    average_weight: float
    core: float
    paddle_length: float
    paddle_width: float
    grip_length: float
    grip_type: str
    grip_circumference: float

@dataclass
class Performance:
    power: float
    pop: float
    spin: float
    twist_weight: float
    swing_weight: float
    balance_point: float

@dataclass
class Paddle:
    id: str
    metadata: Metadata
    specs: Specs
    performance: Performance

# Helper functions
def generate_paddle_id(brand: str, model: str) -> str:
    """Generate a paddle ID from brand and model."""
    brand = brand.lower().replace(" ", "-")
    model = model.lower().replace(" ", "-")
    return f"{brand}-{model}"

def extract_float(text: str) -> Optional[float]:
    """Extract a float from text, handling fractions and mixed numbers."""
    if not text:
        return None
    
    # Remove common units and clean up
    text = text.replace('in', '').replace('oz', '').replace('ounces', '').strip()
    
    # Handle mixed numbers like "4 1/4"
    if ' ' in text:
        parts = text.split()
        if len(parts) == 2:
            try:
                whole = float(parts[0])
                if '/' in parts[1]:
                    frac_parts = parts[1].split('/')
                    if len(frac_parts) == 2:
                        fraction = float(frac_parts[0]) / float(frac_parts[1])
                        return whole + fraction
            except (ValueError, ZeroDivisionError):
                pass
    
    # Handle simple fractions like "1/4"
    if '/' in text and text.count('/') == 1:
        try:
            frac_parts = text.split('/')
            return float(frac_parts[0]) / float(frac_parts[1])
        except (ValueError, ZeroDivisionError):
            pass
    
    # Handle regular numbers
    match = re.search(r'(\d+\.?\d*)', text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    
    return None

# Base Scraper
class PaddleScraper(ABC):
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Set up detailed debug logger
        self.logger = logging.getLogger(f"PaddleScraper.{self.__class__.__name__}")
        self.logger.setLevel(logging.DEBUG)  # Set to DEBUG for detailed logging
    
    def get_page(self, url: str) -> BeautifulSoup:
        """Get a webpage and return BeautifulSoup object."""
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error fetching {url}: {e}")
            return None
    
    def rate_limit(self):
        """Implement rate limiting."""
        time.sleep(random.uniform(1, 3))
    
    @abstractmethod
    def get_paddle_urls(self) -> List[str]:
        """Get URLs for individual paddle pages."""
        pass
    
    @abstractmethod
    def scrape_paddle(self, url: str) -> Optional[Paddle]:
        """Scrape a single paddle page."""
        pass
    
    def scrape_all(self) -> List[Paddle]:
        """Scrape all paddles."""
        paddle_urls = self.get_paddle_urls()
        paddles = []
        
        for url in paddle_urls:
            self.logger.info(f"Scraping {url}")
            paddle = self.scrape_paddle(url)
            if paddle:
                paddles.append(paddle)
            self.rate_limit()
        
        return paddles

def main():
    """Main function to test the scrapers."""
    setup_colored_logging(logging.INFO)
    
    # Import the actual scraper classes from their respective files
    from galaxy_scraper import PickleballGalaxyScraper
    from central_scraper import scrape_central_paddles
    
    # Test Galaxy scraper
    galaxy_scraper = PickleballGalaxyScraper()
    galaxy_paddles = galaxy_scraper.scrape_all()
    log_success(logging.getLogger(), f"Galaxy scraper found {len(galaxy_paddles)} paddles")
    
    # Save Galaxy paddles to JSON
    if galaxy_paddles:
        galaxy_data = [asdict(paddle) for paddle in galaxy_paddles]
        with open('scraped_paddles_galaxy.json', 'w') as f:
            json.dump(galaxy_data, f, indent=2)
        log_success(logging.getLogger(), f"Saved {len(galaxy_paddles)} Galaxy paddles to scraped_paddles_galaxy.json")
    
    # Test Central scraper
    central_paddles = scrape_central_paddles()
    log_success(logging.getLogger(), f"Central scraper found {len(central_paddles)} paddles")
    
    # Save Central paddles to JSON
    if central_paddles:
        central_data = [asdict(paddle) for paddle in central_paddles]
        with open('scraped_paddles_central.json', 'w') as f:
            json.dump(central_data, f, indent=2)
        log_success(logging.getLogger(), f"Saved {len(central_paddles)} Central paddles to scraped_paddles_central.json")

# Add this after the logger definition
def log_success(logger, message):
    """Log a success message in green color."""
    record = logging.LogRecord(
        name=logger.name,
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg=message,
        args=(),
        exc_info=None
    )
    record.success = True
    logger.handle(record)

if __name__ == "__main__":
    main() 