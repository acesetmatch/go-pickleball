#!/usr/bin/env python3
"""
Test script for pagination implementation on Matt's Pickleball website.
This script tests different approaches to extract more paddle URLs.
"""

import logging
from firecrawl_service import FirecrawlScrapingService
import time

def test_pagination_strategies():
    """Test different pagination strategies to find the most effective approach."""
    
    logging.basicConfig(level=logging.INFO)
    service = FirecrawlScrapingService()
    
    print("=== Testing Pagination Strategies ===\n")
    
    # Strategy 1: Single main page scrape
    print("Strategy 1: Single main page scrape")
    result = service.scrape_url("https://paddles.mattspickleball.com/")
    paddle_urls_main = service._extract_paddle_urls_from_content(result)
    print(f"Main page URLs found: {len(paddle_urls_main)}")
    
    time.sleep(2)  # Rate limit buffer
    
    # Strategy 2: Try different URL patterns
    print("\nStrategy 2: Different URL patterns")
    test_urls = [
        "https://paddles.mattspickleball.com/?limit=50",
        "https://paddles.mattspickleball.com/?per_page=50", 
        "https://paddles.mattspickleball.com/?count=50",
    ]
    
    all_unique_urls = set(paddle_urls_main)
    
    for test_url in test_urls:
        try:
            print(f"Testing: {test_url}")
            result = service.scrape_url(test_url)
            urls = service._extract_paddle_urls_from_content(result)
            new_urls = [url for url in urls if url not in all_unique_urls]
            all_unique_urls.update(new_urls)
            print(f"  Found {len(urls)} URLs, {len(new_urls)} new")
            time.sleep(2)  # Rate limit buffer
        except Exception as e:
            print(f"  Error: {e}")
            if "Rate Limit" in str(e):
                print("  Rate limit hit, waiting...")
                time.sleep(30)
    
    print(f"\nTotal unique paddle URLs discovered: {len(all_unique_urls)}")
    
    # Strategy 3: Scrape a few individual paddles efficiently
    print(f"\nStrategy 3: Scrape individual paddles (limit 5 for testing)")
    paddle_list = list(all_unique_urls)[:5]
    
    successful_paddles = []
    for i, paddle_url in enumerate(paddle_list):
        try:
            print(f"Scraping paddle {i+1}/5: {paddle_url}")
            paddle_data = service.scrape_individual_paddle(paddle_url)
            if paddle_data:
                successful_paddles.append(paddle_data)
                print(f"  Success: {paddle_data.get('name', 'Unknown')} - {paddle_data.get('brand', 'Unknown')}")
            time.sleep(3)  # Longer delay between individual scrapes
        except Exception as e:
            print(f"  Error: {e}")
            if "Rate Limit" in str(e):
                print("  Rate limit hit, stopping test")
                break
    
    print(f"\nTest Results:")
    print(f"- Total paddle URLs found: {len(all_unique_urls)}")
    print(f"- Successfully scraped paddles: {len(successful_paddles)}")
    
    return list(all_unique_urls), successful_paddles

if __name__ == "__main__":
    urls, paddles = test_pagination_strategies()
