import re
import random
import logging
import requests
import time
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
from data_models import Paddle, Metadata, Specs, Performance, generate_paddle_id, determine_paddle_shape_from_length, normalize_paddle_shape
from image_downloader import download_image

def scrape_central_paddles() -> List[Paddle]:
    """Scrape paddle data from Pickleball Central."""
    logging.info("Starting to scrape paddles from Pickleball Central")
    
    # Mock response for now - would be replaced with actual request
    response = requests.get("https://pickleballcentral.com/pickleball-paddles")
    soup = BeautifulSoup(response.content, "html.parser")
    
    paddles = []
    
    # Find all paddle product cards
    product_cards = soup.select("li.product article.card")
    logging.info(f"Found {len(product_cards)} paddle products")
    
    for card in product_cards:
        try:
            # Extract basic product information
            brand_elem = card.select_one("p.card-brand")
            title_elem = card.select_one("h3.card-title a")
            price_elem = card.select_one("span.price--withoutTax")
            desc_elem = card.select_one("div.tab-shortdescription")
            
            if not all([brand_elem, title_elem, price_elem]):
                continue
                
            brand = brand_elem.text.strip() if brand_elem else ""
            name = title_elem.text.strip() if title_elem else ""
            
            # Skip products with unknown brand and name
            if (not brand or brand.lower() == "unknown") and (not name or name.lower() == "unknown product"):
                logging.warning(f"Skipping product with unknown brand and name: {brand} {name}")
                continue
            
            # Clean up price text
            price_text = price_elem.text.strip() if price_elem else "0.00"
            price = float(price_text.replace('$', '').replace(',', ''))
            
            # Extract description
            description = desc_elem.text.strip() if desc_elem else ""
            
            # Get product URL and image URL
            product_url = ""
            if title_elem and title_elem.has_attr('href'):
                product_url = title_elem['href']
                
            image_url = ""
            img_elem = card.select_one(".card-image")
            if img_elem and img_elem.has_attr('src'):
                image_url = img_elem['src']
            
            # Visit product page to get detailed specifications
            specs = {}
            if product_url:
                specs = scrape_product_specs(product_url)
                # Add a small delay to avoid overloading the server
                time.sleep(random.uniform(1, 2))
            
            # Determine paddle shape
            shape = None
            
            # First try to determine shape from paddle length in specs
            if specs.get('paddle_length'):
                try:
                    # Extract numeric part and convert to float
                    length_text = specs['paddle_length']
                    length_match = re.search(r'(\d+\.?\d*)', length_text)
                    if length_match:
                        paddle_length = float(length_match.group(1))
                        shape = determine_paddle_shape_from_length(paddle_length)
                        shape = normalize_paddle_shape(shape)  # Ensure it matches Go backend expectations
                        logging.info(f"Determined shape '{shape}' from paddle length {paddle_length} for {name}")
                except (ValueError, TypeError) as e:
                    logging.warning(f"Could not parse paddle length from '{specs.get('paddle_length')}': {e}")
            
            # If shape still not determined, try to find info in the description
            if not shape:
                # Check description for shape keywords
                shape_keywords = {
                    "Elongated": ["elongated", "long", "16.5", "16.75"],
                    "Hybrid": ["hybrid", "16.25", "16.3"],
                    "Standard": ["standard", "traditional", "classic", "16", "16.0"]
                }
                
                for shape_type, keywords in shape_keywords.items():
                    for keyword in keywords:
                        if keyword.lower() in description.lower():
                            shape = shape_type
                            logging.info(f"Determined shape '{shape}' from description keyword '{keyword}' for {name}")
                            break
                    if shape:
                        break
            
            # Default to Standard if still no shape determined
            if not shape:
                shape = "Standard"
                logging.info(f"Defaulting to 'Standard' shape for {name}")
            
            # Create metadata and paddle objects using the correct data model structure
            metadata = Metadata(brand=brand, model=name, source="Pickleball Central")
            paddle_id = generate_paddle_id(brand, name)
            
            # Extract and download image
            image_url = None
            try:
                # Look for image in the card
                img_elem = card.select_one('.card-image img')
                if img_elem and img_elem.get('src'):
                    image_url = img_elem.get('src')
                    # Ensure we have the full URL
                    if image_url.startswith('/'):
                        image_url = f"https://pickleballcentral.com{image_url}"
                    elif not image_url.startswith('http'):
                        image_url = f"https://pickleballcentral.com/{image_url}"
                
                if image_url:
                    logging.info(f"Found image URL: {image_url}")
                    # Download the image
                    local_image_path = download_image(image_url, brand, name, "images")
                    if local_image_path:
                        logging.info(f"Successfully downloaded image to: {local_image_path}")
                    else:
                        logging.warning(f"Failed to download image from: {image_url}")
                else:
                    logging.warning("No image URL found on the card")
                    
            except Exception as e:
                logging.error(f"Error extracting/downloading image: {e}")
            
            # Create basic specs (you may want to extract more detailed specs)
            paddle_specs = Specs(
                shape=shape,
                surface="Carbon Fiber",  # Default, should be extracted from specs
                average_weight=215.0,    # Default, should be extracted from specs
                core=14.5,              # Default, should be extracted from specs
                paddle_length=16.0,     # Default, should be extracted from specs
                paddle_width=7.5,       # Default, should be extracted from specs
                grip_length=5.0,        # Default, should be extracted from specs
                grip_type="Standard",   # Default, should be extracted from specs
                grip_circumference=4.25 # Default, should be extracted from specs
            )
            
            # Create performance metrics (could be randomized or calculated)
            performance = Performance(
                power=80.0 + random.uniform(-5, 5),
                pop=75.0 + random.uniform(-5, 5),
                spin=3000.0 + random.uniform(-400, 400),
                twist_weight=200.0 + random.uniform(-15, 15),
                swing_weight=215.0 + random.uniform(-15, 15),
                balance_point=29.0 + random.uniform(-2, 2)
            )
            
            # Create the paddle object
            paddle = Paddle(
                id=paddle_id,
                metadata=metadata,
                specs=paddle_specs,
                performance=performance
            )
            
            paddles.append(paddle)
            
        except Exception as e:
            logging.error(f"Error processing paddle card: {e}")
    
    logging.info(f"Successfully scraped {len(paddles)} paddles from Pickleball Central")
    return paddles

