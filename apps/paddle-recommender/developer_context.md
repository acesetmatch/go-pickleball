# Developer Context - Go Pickleball Project

## Project Overview
This is a full-stack pickleball paddle database application with web scraping capabilities, a Go backend API, and a Next.js frontend. The system scrapes paddle data from multiple sources, stores it in a database, and provides a web interface for browsing and comparing paddles.

## Architecture

### Backend Structure
```
backend/
├── go/                     # Go API server
│   ├── src/               # Go source code
│   ├── nginx-http.conf    # Nginx configuration
│   ├── Dockerfile         # Go service containerization
│   └── docker-compose.yml # Multi-service orchestration
└── python/                # Python scraping services
    ├── scrapers/          # Web scraping modules
    ├── data_models.py     # Shared data structures
    ├── api_service.py     # Python API service
    └── requirements.txt   # Python dependencies
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   └── data/            # Static data and types
├── public/              # Static assets
└── package.json         # Node.js dependencies
```

## Data Models

### Core Data Structure
All scrapers follow a consistent data model defined in `backend/python/data_models.py`:

```python
@dataclass
class Paddle:
    id: str                    # Generated from brand-model
    metadata: Metadata         # Brand, model, source info
    specs: Specs              # Physical specifications
    performance: Performance   # Performance metrics (optional)

@dataclass
class Metadata:
    brand: str                # Paddle manufacturer
    model: str                # Paddle model name
    source: str               # Scraping source website

@dataclass
class Specs:
    shape: str                # "Standard", "Elongated", "Hybrid", "Wide-body"
    surface: str              # Surface material (Carbon Fiber, Fiberglass, etc.)
    average_weight: float     # Weight in ounces
    core: float               # Core thickness in mm
    paddle_length: float      # Length in inches
    paddle_width: float       # Width in inches
    grip_length: float        # Grip length in inches
    grip_type: str            # Grip type description
    grip_circumference: float # Grip circumference in inches

@dataclass
class Performance:
    power: float              # Power rating
    pop: float                # Pop rating
    spin: float               # Spin rating
    twist_weight: float       # Twist weight measurement
    swing_weight: float       # Swing weight measurement
    balance_point: float      # Balance point in inches
```

## Web Scrapers

### Current Scrapers
1. **Galaxy Scraper** (`galaxy_scraper.py`)
   - Source: https://www.pickleballgalaxy.com
   - Scrapes: `/all-pickleball-paddles.html` (paginated)
   - Individual pages: Product detail pages
   - Output: `scraped_paddles_galaxy.json`

2. **Central Scraper** (`central_scraper.py`)
   - Source: https://pickleballcentral.com
   - Scrapes: `/pickleball-paddles` category page
   - Individual pages: Product detail pages
   - Output: `scraped_paddles_central.json`

3. **Matt's Scraper** (`matts_scraper.py`)
   - Source: https://www.mattspickleball.com
   - Scrapes: `/pickleball-paddle-catalog` listing page
   - Individual pages: `/paddle-database/{paddle-name}`
   - Output: `scraped_paddles_matts.json`

### Scraper Architecture
All scrapers inherit from `PaddleScraper` base class:

```python
class PaddleScraper(ABC):
    @abstractmethod
    def get_paddle_urls(self) -> List[str]:
        """Get URLs for individual paddle pages."""
        pass
    
    @abstractmethod
    def scrape_paddle(self, url: str) -> Optional[Paddle]:
        """Scrape a single paddle page."""
        pass
    
    def scrape_all(self) -> List[Paddle]:
        """Scrape all paddles with rate limiting."""
        pass
```

### Running Scrapers

#### Individual Scrapers
```bash
cd backend/python
source .venv/bin/activate

# Run individual scrapers
python3 galaxy_scraper.py
python3 central_scraper.py
python3 matts_scraper.py
```

#### All Scrapers
```bash
# Run all scrapers at once
python3 paddle_scraper.py
```

