#!/usr/bin/env python3
"""
Test script for image downloading functionality.
"""

import logging
from image_downloader import download_image, extract_image_url_from_galaxy_html

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def test_image_download():
    """Test the image download functionality."""
    
    # Test with a sample image URL (using the closeup image from the HTML)
    test_url = "https://www.pickleballgalaxy.com/mm5/graphics/00000001/6/selk-era-elong-cyan_960x960.jpg"
    brand = "Selkirk"
    model = "SLK ERA Power Elongated"
    
    print(f"Testing image download...")
    print(f"URL: {test_url}")
    print(f"Brand: {brand}")
    print(f"Model: {model}")
    
    # Test the download
    result = download_image(test_url, brand, model, "test_images")
    
    if result:
        print(f"✅ Success! Image downloaded to: {result}")
    else:
        print("❌ Failed to download image")

def test_html_extraction():
    """Test the HTML image URL extraction."""
    
    # Sample HTML content from Pickleball Galaxy (actual product page structure)
    sample_html = '''
    <figure class="o-layout__item ie-layout-item u-text-center x-product-layout-images">
        <a data-mini-modal="" data-mini-modal-type="inline" href="#closeup_image" title="Selkirk SLK ERA Power Elongated Pickleball Paddle">
            <img id="main_image" class="x-product-layout-images__image" src="graphics/00000001/6/selk-era-elong-cyan_480x480.jpg" alt="Selkirk SLK ERA Power Elongated Pickleball Paddle" title="Selkirk SLK ERA Power Elongated Pickleball Paddle" style="cursor: pointer;">
        </a>
        <img id="closeup_image" class="u-hide-visually" src="graphics/00000001/6/selk-era-elong-cyan_960x960.jpg" alt="Selkirk SLK ERA Power Elongated Pickleball Paddle" title="Selkirk SLK ERA Power Elongated Pickleball Paddle" style="display: inline;">
    </figure>
    '''
    
    print(f"\nTesting HTML image URL extraction...")
    
    # Test the extraction
    result = extract_image_url_from_galaxy_html(sample_html)
    
    if result:
        print(f"✅ Success! Extracted URL: {result}")
    else:
        print("❌ Failed to extract image URL from HTML")

if __name__ == "__main__":
    print("🧪 Testing Image Download Functionality")
    print("=" * 50)
    
    test_html_extraction()
    test_image_download()
    
    print("\n✅ Test completed!") 