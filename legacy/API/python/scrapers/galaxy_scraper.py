import re
import random
import logging
from typing import List, Optional

from base_scraper import PaddleScraper
from data_models import Paddle, Metadata, Specs, Performance, generate_paddle_id, extract_float, clean_model_name, determine_paddle_shape_from_length, normalize_paddle_shape
from image_downloader import download_image, extract_image_url_from_galaxy_html

class PickleballGalaxyScraper(PaddleScraper):
    def __init__(self):
        super().__init__("https://www.pickleballgalaxy.com")
    
    def get_paddle_urls(self) -> List[str]:
        paddle_urls = []
        base_url = f"{self.base_url}/all-pickleball-paddles.html"
        per_page = 40
        page = 1
        max_pages = 10  # Safety limit
        
        while page <= max_pages:
            if page == 1:
                page_url = base_url
            else:
                offset = (page - 1) * per_page
                page_url = f"{base_url}?CatListingOffset={offset}&Offset={offset}&Per_Page={per_page}&Sort_By=disp_order"
            
            self.logger.info(f"Fetching page {page}: {page_url}")
            
            soup = self.get_page(page_url)
            if not soup:
                break
            
            # Updated selector based on the actual HTML structure
            paddle_links = soup.select('a.u-block.x-product-list__link')
            if not paddle_links:
                paddle_links = soup.select('a.x-product-list__link')
            if not paddle_links:
                # Fallback to more generic selectors
                paddle_links = soup.select('a[href*="pickleball-paddle"]')
                if not paddle_links:
                    paddle_links = soup.select('a[title*="Pickleball Paddle"]')
                
            if not paddle_links:
                self.logger.warning(f"No paddle links found on page {page} with provided selectors. HTML structure may have changed.")
                break
                
            self.logger.info(f"Found {len(paddle_links)} paddle links on page {page}")
            
            for link in paddle_links:
                href = link.get('href')
                if href:
                    # Ensure we have the full URL
                    if not href.startswith('http'):
                        if href.startswith('/'):
                            href = f"{self.base_url}{href}"
                        else:
                            href = f"{self.base_url}/{href}"
                    paddle_urls.append(href)
                    self.logger.debug(f"Found paddle link: {href}")
            
            # Check if we should continue
            # Either by finding a "next page" element or by checking if we found any products
            next_page = soup.select_one('a.next-page') or soup.select_one('a.action.next')
            if not next_page:
                next_page = soup.select_one('a[title="Next"]') or soup.select_one('a[aria-label="Next"]')
            
            if not paddle_links or (page > 1 and not next_page):
                self.logger.info(f"No more pages to process or no next page link found after page {page}")
                break
                
            page += 1
            self.rate_limit()
        
        self.logger.info(f"Found total of {len(paddle_urls)} paddle URLs across all pages")
        return paddle_urls
    
    def scrape_paddle(self, url: str) -> Optional[Paddle]:
        soup = self.get_page(url)
        if not soup:
            return None
        
        try:
            self.logger.info(f"Scraping paddle details from {url}")
            missing_fields = []
            spec_defaults_used = []
            
            # Extract title - checking multiple common selectors with priority on itemprop="name"
            title_elem = None
            
            # Try all these selectors in order until we find one
            title_selectors = [
                'span[itemprop="name"]',
                'h1.page-title',
                '.product-title',
                '.product-name h1',
                'h1.product_title',
                '.product-info h1'
            ]
            
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    self.logger.debug(f"Found title with selector: {selector}")
                    break
                    
            # Extra validation to make sure we're not getting navigation text
            if title_elem:
                title_text = title_elem.text.strip()
                
                # Skip if the title is empty, too short, or looks like navigation
                if not title_text or len(title_text) < 5 or title_text.lower() in ["home", "products", "paddles"]:
                    self.logger.warning(f"Found suspicious title text: '{title_text}', looking for alternative")
                    title_elem = None
            
            # If still no title, try to use the page <title> as last resort
            if not title_elem:
                title_from_head = soup.select_one('title')
                if title_from_head:
                    title_text = title_from_head.text.strip()
                    # Try to clean up the title (often has site name, etc.)
                    if " - " in title_text:
                        title_text = title_text.split(" - ")[0].strip()
                    self.logger.debug(f"Using page title as fallback: {title_text}")
                else:
                    title_text = "Unknown Product"
                    self.logger.warning(f"No title element found at {url}")
                    missing_fields.append("title")
            else:
                title_text = title_elem.text.strip()
                self.logger.debug(f"Found title: {title_text}")
                
            # Verify title doesn't look like navigation text
            if title_text.lower() in ["home", "products", "categories", "paddles"]:
                self.logger.warning(f"Title appears to be navigation text: '{title_text}'. URL may be invalid or redirected.")
                return None  # Don't proceed with invalid title
                
            # Extract paddle name from URL as fallback
            url_parts = url.split('/')
            if len(url_parts) > 3:
                url_filename = url_parts[-1]
                if '.html' in url_filename:
                    url_paddle_name = url_filename.split('.html')[0]
                    url_paddle_name = url_paddle_name.replace('-', ' ').title()
                    self.logger.debug(f"Extracted name from URL: {url_paddle_name}")
                    
                    # If title looks suspicious but URL has good info, use URL
                    if len(title_text) < 10 or title_text.lower() in ["home", "products", "paddles"]:
                        title_text = url_paddle_name
                        self.logger.info(f"Replaced suspicious title with URL-derived name: {title_text}")
            
            # Common pickleball brands and brand prefixes to look for
            common_brands = [
                "Selkirk Labs", "Selkirk", "Engage", "Joola", "Paddletek", "Gearbox", 
                "Franklin", "CRBN", "Diadem", "HEAD", "Gamma", "Players",
                "adidas", "Adidas", "OneShot", "Electrum", "SLK", "Legacy Pro", "Rokne",
                "Babolat", "TMPR", "Pickleball Apes", "ProKennex", "Vulcan",
                "Wilson", "Onix", "Prince", "Rally", "PROLITE", "Pro-Lite"
            ]
            
            # Try to find brand in the title
            brand = None
            for possible_brand in common_brands:
                # Look for exact brand at the beginning of the title
                if title_text.lower().startswith(possible_brand.lower()):
                    brand = possible_brand
                    self.logger.debug(f"Found brand at beginning of title: {brand}")
                    break
                
                # Try more flexible match with word boundaries
                pattern = re.compile(f"\\b{re.escape(possible_brand)}\\b", re.IGNORECASE)
                if pattern.search(title_text):
                    brand = possible_brand
                    self.logger.debug(f"Found brand with word boundary match: {brand}")
                    break
            
            # If brand not found in common brands list, try to extract first words of the title
            if not brand:
                # Try first word as brand
                words = title_text.split()
                if len(words) >= 1:
                    brand = words[0]
                    self.logger.debug(f"Extracted first word as brand: {brand}")
                    
                    # Try first two words as brand (common pattern: "Brand Name")
                    if len(words) >= 2:
                        two_word_brand = f"{words[0]} {words[1]}"
                        # Check if the URL or title suggests this might be right
                        if (two_word_brand.lower().replace(" ", "-") in url.lower() or 
                            any(two_word_brand.lower() in b.lower() for b in common_brands)):
                            brand = two_word_brand
                            self.logger.debug(f"Updated to two-word brand: {brand}")
            
            # Fallback if still no brand found
            if not brand:
                brand = "Unknown"
                self.logger.warning(f"Could not extract brand from title: {title_text}")
                missing_fields.append("brand")
            
            # Log an error if the extracted brand is not in our common brands list
            if brand != "Unknown" and not any(brand.lower() == common_brand.lower() for common_brand in common_brands):
                self.logger.error(f"Extracted brand '{brand}' not in common brands list - might be incorrect or needs to be added to known brands")
                
                # Fallback to something from the URL if possible
                url_brand = None
                for common_brand in common_brands:
                    if common_brand.lower().replace(' ', '-') in url.lower():
                        url_brand = common_brand
                        self.logger.info(f"Found brand '{url_brand}' in URL as fallback")
                        brand = url_brand
                        break
                
                # If we couldn't find a better match, keep the original brand but note it
                if not url_brand:
                    self.logger.warning(f"Using potentially unknown brand: {brand}")
            
            # Extract model by removing brand name and common suffixes
            model = title_text
            if brand != "Unknown":
                # Remove brand name from title with case insensitivity
                pattern = re.compile(f"^{re.escape(brand)}\\s+", re.IGNORECASE)
                model = pattern.sub("", model).strip()
                self.logger.debug(f"After brand removal: {model}")
            
            # Remove common suffixes with case insensitivity
            common_suffixes = [
                "Pickleball Paddle", "Paddle", "Pickleball", 
                "(Elongated)", "Elongated", "(Standard)", "Standard",
                "(Lightweight)", "Lightweight"
            ]
            for suffix in common_suffixes:
                pattern = re.compile(f"{re.escape(suffix)}$", re.IGNORECASE)
                model = pattern.sub("", model).strip()
            
            self.logger.debug(f"After suffix removal: {model}")
            
            # Clean up any parenthetical descriptions that remain
            model = re.sub(r'\s*\([^)]*\)\s*', ' ', model).strip()
            
            # Clean up multiple spaces
            model = re.sub(r'\s+', ' ', model).strip()

            # Clean source websites from model name if they appear
            source_names = ["Pickleball Galaxy", "Pickleball Central", "Pickleball"]
            for source in source_names:
                model = re.sub(f"\\b{re.escape(source)}\\b", "", model, flags=re.IGNORECASE).strip()
            
            # Use the shared clean_model_name function
            model = clean_model_name(model)
            
            self.logger.debug(f"FINAL MODEL NAME: '{model}'")
            
            # Clean up multiple spaces
            model = re.sub(r'\s+', ' ', model).strip()

            if not model:
                model = "Unknown Model"
                self.logger.warning(f"Empty model name after processing title: {title_text}")
                missing_fields.append("model")
            
            self.logger.info(f"Final metadata - Brand: {brand}, Model: {model}")
            
            # Extract specifications from structured data sections
            specs_data = {}
            
            # Look for the structured specification sections in the description area
            spec_items = soup.select('.o-layout__item')
            self.logger.debug(f"Found {len(spec_items)} potential spec items")
            
            for item in spec_items:
                item_text = item.get_text(strip=True)
                self.logger.debug(f"Processing spec item: '{item_text}'")
                if ':' in item_text:
                    key, value = item_text.split(':', 1)
                    key = key.strip().lower()
                    value = value.strip()
                    specs_data[key] = value
                    self.logger.debug(f"Extracted spec: '{key}' = '{value}'")
            
            # Log all found specifications for debugging
            self.logger.info(f"All extracted specs: {specs_data}")
            
            # Extract description from the product description section
            description_elem = soup.select_one('.prod_description')
            specs_text = ""
            if description_elem:
                specs_text = description_elem.get_text()
                self.logger.debug("Found product description")
            else:
                self.logger.warning("No product description found")
                missing_fields.append("description")
            
            # Extract length with better debugging
            length = None
            if 'paddle length' in specs_data:
                length_str = specs_data['paddle length'].replace('in', '').strip()
                self.logger.debug(f"Found paddle length string: '{length_str}'")
                length = extract_float(length_str)
                if length:
                    self.logger.info(f"Successfully extracted length: {length}")
                else:
                    self.logger.warning(f"Failed to extract float from length string: '{length_str}'")
            else:
                self.logger.warning(f"'paddle length' not found in specs_data. Available keys: {list(specs_data.keys())}")
            
            # Extract weight with better debugging  
            weight = None
            if 'weight' in specs_data:
                weight_str = specs_data['weight'].replace('ounces', '').strip()
                self.logger.debug(f"Found weight string: '{weight_str}'")
                # Handle weight ranges like "7.9-8.3 ounces"
                if '-' in weight_str:
                    weight_parts = weight_str.split('-')
                    if len(weight_parts) == 2:
                        try:
                            min_weight = float(weight_parts[0].strip())
                            max_weight = float(weight_parts[1].strip())
                            weight = (min_weight + max_weight) / 2  # Use average
                            self.logger.info(f"Successfully extracted weight range, using average: {weight}")
                        except ValueError as e:
                            self.logger.warning(f"Failed to parse weight range '{weight_str}': {e}")
                else:
                    weight = extract_float(weight_str)
                    if weight:
                        self.logger.info(f"Successfully extracted weight: {weight}")
                    else:
                        self.logger.warning(f"Failed to extract float from weight string: '{weight_str}'")
            else:
                self.logger.warning(f"'weight' not found in specs_data. Available keys: {list(specs_data.keys())}")
            
            # Extract width with better debugging
            width = None
            if 'paddle width' in specs_data:
                width_str = specs_data['paddle width'].replace('in', '').strip()
                self.logger.debug(f"Found width string: '{width_str}'")
                width = extract_float(width_str)
                if width:
                    self.logger.info(f"Successfully extracted width: {width}")
                else:
                    self.logger.warning(f"Failed to extract float from width string: '{width_str}'")
            else:
                self.logger.warning(f"'paddle width' not found in specs_data. Available keys: {list(specs_data.keys())}")
            
            # Extract shape (using paddle length if available)
            shape = None
            if length:
                shape = determine_paddle_shape_from_length(length)
                shape = normalize_paddle_shape(shape)  # Ensure it matches Go backend expectations
                self.logger.debug(f"Determined shape '{shape}' from length {length}")
            
            # Extract surface material
            surface = None
            if 'surface material' in specs_data:
                surface_text = specs_data['surface material'].lower()
                if "fiberglass" in surface_text:
                    surface = "Fiberglass"
                elif "carbon" in surface_text and "fiber" in surface_text:
                    surface = "Carbon Fiber"
                elif "graphite" in surface_text:
                    surface = "Graphite"
                elif "composite" in surface_text:
                    surface = "Composite"
                else:
                    surface = specs_data['surface material']
                self.logger.debug(f"Found surface: {surface}")
            else:
                # Fallback to description search
                if "fiberglass" in specs_text.lower():
                    surface = "Fiberglass"
                elif "carbon" in specs_text.lower() and "fiber" in specs_text.lower():
                    surface = "Carbon Fiber"
                elif "graphite" in specs_text.lower():
                    surface = "Graphite"
                elif "composite" in specs_text.lower():
                    surface = "Composite"
                else:
                    surface = None
                    self.logger.error(f"Missing required spec: surface material")
                    missing_fields.append("surface")
            
            # Extract core thickness
            core_thickness = None
            if 'core thickness' in specs_data:
                core_str = specs_data['core thickness'].replace('mm', '').strip()
                core_thickness = extract_float(core_str)
                if core_thickness:
                    self.logger.debug(f"Found core thickness: {core_thickness}")
            
            if not core_thickness:
                # Look for core information in various patterns
                for core_pattern in [r'(\d+\.?\d*)\s*mm\s*core', r'core thickness[:\s]*(\d+\.?\d*)', r'core[:\s]*(\d+\.?\d*)']:
                    core_match = re.search(core_pattern, specs_text, re.IGNORECASE)
                    if core_match:
                        core_thickness = float(core_match.group(1))
                        break
            
            if not core_thickness:
                # Look for models with known core thickness in the name
                core_name_match = re.search(r'(\d+\.?\d*)mm', title_text, re.IGNORECASE)
                if core_name_match:
                    core_thickness = float(core_name_match.group(1))
            
            if not core_thickness:
                core_thickness = None
                self.logger.error(f"Missing required spec: core thickness")
                missing_fields.append("core")
            
            # Extract grip length
            grip_length = None
            if 'handle length' in specs_data:
                grip_str = specs_data['handle length'].replace('in', '').strip()
                grip_length = extract_float(grip_str)
                if grip_length:
                    self.logger.debug(f"Found grip length: {grip_length}")
            
            if not grip_length:
                grip_length = None
                self.logger.error(f"Missing required spec: grip length")
                missing_fields.append("grip_length")
            
            # Extract grip type
            grip_type = None
            if 'factory grip' in specs_data:
                grip_type = specs_data['factory grip']
                self.logger.debug(f"Found grip type: {grip_type}")
            
            if not grip_type:
                grip_type = None
                self.logger.error(f"Missing required spec: grip type")
                missing_fields.append("grip_type")
            
            # Extract grip circumference
            grip_circumference = None
            if 'grip size' in specs_data:
                grip_str = specs_data['grip size'].replace('in', '').strip()
                # Handle "4 1/8 in *may vary up to 1/8"" format
                grip_str = grip_str.split('*')[0].strip()  # Remove footnote
                grip_circumference = extract_float(grip_str)
                if grip_circumference:
                    self.logger.debug(f"Found grip circumference: {grip_circumference}")
            
            if not grip_circumference:
                grip_circumference = None
                self.logger.error(f"Missing required spec: grip circumference")
                missing_fields.append("grip_circumference")
            
            # Log all extracted values before creating Specs object
            self.logger.info(f"Final extracted values before creating Specs:")
            self.logger.info(f"  shape: {shape}")
            self.logger.info(f"  surface: {surface}")
            self.logger.info(f"  average_weight: {weight}")
            self.logger.info(f"  core: {core_thickness}")
            self.logger.info(f"  paddle_length: {length}")
            self.logger.info(f"  paddle_width: {width}")
            self.logger.info(f"  grip_length: {grip_length}")
            self.logger.info(f"  grip_type: {grip_type}")
            self.logger.info(f"  grip_circumference: {grip_circumference}")
            
            # Create specs without default values
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
            
            # Log the created specs object to verify values are preserved
            self.logger.info(f"Created Specs object:")
            self.logger.info(f"  specs.paddle_length: {specs.paddle_length}")
            self.logger.info(f"  specs.average_weight: {specs.average_weight}")
            self.logger.info(f"  specs.paddle_width: {specs.paddle_width}")
            
            # Do not generate synthetic performance metrics; leave unset when not scraped
            performance = None
            
            # Create the metadata with source information
            metadata = Metadata(brand=brand, model=model, source="Pickleball Galaxy")
            paddle_id = generate_paddle_id(brand, model)
            
            # Extract and download image
            image_url = None
            try:
                # Debug: Log all images on the page
                all_images = soup.find_all('img')
                self.logger.debug(f"Found {len(all_images)} total images on the page")
                for i, img in enumerate(all_images[:10]):  # Log first 10 images
                    src = img.get('src', 'No src')
                    alt = img.get('alt', 'No alt')
                    img_id = img.get('id', 'No id')
                    img_class = img.get('class', [])
                    self.logger.debug(f"Image {i+1}: src='{src}', alt='{alt}', id='{img_id}', class='{img_class}'")
                
                # Priority 1: Look for the closeup image (960x960) - highest quality
                img_elem = soup.select_one('img#closeup_image')
                if img_elem and img_elem.get('src'):
                    image_url = img_elem.get('src')
                    self.logger.debug(f"Found closeup_image: {image_url}")
                    if (image_url.startswith('graphics/') and 
                        not image_url.endswith('blank.gif') and
                        not 'logo' in image_url.lower() and
                        not 'header' in image_url.lower() and
                        not 'banner' in image_url.lower()):
                        image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                        self.logger.info(f"Using closeup image: {image_url}")
                    elif image_url.endswith('blank.gif'):
                        image_url = None
                        self.logger.debug("Skipping blank.gif placeholder")
                    else:
                        image_url = None
                        self.logger.debug("Skipping logo/header/banner image")
                
                # Priority 2: Look for the main product image (480x480)
                if not image_url:
                    img_elem = soup.select_one('img#main_image')
                    if img_elem and img_elem.get('src'):
                        image_url = img_elem.get('src')
                        self.logger.debug(f"Found main_image: {image_url}")
                        if (image_url.startswith('graphics/') and 
                            not image_url.endswith('blank.gif') and
                            not 'logo' in image_url.lower() and
                            not 'header' in image_url.lower() and
                            not 'banner' in image_url.lower()):
                            image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                            self.logger.info(f"Using main image: {image_url}")
                        elif image_url.endswith('blank.gif'):
                            image_url = None
                            self.logger.debug("Skipping blank.gif placeholder")
                        else:
                            image_url = None
                            self.logger.debug("Skipping logo/header/banner image")
                
                # Priority 3: Look for any product image in the layout
                if not image_url:
                    img_elem = soup.select_one('img.x-product-layout-images__image')
                    if img_elem and img_elem.get('src'):
                        image_url = img_elem.get('src')
                        self.logger.debug(f"Found layout image: {image_url}")
                        if (image_url.startswith('graphics/') and 
                            not image_url.endswith('blank.gif') and
                            not 'logo' in image_url.lower() and
                            not 'header' in image_url.lower() and
                            not 'banner' in image_url.lower()):
                            image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                            self.logger.info(f"Using layout image: {image_url}")
                        elif image_url.endswith('blank.gif'):
                            image_url = None
                            self.logger.debug("Skipping blank.gif placeholder")
                        else:
                            image_url = None
                            self.logger.debug("Skipping logo/header/banner image")
                
                # Priority 4: Look for any image with graphics in src (but avoid thumbnails and logos)
                if not image_url:
                    graphics_images = soup.select('img[src*="graphics"]')
                    for img in graphics_images:
                        src = img.get('src', '')
                        # Skip thumbnails, blank images, and logos
                        if (src.startswith('graphics/') and 
                            not src.endswith('blank.gif') and 
                            not src.endswith('_80x80.jpg') and
                            not src.endswith('_80x80.png') and
                            not 'logo' in src.lower() and
                            not 'header' in src.lower() and
                            not 'banner' in src.lower() and
                            # Make sure it looks like a product image (has dimensions in filename)
                            ('_480x480' in src or '_960x960' in src or '_480x480' in src)):
                            image_url = src
                            self.logger.debug(f"Found graphics image: {image_url}")
                            image_url = f"https://www.pickleballgalaxy.com/mm5/{image_url}"
                            self.logger.info(f"Using graphics image: {image_url}")
                            break
                
                if image_url:
                    self.logger.info(f"Final image URL: {image_url}")
                    # Download the image
                    local_image_path = download_image(image_url, brand, model, "images")
                    if local_image_path:
                        self.logger.info(f"Successfully downloaded image to: {local_image_path}")
                    else:
                        self.logger.warning(f"Failed to download image from: {image_url}")
                else:
                    self.logger.warning("No valid image URL found on the page")
                    
            except Exception as e:
                self.logger.error(f"Error extracting/downloading image: {e}")
            
            # Create final paddle object
            paddle = Paddle(id=paddle_id, metadata=metadata, specs=specs, performance=performance)
            
            # Log the final paddle specs to verify they're still there
            self.logger.info(f"Final Paddle object specs:")
            self.logger.info(f"  paddle.specs.paddle_length: {paddle.specs.paddle_length}")
            self.logger.info(f"  paddle.specs.average_weight: {paddle.specs.average_weight}")
            self.logger.info(f"  paddle.specs.paddle_width: {paddle.specs.paddle_width}")
            
            # Log summary of missing/default fields
            if missing_fields:
                self.logger.warning(f"Missing fields: {', '.join(missing_fields)}")
            if spec_defaults_used:
                self.logger.warning(f"Default values used for: {', '.join(spec_defaults_used)}")
                
            self.logger.info(f"Successfully scraped paddle: {brand} {model} (ID: {paddle_id})")
            
            return paddle
            
        except Exception as e:
            self.logger.error(f"Error scraping paddle at {url}: {e}", exc_info=True)
            return None 