### Scraper Features
- **Rate Limiting**: 1-3 second delays between requests
- **Image Download**: Automatically downloads paddle images to `images/` directory
- **Error Handling**: Comprehensive logging and fallback mechanisms
- **Brand Recognition**: Extensive brand detection for consistent data
- **Spec Extraction**: Handles various formats (fractions, ranges, units)
- **Shape Detection**: Determines paddle shape from length or keywords

## Development Environment

### Python Setup
```bash
cd backend/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Required Dependencies
- `requests` - HTTP requests
- `beautifulsoup4` - HTML parsing
- `python-dotenv` - Environment variables
- `fastapi` - API framework
- `uvicorn` - ASGI server
- `pillow` - Image processing
- `smolagents` - AI agent framework

### Go Setup
```bash
cd backend/go
go mod download
go run main.go
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Data Flow

1. **Scraping Phase**
   ```
   Website → Scraper → JSON Files → Database
   ```

2. **API Phase**
   ```
   Database → Go API → JSON Response → Frontend
   ```

3. **User Interface**
   ```
   Frontend → API Calls → Data Display → User Interaction
   ```

## File Outputs

### JSON Files
- `scraped_paddles_galaxy.json` - Galaxy paddle data
- `scraped_paddles_central.json` - Central paddle data  
- `scraped_paddles_matts.json` - Matt's paddle data

### Images
- `images/` directory contains downloaded paddle images
- Organized by brand and model name
- Used for display in frontend

## Key Utilities

### Helper Functions (`data_models.py`)
- `generate_paddle_id()` - Creates unique IDs from brand/model
- `extract_float()` - Parses numbers from text (handles fractions)
- `clean_model_name()` - Standardizes model names
- `determine_paddle_shape_from_length()` - Shape classification
- `normalize_paddle_shape()` - Ensures consistent shape names

### Image Processing (`image_downloader.py`)
- `download_image()` - Downloads and saves paddle images
- Handles various image formats and URLs
- Creates organized directory structure

## Configuration

### Environment Variables
Create `.env` file in `backend/python/`:
```
# Add any API keys or configuration here
```

### Logging
- Colored console output for better debugging
- Different log levels: DEBUG, INFO, WARNING, ERROR
- Detailed scraping progress and error reporting

## Testing

### Manual Testing
```bash
# Test individual paddle scraping
python3 -c "
from galaxy_scraper import PickleballGalaxyScraper
scraper = PickleballGalaxyScraper()
paddle = scraper.scrape_paddle('PADDLE_URL_HERE')
print(paddle)
"
```

### Validation
- Check JSON output structure matches data models
- Verify image downloads are working
- Ensure all required fields are populated

## Common Issues & Solutions

### Scraping Issues
1. **Rate Limiting**: Increase delays in `rate_limit()` method
2. **HTML Structure Changes**: Update CSS selectors in scrapers
3. **Missing Data**: Add fallback extraction methods
4. **Image Download Failures**: Check URL formats and permissions

### Data Quality
1. **Inconsistent Brands**: Update brand recognition lists
2. **Missing Specs**: Improve spec extraction patterns
3. **Duplicate Paddles**: Enhance ID generation logic

## Deployment

### GitHub Actions
- `.github/workflows/deploy-frontend.yml` - Frontend deployment
- `.github/workflows/preview-frontend.yml` - Preview deployments

### Docker
- `backend/go/Dockerfile` - Go service containerization
- `backend/go/docker-compose.yml` - Multi-service setup

## Future Enhancements

### Potential New Scrapers
- Tennis Warehouse
- Dick's Sporting Goods  
- Amazon (with API)
- Manufacturer websites directly

### Data Improvements
- Performance metrics scraping
- Price tracking over time
- User reviews integration
- Paddle comparison features

### Technical Improvements
- Database optimization
- Caching layer
- Real-time scraping updates
- API rate limiting
- Search functionality

## Contact & Maintenance

### Code Organization
- Follow existing patterns when adding new scrapers
- Maintain consistent data models
- Add comprehensive logging
- Include error handling

### Best Practices
- Test scrapers regularly as websites change
- Monitor for rate limiting issues
- Keep brand lists updated
- Validate data quality regularly

---

*Last Updated: September 16, 2025*
*Project: Go Pickleball Paddle Database*
