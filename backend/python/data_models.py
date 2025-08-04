import re
import hashlib
from dataclasses import dataclass
from typing import Optional

# Data classes for paddle information
@dataclass
class Metadata:
    brand: str
    model: str
    source: str  # Store the scraping source

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
    """Extract a float from text."""
    if not text:
        return None
    
    match = re.search(r'(\d+\.?\d*)', text)
    if match:
        return float(match.group(1))
    return None

def clean_model_name(model: str) -> str:
    """Clean up a paddle model name by removing unwanted characters and standardizing format.
    
    Args:
        model: The raw model name string
        
    Returns:
        A cleaned model name string
    """
    if not model:
        return model
        
    # First, remove pipe delimiters and anything after them
    model = re.sub(r'\s*\|\s*.*$', '', model)  # Remove pipe and anything after it
    model = re.sub(r'[|│｜︱丨｜]+', '', model)  # Remove various Unicode pipe characters
    
    # Remove common unwanted suffixes
    unwanted_suffixes = [
        "Pickleball Paddle", "Paddle", " - PBC", " - NEW",
        " - Limited Edition", " - LE", " -", "|", "│",
        " - Elongated", " - Standard", " - Teardrop"
    ]
    for suffix in unwanted_suffixes:
        if model.endswith(suffix):
            model = model[:-len(suffix)].strip()
    
    # Clean up parenthetical descriptions
    model = re.sub(r'\s*\([^)]*\)\s*', ' ', model).strip()
    
    # Remove common descriptors that aren't part of the model name
    common_descriptors = ["New", "NEW", "Limited Edition", "SALE", "In Stock"]
    for descriptor in common_descriptors:
        model = re.sub(rf'\b{re.escape(descriptor)}\b', '', model, flags=re.IGNORECASE)
    
    # Clean up multiple spaces and trim
    model = re.sub(r'\s+', ' ', model).strip()
    
    return model 

def determine_paddle_shape_from_length(paddle_length: float) -> str:
    """Determine paddle shape based on its length in inches.
    
    Args:
        paddle_length: The paddle length in inches
        
    Returns:
        The paddle shape category: "Elongated", "Hybrid", or "Wide-body"
    """
    if paddle_length >= 16.5:
        return "Elongated"
    elif paddle_length >= 16.25:
        return "Hybrid"
    else:
        return "Wide-body"  # Typically 16 inches or shorter

def normalize_paddle_shape(shape: str) -> str:
    """Normalize paddle shape to match Go backend expectations.
    
    Args:
        shape: The raw shape string from scraping
        
    Returns:
        Normalized shape: "Elongated", "Hybrid", or "Wide-body"
    """
    if not shape:
        return "Wide-body"  # Default fallback
    
    shape_lower = shape.lower().strip()
    
    # Map common shape variations to the accepted values
    shape_mapping = {
        # Elongated variations
        "elongated": "Elongated",
        "elongated shape": "Elongated",
        "long": "Elongated",
        
        # Hybrid variations  
        "hybrid": "Hybrid",
        "hybrid shape": "Hybrid",
        
        # Wide-body variations
        "wide-body": "Wide-body",
        "widebody": "Wide-body", 
        "wide body": "Wide-body",
        "standard": "Wide-body",
        "teardrop": "Wide-body",
        "traditional": "Wide-body",
        "classic": "Wide-body",
        
        # Default fallback
        "": "Wide-body"
    }
    
    return shape_mapping.get(shape_lower, "Wide-body") 