def scrape_product_specs(product_url: str) -> Dict[str, str]:
    """Scrape detailed specifications from a product page."""
    logging.info(f"Scraping specs from {product_url}")
    specs = {}
    
    try:
        response = requests.get(product_url)
        if response.status_code != 200:
            logging.error(f"Failed to fetch product page: {response.status_code}")
            return specs
            
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Find the specifications tab content
        spec_tab = soup.select_one("#tab-spec .tab-inner")
        if not spec_tab:
            logging.error(f"Could not find specs tab for {product_url}")
            return specs
        
        # Extract the raw text content
        spec_text = spec_tab.text.strip()
        
        # Parse the specifications from the text
        spec_patterns = {
            'average_weight': r'Average Weight:\s*([\d\.]+\s*(?:ounces|oz))',
            'weight_range': r'Weight Range:\s*([\d\.\s\-]+\s*(?:ounces|oz))',
            'grip_circumference': r'Grip Circumference:\s*([^"<>\n\r]+)',
            'grip_style': r'Grip Style:\s*([^"<>\n\r]+)',
            'grip_manufacturer': r'Grip Manufacturer:\s*([^"<>\n\r]+)',
            'handle_length': r'Handle Length:\s*([^"<>\n\r]+)',
            'paddle_length': r'Paddle Length:\s*([^"<>\n\r]+)',
            'paddle_width': r'Paddle Width:\s*([^"<>\n\r]+)',
            'paddle_face': r'Paddle Face:\s*([^"<>\n\r]+)',
            'core_material': r'Core Material:\s*([^"<>\n\r]+)',
            'core_thickness': r'Core Thickness:\s*([^"<>\n\r]+)',
            'edge_guard': r'Edge Guard:\s*([^"<>\n\r]+)',
            'manufacturer': r'Manufacturer:\s*([^"<>\n\r]+)',
            'approvals': r'Approvals:\s*([^"<>\n\r]+)',
            'made_in': r'Made in\s*([^"<>\n\r]+)'
        }
        
        for spec_key, pattern in spec_patterns.items():
            match = re.search(pattern, spec_text)
            if match:
                specs[spec_key] = match.group(1).strip()
        
        # For specifications that span multiple lines, we need to extract differently
        for line in spec_text.split('\n'):
            line = line.strip()
            # Look for lines with a colon that weren't captured by the regex patterns
            if ':' in line and not any(key in specs for key in spec_patterns if line.startswith(key.replace('_', ' ').title())):
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key = parts[0].strip().lower().replace(' ', '_')
                    value = parts[1].strip()
                    if key and value and key not in specs:
                        specs[key] = value
    
    except Exception as e:
        logging.error(f"Error scraping product specs from {product_url}: {e}")
    
    return specs

# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    paddles = scrape_central_paddles()
    for i, paddle in enumerate(paddles[:5]):  # Show first 5 as examples
        print(f"Paddle {i+1}: {paddle.metadata.model} ({paddle.specs.shape}) - ${paddle.specs.average_weight}")
        if hasattr(paddle.specs, 'paddle_length'):
            print(f"  Length: {paddle.specs.paddle_length}")
        if hasattr(paddle.specs, 'paddle_width'):
            print(f"  Width: {paddle.specs.paddle_width}")
        if hasattr(paddle.specs, 'average_weight'):
            print(f"  Weight: {paddle.specs.average_weight}")
        if hasattr(paddle.specs, 'core'):
            print(f"  Core: {paddle.specs.core}")
        if hasattr(paddle.specs, 'surface'):
            print(f"  Surface: {paddle.specs.surface}")
        if hasattr(paddle.specs, 'grip_circumference'):
            print(f"  Grip Circumference: {paddle.specs.grip_circumference}")
        if hasattr(paddle.specs, 'grip_type'):
            print(f"  Grip Type: {paddle.specs.grip_type}")
        if hasattr(paddle.specs, 'grip_length'):
            print(f"  Grip Length: {paddle.specs.grip_length}")
        if hasattr(paddle.specs, 'grip_manufacturer'):
            print(f"  Grip Manufacturer: {paddle.specs.grip_manufacturer}")
        if hasattr(paddle.specs, 'handle_length'):
            print(f"  Handle Length: {paddle.specs.handle_length}")
        if hasattr(paddle.specs, 'paddle_face'):
            print(f"  Paddle Face: {paddle.specs.paddle_face}")
        if hasattr(paddle.specs, 'core_material'):
            print(f"  Core Material: {paddle.specs.core_material}")
        if hasattr(paddle.specs, 'core_thickness'):
            print(f"  Core Thickness: {paddle.specs.core_thickness}")
        if hasattr(paddle.specs, 'edge_guard'):
            print(f"  Edge Guard: {paddle.specs.edge_guard}")
        if hasattr(paddle.specs, 'manufacturer'):
            print(f"  Manufacturer: {paddle.specs.manufacturer}")
        if hasattr(paddle.specs, 'approvals'):
            print(f"  Approvals: {paddle.specs.approvals}")
        if hasattr(paddle.specs, 'made_in'):
            print(f"  Made In: {paddle.specs.made_in}")
        if hasattr(paddle, 'performance'):
            print("  Performance:")
            print(f"    Power: {paddle.performance.power}")
            print(f"    Pop: {paddle.performance.pop}")
            print(f"    Spin: {paddle.performance.spin}")
            print(f"    Twist Weight: {paddle.performance.twist_weight}")
            print(f"    Swing Weight: {paddle.performance.swing_weight}")
            print(f"    Balance Point: {paddle.performance.balance_point}") 