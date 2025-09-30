import logging
import time
import random
import requests
from abc import ABC, abstractmethod
from typing import List, Optional
from bs4 import BeautifulSoup

from data_models import Paddle

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