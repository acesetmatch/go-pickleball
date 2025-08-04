import os
import requests
import logging
from urllib.parse import urljoin, urlparse
from typing import Optional
import re

def sanitize_filename(filename: str) -> str:
    """Sanitize a filename by removing invalid characters."""
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove extra spaces and replace with underscores
    filename = re.sub(r'\s+', '_', filename)
    # Remove leading/trailing spaces and dots
    filename = filename.strip(' .')
    return filename

def download_image(image_url: str, brand: str, model: str, base_folder: str = "images") -> Optional[str]:
    """
    Download an image and save it to the specified folder.
    
    Args:
        image_url: The URL of the image to download
        brand: The paddle brand name
        model: The paddle model name
        base_folder: The base folder to save images in
        
    Returns:
        The local file path if successful, None if failed
    """
    if not image_url:
        logging.warning("No image URL provided")
        return None
    
    try:
        # Create the images folder if it doesn't exist
        os.makedirs(base_folder, exist_ok=True)
        
        # Create brand subfolder
        brand_folder = os.path.join(base_folder, sanitize_filename(brand))
        os.makedirs(brand_folder, exist_ok=True)
        
        # Generate filename from brand and model
        filename = f"{sanitize_filename(brand)}_{sanitize_filename(model)}"
        
        # Get file extension from URL
        parsed_url = urlparse(image_url)
        path = parsed_url.path
        if '.' in path:
            extension = path.split('.')[-1].lower()
            # Only allow common image extensions
            if extension not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                extension = 'jpg'  # Default to jpg
        else:
            extension = 'jpg'
        
        filename = f"{filename}.{extension}"
        filepath = os.path.join(brand_folder, filename)
        
        # Check if file already exists
        if os.path.exists(filepath):
            logging.info(f"Image already exists: {filepath}")
            return filepath
        
        # Download the image
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(image_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Save the image
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        logging.info(f"Successfully downloaded image: {filepath}")
        return filepath
        
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to download image from {image_url}: {e}")
        return None
    except Exception as e:
        logging.error(f"Error saving image {image_url}: {e}")
        return None

def extract_image_url_from_galaxy_html(html_content: str) -> Optional[str]:
    """
    Extract image URL from Pickleball Galaxy HTML content.
    
    Args:
        html_content: The HTML content containing the image
        
    Returns:
        The image URL if found, None otherwise
    """
    try:
        import re
        
        # Priority 1: Look for the closeup image (960x960) - highest quality
        img_pattern = r'<img[^>]*id="closeup_image"[^>]*src="([^"]+)"'
        match = re.search(img_pattern, html_content)
        
        if match:
            image_url = match.group(1)
            if (image_url.startswith('graphics/') and 
                not image_url.endswith('blank.gif') and
                not 'logo' in image_url.lower() and
                not 'header' in image_url.lower() and
                not 'banner' in image_url.lower()):
                image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                return image_url
        
        # Priority 2: Look for the main product image (480x480)
        img_pattern = r'<img[^>]*id="main_image"[^>]*src="([^"]+)"'
        match = re.search(img_pattern, html_content)
        
        if match:
            image_url = match.group(1)
            if (image_url.startswith('graphics/') and 
                not image_url.endswith('blank.gif') and
                not 'logo' in image_url.lower() and
                not 'header' in image_url.lower() and
                not 'banner' in image_url.lower()):
                image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                return image_url
        
        # Priority 3: Look for any product image in the layout
        img_pattern = r'<img[^>]*class="[^"]*x-product-layout-images__image[^"]*"[^>]*src="([^"]+)"'
        match = re.search(img_pattern, html_content)
        
        if match:
            image_url = match.group(1)
            if (image_url.startswith('graphics/') and 
                not image_url.endswith('blank.gif') and
                not 'logo' in image_url.lower() and
                not 'header' in image_url.lower() and
                not 'banner' in image_url.lower()):
                image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                return image_url
        
        # Priority 4: Look for any image with graphics in src (but avoid thumbnails and logos)
        img_pattern_fallback = r'<img[^>]*src="([^"]*graphics[^"]*)"'
        matches = re.findall(img_pattern_fallback, html_content)
        
        for image_url in matches:
            if (image_url.startswith('graphics/') and 
                not image_url.endswith('blank.gif') and 
                not image_url.endswith('_80x80.jpg') and
                not image_url.endswith('_80x80.png') and
                not 'logo' in image_url.lower() and
                not 'header' in image_url.lower() and
                not 'banner' in image_url.lower() and
                # Make sure it looks like a product image (has dimensions in filename)
                ('_480x480' in image_url or '_960x960' in image_url)):
                image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                return image_url
            
        return None
        
    except Exception as e:
        logging.error(f"Error extracting image URL from HTML: {e}")
        return None 