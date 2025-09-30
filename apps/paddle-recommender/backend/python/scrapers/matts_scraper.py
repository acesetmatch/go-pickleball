import re
import random
import logging
from typing import List, Optional

from base_scraper import PaddleScraper
from data_models import Paddle, Metadata, Specs, Performance, generate_paddle_id, extract_float, clean_model_name, determine_paddle_shape_from_length, normalize_paddle_shape
from image_downloader import download_image

class MattsPickleballScraper(PaddleScraper):
    def __init__(self):
        super().__init__("https://www.mattspickleball.com")
    
    def get_paddle_urls(self) -> List[str]:
        """Get URLs for individual paddle pages from Matt's Pickleball catalog."""
        paddle_urls = []
        catalog_url = f"{self.base_url}/pickleball-paddle-catalog"
        
        self.logger.info(f"Fetching paddle catalog: {catalog_url}")
        
        soup = self.get_page(catalog_url)
        if not soup:
            self.logger.error("Failed to fetch catalog page")
            return paddle_urls
        
        # Look for paddle links in the catalog
        # Based on the structure, links should be in format: /paddle-database/{paddle-name}
        paddle_links = soup.select('a[href*="/paddle-database/"]')
        
        if not paddle_links:
            # Fallback: look for any links containing "VIEW PADDLE" text
            paddle_links = soup.find_all('a', string=re.compile(r'VIEW PADDLE', re.IGNORECASE))
            if not paddle_links:
                # Another fallback: look for links in the catalog structure
                paddle_links = soup.select('a[href^="/paddle-database/"]')
        
        self.logger.info(f"Found {len(paddle_links)} paddle links")
        
        for link in paddle_links:
            href = link.get('href')
            if href and '/paddle-database/' in href:
                # Ensure we have the full URL
                if not href.startswith('http'):
                    if href.startswith('/'):
                        href = f"{self.base_url}{href}"
                    else:
                        href = f"{self.base_url}/{href}"
                paddle_urls.append(href)
                self.logger.debug(f"Found paddle link: {href}")
        
        self.logger.info(f"Found total of {len(paddle_urls)} paddle URLs")
        return paddle_urls
    
    def scrape_paddle(self, url: str) -> Optional[Paddle]:
        """Scrape a single paddle page from Matt's Pickleball."""
        soup = self.get_page(url)
        if not soup:
            return None
        
        try:
            self.logger.info(f"Scraping paddle details from {url}")
            missing_fields = []
            
            # Extract paddle name from URL as fallback
            url_parts = url.split('/')
            url_paddle_name = url_parts[-1] if url_parts else "unknown"
            url_paddle_name = url_paddle_name.replace('-', ' ').title()
            
            # Extract title - try multiple selectors
            title_elem = None
            title_selectors = [
                'h1',
                '.paddle-title',
                '.product-title',
                'title'
            ]
            
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem and title_elem.text.strip():
                    break
            
            if title_elem:
                title_text = title_elem.text.strip()
                self.logger.debug(f"Found title: {title_text}")
            else:
                title_text = url_paddle_name
                self.logger.warning(f"No title found, using URL-derived name: {title_text}")
                missing_fields.append("title")
            
            # Extract brand and model from title
            # Common brands that might appear on Matt's site
            common_brands = [
                "Selkirk", "Engage", "Joola", "Paddletek", "Gearbox", "Franklin", 
                "CRBN", "Diadem", "HEAD", "Gamma", "Players", "Adidas", "OneShot", 
                "Electrum", "SLK", "Legacy Pro", "Rokne", "Babolat", "TMPR", 
                "Pickleball Apes", "ProKennex", "Vulcan", "Wilson", "Onix", "Prince", 
                "Rally", "PROLITE", "Pro-Lite", "Ronbus", "Bread & Butter", 
                "Honolulu Pickleball Co", "Scoop Pickleball", "Body Helix", "Sypik",
                "Facolos Pickleball", "ProXR", "Le Cornichon", "Rich Cat Supply",
                "Addict Pickleball", "Thrive", "Mark Pickleball", "Friday Pickleball",
                "Chorus", "E6 Pickleball", "GRÜVN", "Enhance Pickleball", "Vatic Pro"
            ]
            
            # Try to find brand in the title or page content
            brand = None
            for possible_brand in common_brands:
                if possible_brand.lower() in title_text.lower():
                    brand = possible_brand
                    self.logger.debug(f"Found brand: {brand}")
                    break
            
            # If no brand found, try to extract from page content
            if not brand:
                # Look for brand information in the page
                brand_elem = soup.select_one('.brand, .manufacturer, [class*="brand"], [class*="manufacturer"]')
                if brand_elem:
                    brand = brand_elem.text.strip()
                    self.logger.debug(f"Found brand from element: {brand}")
                else:
                    # Extract first word as brand fallback
                    words = title_text.split()
                    if words:
                        brand = words[0]
                        self.logger.debug(f"Using first word as brand: {brand}")
            
            if not brand:
                brand = "Unknown"
                self.logger.warning(f"Could not extract brand from title: {title_text}")
                missing_fields.append("brand")
            
            # Extract model by removing brand name
            model = title_text
            if brand != "Unknown":
                # Remove brand name from title
                pattern = re.compile(f"^{re.escape(brand)}\\s+", re.IGNORECASE)
                model = pattern.sub("", model).strip()
            
            # Clean up model name
            model = clean_model_name(model)
            
            if not model:
                model = "Unknown Model"
                self.logger.warning(f"Empty model name after processing title: {title_text}")
                missing_fields.append("model")
            
            self.logger.info(f"Final metadata - Brand: {brand}, Model: {model}")
            
            # Extract specifications
            specs_data = {}
            
            # Look for specification sections
            spec_sections = soup.select('.specs, .specifications, .paddle-specs, [class*="spec"]')
            for section in spec_sections:
                # Look for key-value pairs
                spec_items = section.find_all(['li', 'p', 'div'])
                for item in spec_items:
                    item_text = item.get_text(strip=True)
                    if ':' in item_text:
                        key, value = item_text.split(':', 1)
                        key = key.strip().lower()
                        value = value.strip()
                        specs_data[key] = value
                        self.logger.debug(f"Extracted spec: '{key}' = '{value}'")
            
            # Also look for specs in table format
            tables = soup.select('table')
            for table in tables:
                rows = table.select('tr')
                for row in rows:
                    cells = row.select('td, th')
                    if len(cells) >= 2:
                        key = cells[0].get_text(strip=True).lower()
                        value = cells[1].get_text(strip=True)
                        if key and value:
                            specs_data[key] = value
                            self.logger.debug(f"Extracted table spec: '{key}' = '{value}'")
            
            # Extract core thickness from model name (common pattern: "16mm", "14mm", etc.)
            core_thickness = None
            core_match = re.search(r'(\d+\.?\d*)\s*mm', title_text, re.IGNORECASE)
            if core_match:
                core_thickness = float(core_match.group(1))
                self.logger.info(f"Extracted core thickness from title: {core_thickness}mm")
            
            # Try to extract from specs
            for key in ['core thickness', 'core', 'thickness']:
                if key in specs_data:
                    core_str = specs_data[key].replace('mm', '').strip()
                    extracted_core = extract_float(core_str)
                    if extracted_core:
                        core_thickness = extracted_core
                        break
            
            # Extract other specs with fallbacks
            length = None
            for key in ['paddle length', 'length']:
                if key in specs_data:
                    length_str = specs_data[key].replace('in', '').strip()
                    length = extract_float(length_str)
                    if length:
                        break
            
            width = None
            for key in ['paddle width', 'width']:
                if key in specs_data:
                    width_str = specs_data[key].replace('in', '').strip()
                    width = extract_float(width_str)
                    if width:
                        break
            
            weight = None
            for key in ['weight', 'average weight']:
                if key in specs_data:
                    weight_str = specs_data[key].replace('oz', '').replace('ounces', '').strip()
                    # Handle weight ranges
                    if '-' in weight_str:
                        weight_parts = weight_str.split('-')
                        if len(weight_parts) == 2:
                            try:
                                min_weight = float(weight_parts[0].strip())
                                max_weight = float(weight_parts[1].strip())
                                weight = (min_weight + max_weight) / 2
                            except ValueError:
                                pass
                    else:
                        weight = extract_float(weight_str)
                    if weight:
                        break
            
            # Determine shape from length or title
            shape = None
            if length:
                shape = determine_paddle_shape_from_length(length)
                shape = normalize_paddle_shape(shape)
            else:
                # Try to determine from title/model name
                if any(word in title_text.lower() for word in ['elongated', 'long']):
                    shape = "Elongated"
                elif any(word in title_text.lower() for word in ['hybrid']):
                    shape = "Hybrid"
                elif any(word in title_text.lower() for word in ['wide', 'widebody']):
                    shape = "Wide-body"
                else:
                    shape = "Standard"  # Default
            
            # Extract surface material
            surface = None
            for key in ['surface', 'face', 'material']:
                if key in specs_data:
                    surface_text = specs_data[key].lower()
                    if "carbon" in surface_text and "fiber" in surface_text:
                        surface = "Carbon Fiber"
                    elif "fiberglass" in surface_text:
                        surface = "Fiberglass"
                    elif "graphite" in surface_text:
                        surface = "Graphite"
                    elif "composite" in surface_text:
                        surface = "Composite"
                    else:
                        surface = specs_data[key]
                    break
            
            # Extract grip specs
            grip_length = None
            for key in ['grip length', 'handle length']:
                if key in specs_data:
                    grip_str = specs_data[key].replace('in', '').strip()
                    grip_length = extract_float(grip_str)
                    if grip_length:
                        break
            
            grip_type = None
            for key in ['grip type', 'grip', 'handle']:
                if key in specs_data:
                    grip_type = specs_data[key]
                    break
            
            grip_circumference = None
            for key in ['grip circumference', 'grip size']:
                if key in specs_data:
                    grip_str = specs_data[key].replace('in', '').strip()
                    grip_circumference = extract_float(grip_str)
                    if grip_circumference:
                        break
            
            # Log extracted values
            self.logger.info(f"Extracted specifications:")
            self.logger.info(f"  Shape: {shape}")
            self.logger.info(f"  Surface: {surface}")
            self.logger.info(f"  Weight: {weight}")
            self.logger.info(f"  Core: {core_thickness}")
            self.logger.info(f"  Length: {length}")
            self.logger.info(f"  Width: {width}")
            self.logger.info(f"  Grip Length: {grip_length}")
            self.logger.info(f"  Grip Type: {grip_type}")
            self.logger.info(f"  Grip Circumference: {grip_circumference}")
            
            # Create specs object
            specs = Specs(
                shape=shape,
                surface=surface,
                average_weight=weight,
                core=core_thickness,
                paddle_length=length,
                paddle_width=width,
                grip_length=grip_length,
                grip_type=grip_type,
                grip_circumference=grip_circumference
            )
            
            # Performance data is not typically available on Matt's site
            performance = None
            
            # Create metadata and paddle
            metadata = Metadata(brand=brand, model=model, source="Matt's Pickleball")
            paddle_id = generate_paddle_id(brand, model)
            
            # Try to extract and download image
            image_url = None
            try:
                # Look for paddle images
                img_selectors = [
                    'img[src*="paddle"]',
                    '.paddle-image img',
                    '.product-image img',
                    'img[alt*="paddle"]',
                    'img'
                ]
                
                for selector in img_selectors:
                    img_elem = soup.select_one(selector)
                    if img_elem and img_elem.get('src'):
                        src = img_elem.get('src')
                        # Skip small icons and logos
                        if not any(skip in src.lower() for skip in ['icon', 'logo', 'favicon', 'header']):
                            image_url = src
                            if not image_url.startswith('http'):
                                if image_url.startswith('/'):
                                    image_url = f"{self.base_url}{image_url}"
                                else:
                                    image_url = f"{self.base_url}/{image_url}"
                            break
                
                if image_url:
                    self.logger.info(f"Found image URL: {image_url}")
                    local_image_path = download_image(image_url, brand, model, "images")
                    if local_image_path:
                        self.logger.info(f"Successfully downloaded image to: {local_image_path}")
                    else:
                        self.logger.warning(f"Failed to download image from: {image_url}")
                else:
                    self.logger.warning("No image URL found")
                    
            except Exception as e:
                self.logger.error(f"Error extracting/downloading image: {e}")
            
            # Create final paddle object
            paddle = Paddle(id=paddle_id, metadata=metadata, specs=specs, performance=performance)
            
            # Log summary
            if missing_fields:
                self.logger.warning(f"Missing fields: {', '.join(missing_fields)}")
            
            self.logger.info(f"Successfully scraped paddle: {brand} {model} (ID: {paddle_id})")
            return paddle
            
        except Exception as e:
            self.logger.error(f"Error scraping paddle at {url}: {e}", exc_info=True)
            return None

if __name__ == "__main__":
    import json
    from dataclasses import asdict
    
    # Set up logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Create scraper and run
    scraper = MattsPickleballScraper()
    paddles = scraper.scrape_all()
    
    print(f"Scraped {len(paddles)} paddles from Matt's Pickleball")
    
    # Save to JSON
    if paddles:
        data = [asdict(paddle) for paddle in paddles]
        with open('scraped_paddles_matts.json', 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Saved {len(paddles)} paddles to scraped_paddles_matts.json")
    else:
        print("No paddles were scraped")
