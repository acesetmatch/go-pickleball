import os
import json
import logging
from typing import Dict, List, Optional, Any
from dataclasses import asdict
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

from data_models import Paddle, Metadata, Specs, Performance, generate_paddle_id

# Load environment variables
load_dotenv()

class FirecrawlScrapingService:
    """Service for scraping paddle data using Firecrawl API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Firecrawl service with API key."""
        self.api_key = api_key or os.getenv('FIRECRAWL_API_KEY')
        if not self.api_key:
            raise ValueError("Firecrawl API key is required. Set FIRECRAWL_API_KEY environment variable.")
        
        self.app = FirecrawlApp(api_key=self.api_key)
        self.logger = logging.getLogger(__name__)
        
    def scrape_url(self, url: str, extract_schema: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Scrape a single URL using Firecrawl.
        
        Args:
            url: URL to scrape
            extract_schema: Optional schema for structured data extraction
            
        Returns:
            Scraped data as dictionary
        """
        try:
            self.logger.info(f"Scraping URL: {url}")
            
            # Configure scraping options
            scrape_options = {
                'formats': ['markdown', 'html'],
                'includeTags': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'table', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'a'],
                'excludeTags': ['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe'],
                'onlyMainContent': False,  # Get full content to capture brand info
                'waitFor': 10000,  # Wait 10 seconds for dynamic content to load
                'timeout': 45000,  # 45 second timeout for page load
                'mobile': False,  # Use desktop version
                'skipTlsVerification': False
            }
            
            # Add extraction schema if provided
            if extract_schema:
                scrape_options['extract'] = extract_schema
            
            # Perform the scrape
            result = self.app.scrape(url)
            
            # Firecrawl v2 returns a Document object directly
            if hasattr(result, 'markdown') and result.markdown:
                self.logger.info(f"Successfully scraped {url}")
                return {
                    'content': result.markdown,
                    'html': getattr(result, 'html', ''),
                    'metadata': getattr(result, 'metadata', {}),
                    'success': True
                }
            else:
                self.logger.error(f"Failed to scrape {url}: No content returned")
                return {'success': False}
                
        except Exception as e:
            self.logger.error(f"Error scraping {url}: {e}")
            return {}
    
    def scrape_matts_paddle_finder(self, base_url: str = "https://paddles.mattspickleball.com/", max_pages: int = 15) -> List[Dict[str, Any]]:
        """
        Scrape Matt's Pickleball paddle finder for detailed paddle specifications across multiple pages.
        
        Args:
            base_url: Base URL of Matt's paddle finder
            max_pages: Maximum number of pages to scrape (default 15)
            
        Returns:
            List of paddle data dictionaries
        """
        try:
            self.logger.info(f"Scraping Matt's Pickleball paddle finder: {base_url} (up to {max_pages} pages)")
            
            all_paddle_urls = []
            
            # Try different pagination URL patterns and approaches
            page_urls_to_try = [
                base_url,  # Main page
                f"{base_url}?offset=0&limit=20",
                f"{base_url}?page=1&per_page=20", 
                f"{base_url}#page=1",
                f"{base_url}?start=0",
            ]
            
            # Also try with different query parameters that might trigger more results
            for page_num in range(2, min(max_pages + 1, 6)):  # Try pages 2-5
                page_urls_to_try.extend([
                    f"{base_url}?offset={20*(page_num-1)}&limit=20",
                    f"{base_url}?page={page_num}&per_page=20",
                    f"{base_url}#page={page_num}",
                    f"{base_url}?start={20*(page_num-1)}",
                ])
            
            for i, page_url in enumerate(page_urls_to_try[:15]):  # Limit to 15 attempts
                try:
                    self.logger.info(f"Attempting URL {i+1}/{min(15, len(page_urls_to_try))}: {page_url}")
                    
                    # Use longer wait time for potential dynamic loading
                    result = self.scrape_url(page_url)
                    paddle_urls = self._extract_paddle_urls_from_content(result)
                    
                    if paddle_urls:
                        # Add new URLs that we haven't seen before
                        new_urls = [url for url in paddle_urls if url not in all_paddle_urls]
                        all_paddle_urls.extend(new_urls)
                        self.logger.info(f"URL {i+1}: Found {len(paddle_urls)} total URLs, {len(new_urls)} new")
                    else:
                        self.logger.info(f"URL {i+1}: No paddle URLs found")
                    
                    # Add small delay between pagination attempts
                    if i < min(14, len(page_urls_to_try) - 1):
                        import time
                        time.sleep(1)  # 1 second delay between page attempts
                        
                except Exception as e:
                    error_msg = str(e)
                    self.logger.error(f"Error loading URL {page_url}: {e}")
                    
                    # If rate limited during pagination, wait before continuing
                    if "Rate Limit Exceeded" in error_msg:
                        self.logger.info("Rate limit hit during pagination, waiting 30 seconds...")
                        import time
                        time.sleep(30)
                    
                    continue
            
            if not all_paddle_urls:
                self.logger.warning("No paddle URLs found across all pages")
                return []
            
            # Remove duplicates and limit total URLs to manage rate limits
            unique_paddle_urls = list(dict.fromkeys(all_paddle_urls))  # Preserves order while removing duplicates
            
            # Limit total paddles based on rate limits (Firecrawl free: ~20 requests/min)
            # Reserve some requests for pagination, use rest for individual paddles
            max_paddles = min(10, len(unique_paddle_urls))  # Conservative limit for free tier
            paddle_urls_to_scrape = unique_paddle_urls[:max_paddles]
            
            self.logger.info(f"Found {len(unique_paddle_urls)} unique paddle URLs, scraping first {len(paddle_urls_to_scrape)} detailed pages...")
            
            detailed_paddles = []
            for i, paddle_url in enumerate(paddle_urls_to_scrape):
                try:
                    self.logger.info(f"Scraping paddle {i+1}/{len(paddle_urls_to_scrape)}: {paddle_url}")
                    paddle_data = self.scrape_individual_paddle(paddle_url)
                    if paddle_data:
                        detailed_paddles.append(paddle_data)
                    
                    # Add delay between requests to avoid rate limits
                    if i < len(paddle_urls_to_scrape) - 1:  # Don't delay after last request
                        import time
                        time.sleep(2)  # 2 second delay between paddle scrapes
                        
                except Exception as e:
                    error_msg = str(e)
                    self.logger.error(f"Error scraping paddle {paddle_url}: {e}")
                    
                    # If rate limited, wait and continue
                    if "Rate Limit Exceeded" in error_msg:
                        self.logger.info("Rate limit hit, waiting 60 seconds before continuing...")
                        import time
                        time.sleep(60)
                        # Retry this paddle after waiting
                        try:
                            paddle_data = self.scrape_individual_paddle(paddle_url)
                            if paddle_data:
                                detailed_paddles.append(paddle_data)
                        except Exception as retry_e:
                            self.logger.error(f"Retry failed for {paddle_url}: {retry_e}")
                    
                    # Continue with next paddle
                    continue
            
            self.logger.info(f"Successfully scraped {len(detailed_paddles)} detailed paddles from {max_pages} page attempts")
            return detailed_paddles
            
        except Exception as e:
            self.logger.error(f"Error scraping Matt's paddle finder: {e}")
            return []
    
    def _extract_paddle_urls_from_content(self, scraped_data: Dict[str, Any]) -> List[str]:
        """
        Extract paddle URLs from scraped content.
        
        Args:
            scraped_data: Raw scraped data from Firecrawl
            
        Returns:
            List of paddle URLs
        """
        try:
            # Try to extract from markdown content
            content = scraped_data.get('content', '')
            
            self.logger.info("Attempting to extract paddle URLs from content")
            
            # Parse paddle links and data from the content
            import re
            
            # Find all paddle URLs in the content
            paddle_urls = re.findall(r'https://paddles\.mattspickleball\.com/paddle/([^\\s\\)]+)', content)
            
            # Convert to full URLs
            paddle_urls = [f'https://paddles.mattspickleball.com/paddle/{url}' for url in paddle_urls]
            
            self.logger.info(f"Found {len(paddle_urls)} paddle URLs")
            return paddle_urls
        
        except Exception as e:
            self.logger.error(f"Error extracting paddle URLs from content: {e}")
            return []
    
    def scrape_individual_paddle(self, paddle_url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape individual paddle page for detailed specifications.
        
        Args:
            paddle_url: URL of paddle detail page
            
        Returns:
            Paddle data dictionary or None if failed
        """
        try:
            self.logger.info(f"Scraping individual paddle: {paddle_url}")
            
            # Define extraction schema to target specific brand and shape information
            extraction_schema = {
                "type": "object",
                "properties": {
                    "brand": {
                        "type": "string",
                        "description": "The brand/manufacturer of the paddle (e.g., Selkirk, JOOLA, HEAD, etc.)"
                    },
                    "shape": {
                        "type": "string", 
                        "description": "The shape category of the paddle (Standard, Elongated, Wide-body, Hybrid)"
                    },
                    "paddle_name": {
                        "type": "string",
                        "description": "The full name/model of the paddle"
                    }
                },
                "required": ["brand", "paddle_name"]
            }
            
            # Scrape with extraction schema first
            result = self.scrape_url(paddle_url, extract_schema=extraction_schema)
            
            if not result or not result.get('success'):
                self.logger.error(f"No content returned for {paddle_url}")
                return None
            
            # Parse the detailed paddle data from content
            return self._parse_individual_paddle_content(result, paddle_url)
                
        except Exception as e:
            self.logger.error(f"Error scraping paddle {paddle_url}: {e}")
            return None
    
    def _parse_individual_paddle_content(self, scraped_data: Dict[str, Any], paddle_url: str) -> Optional[Dict[str, Any]]:
        """Parse individual paddle page content to extract detailed specifications."""
        try:
            import re
            
            content = scraped_data.get('content', '')
            html_content = scraped_data.get('html', '')
            lines = content.split('\n')
            
            paddle_data = {
                'url': paddle_url,
                'source': "Matt's Pickleball (Firecrawl)",
                'basic_specs': {},
                'paddle_metrics': {}
            }
            
            # Extract paddle name from URL
            slug = paddle_url.split('/')[-1]
            paddle_data['name'] = slug.replace('-', ' ').title()
            
            # Extract brand and shape from extraction schema first, then fallback to other methods
            brand = 'Unknown'
            shape = None
            
            # Check if we have extracted data from the schema
            extracted_data = scraped_data.get('extract', {})
            if extracted_data and isinstance(extracted_data, dict):
                if 'brand' in extracted_data and extracted_data['brand']:
                    brand = extracted_data['brand'].strip()
                if 'shape' in extracted_data and extracted_data['shape']:
                    shape = extracted_data['shape'].strip()
            
            # Parse HTML content for brand and shape information as fallback
            if brand == 'Unknown' and html_content:
                # Look for brand in HTML - specifically the pattern from your example
                # <p class="text-lg font-semibold text-muted-foreground">selkirk</p>
                brand_pattern = r'<p[^>]*text-muted-foreground[^>]*>([^<]+)</p>'
                brand_match = re.search(brand_pattern, html_content, re.IGNORECASE)
                if brand_match:
                    brand_text = brand_match.group(1).strip().lower()
                    if 'selkirk' in brand_text:
                        brand = 'Selkirk'
                    elif 'joola' in brand_text:
                        brand = 'JOOLA'
                    elif 'paddletek' in brand_text:
                        brand = 'PaddleTek'
                    elif 'engage' in brand_text:
                        brand = 'Engage'
                    elif 'onix' in brand_text:
                        brand = 'Onix'
                    elif 'head' in brand_text:
                        brand = 'HEAD'
                    elif 'babolat' in brand_text:
                        brand = 'Babolat'
                    elif 'wilson' in brand_text:
                        brand = 'Wilson'
                    elif 'yonex' in brand_text:
                        brand = 'Yonex'
                    elif 'honolulu' in brand_text:
                        brand = 'Honolulu Pickleball Co'
                    elif 'gearbox' in brand_text:
                        brand = 'Gearbox'
                    elif 'prince' in brand_text:
                        brand = 'Prince'
                    else:
                        # Capitalize the brand name properly
                        brand = brand_text.title()
                
                # Look for shape in HTML - pattern like <span>Standard</span>
                shape_pattern = r'<span[^>]*>(Standard|Elongated|Wide-body|Widebody|Hybrid|Power)</span>'
                shape_matches = re.findall(shape_pattern, html_content, re.IGNORECASE)
                for shape_match in shape_matches:
                    shape_text = shape_match.lower()
                    if shape_text == 'standard':
                        shape = 'Standard'
                        break
                    elif shape_text == 'elongated':
                        shape = 'Elongated'
                        break
                    elif shape_text in ['wide-body', 'widebody']:
                        shape = 'Wide-body'
                        break
                    elif shape_text == 'hybrid':
                        shape = 'Hybrid'
                        break
            
            # Fallback: Look for brand and shape in markdown content
            if brand == 'Unknown':
                for i, line in enumerate(lines):
                    line_stripped = line.strip()
                    
                    # Look for brand name patterns
                    if any(brand_name in line_stripped.lower() for brand_name in ['selkirk', 'joola', 'paddletek', 'engage', 'onix', 'head', 'babolat', 'wilson', 'yonex', 'honolulu', 'gearbox', 'prince']):
                        if 'selkirk' in line_stripped.lower():
                            brand = 'Selkirk'
                        elif 'joola' in line_stripped.lower():
                            brand = 'JOOLA'
                        elif 'paddletek' in line_stripped.lower():
                            brand = 'PaddleTek'
                        elif 'engage' in line_stripped.lower():
                            brand = 'Engage'
                        elif 'onix' in line_stripped.lower():
                            brand = 'Onix'
                        elif 'head' in line_stripped.lower():
                            brand = 'HEAD'
                        elif 'babolat' in line_stripped.lower():
                            brand = 'Babolat'
                        elif 'wilson' in line_stripped.lower():
                            brand = 'Wilson'
                        elif 'yonex' in line_stripped.lower():
                            brand = 'Yonex'
                        elif 'honolulu' in line_stripped.lower():
                            brand = 'Honolulu Pickleball Co'
                        elif 'gearbox' in line_stripped.lower():
                            brand = 'Gearbox'
                        elif 'prince' in line_stripped.lower():
                            brand = 'Prince'
                    
                    # Look for shape information
                    if not shape and any(shape_name in line_stripped.lower() for shape_name in ['standard', 'elongated', 'wide-body', 'widebody', 'hybrid']):
                        if 'standard' in line_stripped.lower():
                            shape = 'Standard'
                        elif 'elongated' in line_stripped.lower():
                            shape = 'Elongated'
                        elif 'wide-body' in line_stripped.lower() or 'widebody' in line_stripped.lower():
                            shape = 'Wide-body'
                        elif 'hybrid' in line_stripped.lower():
                            shape = 'Hybrid'
            
            # Primary approach: Extract from the paddle name/slug (most reliable)
            slug_lower = slug.lower()
            
            # Brand extraction from URL patterns
            if 'selkirk' in slug_lower or 'boomstik' in slug_lower:
                brand = 'Selkirk'
            elif 'joola' in slug_lower:
                brand = 'JOOLA'
            elif 'paddletek' in slug_lower:
                brand = 'PaddleTek'
            elif 'engage' in slug_lower:
                brand = 'Engage'
            elif 'onix' in slug_lower:
                brand = 'Onix'
            elif 'head' in slug_lower:
                brand = 'HEAD'
            elif 'babolat' in slug_lower:
                brand = 'Babolat'
            elif 'wilson' in slug_lower:
                brand = 'Wilson'
            elif 'yonex' in slug_lower:
                brand = 'Yonex'
            elif 'honolulu' in slug_lower or 'j6' in slug_lower or 'j2' in slug_lower:
                brand = 'Honolulu Pickleball Co'
            elif 'gearbox' in slug_lower:
                brand = 'Gearbox'
            elif 'prince' in slug_lower:
                brand = 'Prince'
            elif 'gamma' in slug_lower:
                brand = 'Gamma'
            elif 'franklin' in slug_lower:
                brand = 'Franklin'
            elif 'prolite' in slug_lower:
                brand = 'Pro-Lite'
            elif 'diadem' in slug_lower:
                brand = 'Diadem'
            elif 'electrum' in slug_lower:
                brand = 'Electrum'
            elif 'tmpr' in slug_lower or 'temper' in slug_lower:
                brand = 'TMPR'
            elif 'vulcan' in slug_lower:
                brand = 'Vulcan'
            elif 'six-zero' in slug_lower or 'sixzero' in slug_lower:
                brand = 'SixZero'
            
            # Shape extraction from URL patterns
            if 'widebody' in slug_lower or 'wide-body' in slug_lower:
                shape = 'Wide-body'
            elif 'elongated' in slug_lower:
                shape = 'Elongated'
            elif 'standard' in slug_lower:
                shape = 'Standard'
            elif 'hybrid' in slug_lower:
                shape = 'Hybrid'
            
            # Parse content for specifications
            in_basic_specs = False
            in_paddle_metrics = False
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                # Detect sections
                if 'Basic Specs' in line:
                    in_basic_specs = True
                    in_paddle_metrics = False
                    continue
                elif 'Paddle Metrics' in line:
                    in_basic_specs = False
                    in_paddle_metrics = True
                    continue
                elif line.startswith('#') or 'Reviews' in line or 'Similar' in line:
                    in_basic_specs = False
                    in_paddle_metrics = False
                    continue
                
                # Parse Basic Specs
                if in_basic_specs and line:
                    if 'Approval Body' in line:
                        paddle_data['basic_specs']['approval_body'] = self._extract_value_after_label(line, 'Approval Body')
                    elif 'Length' in line and 'Handle Length' not in line:
                        paddle_data['basic_specs']['length'] = self._extract_value_after_label(line, 'Length')
                    elif 'Width' in line:
                        paddle_data['basic_specs']['width'] = self._extract_value_after_label(line, 'Width')
                    elif 'Handle Length' in line:
                        paddle_data['basic_specs']['handle_length'] = self._extract_value_after_label(line, 'Handle Length')
                    elif 'Handle Circumference' in line:
                        paddle_data['basic_specs']['handle_circumference'] = self._extract_value_after_label(line, 'Handle Circumference')
                    elif 'Core Thickness' in line:
                        paddle_data['basic_specs']['core_thickness'] = self._extract_value_after_label(line, 'Core Thickness')
                    elif 'Surface Material' in line:
                        paddle_data['basic_specs']['surface_material'] = self._extract_value_after_label(line, 'Surface Material')
                
                # Parse Paddle Metrics
                elif in_paddle_metrics and line:
                    if 'Static Weight' in line:
                        paddle_data['paddle_metrics']['static_weight'] = self._extract_value_after_label(line, 'Static Weight')
                    elif 'Swing Weight' in line:
                        paddle_data['paddle_metrics']['swing_weight'] = self._extract_value_after_label(line, 'Swing Weight')
                    elif 'Twist Weight' in line:
                        paddle_data['paddle_metrics']['twist_weight'] = self._extract_value_after_label(line, 'Twist Weight')
                    elif 'Balance Point' in line:
                        paddle_data['paddle_metrics']['balance_point'] = self._extract_value_after_label(line, 'Balance Point')
                    elif 'Serve Speed' in line:
                        paddle_data['paddle_metrics']['serve_speed'] = self._extract_value_after_label(line, 'Serve Speed')
                    elif 'Punch Volley Speed' in line or 'Pop' in line:
                        paddle_data['paddle_metrics']['punch_volley_speed'] = self._extract_value_after_label(line, 'Punch Volley Speed')
                    elif 'Spin RPM' in line:
                        paddle_data['paddle_metrics']['spin_rpm'] = self._extract_value_after_label(line, 'Spin RPM')
                    elif 'Firepower' in line and 'Firepower' not in paddle_data['paddle_metrics']:
                        paddle_data['paddle_metrics']['firepower'] = self._extract_value_after_label(line, 'Firepower')
            
            # Store extracted brand and shape
            paddle_data['brand'] = brand
            paddle_data['shape'] = shape
            
            paddle_data['model'] = paddle_data['name']
            
            return paddle_data
            
        except Exception as e:
            self.logger.error(f"Error parsing individual paddle content: {e}")
            return None
    
    def _extract_value_after_label(self, line: str, label: str) -> str:
        """Extract value after a label in a line."""
        try:
            # Remove the label and get the remaining text
            if label in line:
                parts = line.split(label, 1)
                if len(parts) > 1:
                    value = parts[1].strip()
                    # Clean up common patterns
                    value = value.replace(':', '').strip()
                    # Remove percentile info if present
                    if 'percentile' in value:
                        value = value.split('percentile')[0].strip()
                    return value
            return None
        except:
            return None
    
    def _parse_dimension(self, dimension_str: str) -> Optional[float]:
        """Parse dimension string to float (e.g., '16"' -> 16.0)."""
        if not dimension_str:
            return None
        try:
            # Extract numeric value from strings like '16"', '7.875"', '5.75"'
            import re
            match = re.search(r'(\d+\.?\d*)', dimension_str)
            if match:
                return float(match.group(1))
        except:
            pass
        return None
    
    def _extract_brand_from_content(self, content: str, paddle_name: str) -> str:
        """Extract brand from content or paddle name."""
        content_lower = content.lower()
        name_lower = paddle_name.lower()
        
        # Check for known brands
        brands = {
            'selkirk': 'Selkirk',
            'joola': 'JOOLA', 
            'paddletek': 'PaddleTek',
            'engage': 'Engage',
            'onix': 'Onix',
            'head': 'HEAD',
            'babolat': 'Babolat',
            'wilson': 'Wilson',
            'yonex': 'Yonex',
            'honolulu': 'Honolulu Pickleball Co',
            'gearbox': 'Gearbox',
            'prince': 'Prince'
        }
        
        for brand_key, brand_name in brands.items():
            if brand_key in content_lower or brand_key in name_lower:
                return brand_name
        
        return 'Unknown'
    
    def _parse_paddle_data_from_content(self, scraped_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fallback method to parse paddle data from scraped content.
        
        Args:
            scraped_data: Raw scraped data from Firecrawl
            
        Returns:
            List of parsed paddle data
        """
        paddles = []
        
        try:
            # Try to extract from markdown content
            content = scraped_data.get('content', '')
            
            self.logger.info("Attempting to parse paddle data from content")
            
            # Parse paddle links and data from the content
            import re
            
            # Find all paddle URLs in the content
            paddle_urls = re.findall(r'https://paddles\.mattspickleball\.com/paddle/([^\\s\\)]+)', content)
            
            # Parse the content to extract paddle information
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                # Look for paddle entries with brand and model info
                if 'paddles.mattspickleball.com/paddle/' in line:
                    # Extract paddle URL
                    url_match = re.search(r'https://paddles\.mattspickleball\.com/paddle/([^\\s\\)]+)', line)
                    if url_match:
                        paddle_slug = url_match.group(1)
                        paddle_url = f'https://paddles.mattspickleball.com/paddle/{paddle_slug}'
                        
                        # Look for paddle name in the surrounding lines
                        paddle_name = None
                        brand = 'Unknown'
                        
                        # Check current line and nearby lines for paddle info
                        search_lines = lines[max(0, i-2):i+3]  # Check 2 lines before and after
                        
                        for search_line in search_lines:
                            search_line = search_line.strip()
                            
                            # Look for brand names
                            if 'selkirk' in search_line.lower():
                                brand = 'Selkirk'
                            elif 'honolulu-pickleball-co' in search_line.lower():
                                brand = 'Honolulu Pickleball Co'
                            elif 'joola' in search_line.lower():
                                brand = 'JOOLA'
                            elif 'paddletek' in search_line.lower():
                                brand = 'PaddleTek'
                            elif 'engage' in search_line.lower():
                                brand = 'Engage'
                            
                            # Look for model names (often in bold or after brand)
                            if '**' in search_line and not paddle_name:
                                # Extract text between ** markers
                                model_match = re.search(r'\\*\\*([^*]+)\\*\\*', search_line)
                                if model_match:
                                    paddle_name = model_match.group(1).strip()
                        
                        # If no name found, use slug as fallback
                        if not paddle_name:
                            paddle_name = paddle_slug.replace('-', ' ').title()
                        
                        # Create paddle data
                        paddle_data = {
                            'name': paddle_name,
                            'brand': brand,
                            'model': paddle_name,
                            'url': paddle_url,
                            'slug': paddle_slug,
                            'source': "Matt's Pickleball (Firecrawl)"
                        }
                        paddles.append(paddle_data)
                        
            # If we found paddle links, log success
            if paddles:
                self.logger.info(f"Successfully parsed {len(paddles)} paddles from content")
            else:
                self.logger.warning("No paddle data found")
                
        except Exception as e:
            self.logger.error(f"Error parsing paddle data from content: {e}")
        
        return paddles
    
    def convert_to_paddle_objects(self, paddle_data_list: List[Dict[str, Any]]) -> List[Paddle]:
        """
        Convert scraped paddle data to Paddle objects.
        
        Args:
            paddle_data_list: List of paddle data dictionaries
            
        Returns:
            List of Paddle objects
        """
        paddles = []
        
        for paddle_data in paddle_data_list:
            try:
                # Extract metadata
                brand = paddle_data.get('brand', 'Unknown')
                model = paddle_data.get('model', paddle_data.get('name', 'Unknown Model'))
                
                metadata = Metadata(
                    brand=brand,
                    model=model,
                    source=paddle_data.get('source', "Matt's Pickleball (Firecrawl)")
                )
                
                # Extract specifications from basic_specs
                basic_specs = paddle_data.get('basic_specs', {})
                metrics = paddle_data.get('paddle_metrics', {})
                
                specs = Specs(
                    shape=paddle_data.get('shape'),  # Use extracted shape
                    surface=basic_specs.get('surface_material'),
                    average_weight=self._parse_weight(metrics.get('static_weight')),
                    core=basic_specs.get('core_thickness'),
                    paddle_length=self._parse_dimension(basic_specs.get('length')),
                    paddle_width=self._parse_dimension(basic_specs.get('width')),
                    grip_length=self._parse_dimension(basic_specs.get('handle_length')),
                    grip_circumference=self._parse_dimension(basic_specs.get('handle_circumference'))
                )
                
                # Extract performance data from paddle_metrics
                metrics = paddle_data.get('paddle_metrics', {})
                performance = None
                if metrics and any(metrics.values()):
                    # Convert Matt's metrics to our performance model
                    firepower = self._parse_numeric(metrics.get('firepower'))
                    spin_rpm = self._parse_numeric(metrics.get('spin_rpm'))
                    punch_volley = self._parse_numeric(metrics.get('punch_volley_speed'))
                    twist_weight = self._parse_numeric(metrics.get('twist_weight'))
                    swing_weight = self._parse_numeric(metrics.get('swing_weight'))
                    balance_point = self._parse_numeric(metrics.get('balance_point'))
                    
                    # Only create Performance if we have at least some data
                    if any([firepower, spin_rpm, punch_volley, twist_weight, swing_weight, balance_point]):
                        performance = Performance(
                            power=firepower or 0.0,
                            pop=punch_volley or 0.0,
                            spin=spin_rpm or 0.0,
                            twist_weight=twist_weight or 0.0,
                            swing_weight=swing_weight or 0.0,
                            balance_point=balance_point or 0.0
                        )
                
                # Create paddle object
                paddle = Paddle(
                    id=generate_paddle_id(brand, model),
                    metadata=metadata,
                    specs=specs,
                    performance=performance
                )
                
                paddles.append(paddle)
                
            except Exception as e:
                self.logger.error(f"Error converting paddle data to object: {e}")
                continue
        
        return paddles
    
    def _parse_weight(self, weight_str: str) -> Optional[float]:
        """Parse weight string to float."""
        if not weight_str:
            return None
        try:
            # Extract numeric value from strings like "8.65 oz"
            import re
            match = re.search(r'(\d+\.?\d*)', weight_str)
            if match:
                return float(match.group(1))
        except:
            pass
        return None
    
    def _parse_numeric(self, value_str: str) -> Optional[float]:
        """Parse numeric string to float."""
        if not value_str:
            return None
        try:
            # Extract numeric value from strings
            import re
            match = re.search(r'(\d+\.?\d*)', str(value_str))
            if match:
                return float(match.group(1))
        except:
            pass
        return None
    
    def scrape_and_save(self, output_file: str = "scraped_paddles_matts_firecrawl.json") -> List[Paddle]:
        """
        Complete workflow to scrape Matt's paddles and save to file.
        
        Args:
            output_file: Output JSON file path
            
        Returns:
            List of scraped Paddle objects
        """
        try:
            # Scrape paddle data
            paddle_data_list = self.scrape_matts_paddle_finder()
            
            if not paddle_data_list:
                self.logger.warning("No paddle data found")
                return []
            
            # Convert to Paddle objects
            paddles = self.convert_to_paddle_objects(paddle_data_list)
            
            if paddles:
                # Save to JSON
                paddle_dicts = [asdict(paddle) for paddle in paddles]
                with open(output_file, 'w') as f:
                    json.dump(paddle_dicts, f, indent=2)
                
                self.logger.info(f"Successfully saved {len(paddles)} paddles to {output_file}")
            
            return paddles
            
        except Exception as e:
            self.logger.error(f"Error in complete scraping workflow: {e}")
            return []

def main():
    """Test the Firecrawl scraping service."""
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        # Initialize service
        service = FirecrawlScrapingService()
        
        # Test scraping Matt's paddle finder
        paddles = service.scrape_and_save()
        
        print(f"Successfully scraped {len(paddles)} paddles from Matt's Pickleball")
        
        # Display first few paddles as examples
        for i, paddle in enumerate(paddles[:3]):
            print(f"\nPaddle {i+1}: {paddle.metadata.brand} {paddle.metadata.model}")
            if paddle.specs.shape:
                print(f"  Shape: {paddle.specs.shape}")
            if paddle.specs.average_weight:
                print(f"  Weight: {paddle.specs.average_weight} oz")
            if paddle.performance:
                print(f"  Performance: Power={paddle.performance.power}, Pop={paddle.performance.pop}")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure to set your FIRECRAWL_API_KEY environment variable")

if __name__ == "__main__":
    main()
