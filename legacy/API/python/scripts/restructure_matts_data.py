#!/usr/bin/env python3
"""
Restructure Matt's Pickleball JSON data to match Go models structure.
Converts flat structure to nested specs/performance structure.
"""

import json
from typing import Dict, Any, List

def clean_brand_name(brand: str) -> str:
    """Clean brand name by removing -pickleball suffix and capitalizing first letter."""
    if not brand:
        return brand
    
    # Remove -pickleball suffix (case insensitive)
    cleaned = brand.lower().replace("-pickleball", "")
    
    # Capitalize first letter only if it's not a number
    if cleaned and not cleaned[0].isdigit():
        cleaned = cleaned[0].upper() + cleaned[1:]
    
    return cleaned

def map_paddle_shape(shape_str: str) -> str:
    """Map shape string to Go enum values."""
    shape_mapping = {
        "Elongated": "Elongated",
        "Hybrid": "Hybrid", 
        "Wide-body": "WideBody",
        "Widebody": "WideBody",
        "Standard": "Hybrid"  # Default mapping
    }
    return shape_mapping.get(shape_str, "Hybrid")

def restructure_paddle_data(paddle: Dict[str, Any]) -> Dict[str, Any]:
    """Restructure a single paddle's data to match Go models."""
    
    # Extract specs data
    specs = {
        "shape": map_paddle_shape(paddle.get("Shape", "Hybrid")),
        "surface": paddle.get("Surface Material", ""),
        "average_weight": paddle.get("Static Weight (oz)", 0.0),
        "core": paddle.get("Core Thickness", 0.0),
        "paddle_length": paddle.get("Length (in)", 0.0),
        "paddle_width": paddle.get("Width (in)", 0.0),
        "grip_length": paddle.get("Handle Length (in)", 0.0),
        "grip_type": paddle.get("Surface Texture", ""),  # Use surface texture as grip type
        "grip_circumference": paddle.get("Handle Circumference (in)", 0.0)
    }
    
    # Extract performance data
    performance = {
        "power": paddle.get("Power (Drive) Rating", 0.0),
        "pop": paddle.get("Punch Volley Speed MPH (pop)", 0.0),
        "spin": paddle.get("Spin RPM", 0.0),
        "twist_weight": paddle.get("Twist Weight", 0.0),
        "swing_weight": paddle.get("Swing Weight", 0.0),
        "balance_point": paddle.get("Balance Point (cm)", 0.0)
    }
    
    # Create restructured paddle object
    restructured = {
        "name": paddle.get("Paddle Name", ""),
        "brand": clean_brand_name(paddle.get("Company", "")),
        "price": paddle.get("Price", 0.0),
        "image_url": paddle.get("Paddle Image", ""),
        "buy_url": paddle.get("Buy URL", ""),
        "specs": specs,
        "performance": performance,
        # Keep additional useful fields
        "type": paddle.get("Type", ""),
        "manufacturing_process": paddle.get("Manufacturing Process", ""),
        "core_material": paddle.get("Core Material", ""),
        "approval_body": paddle.get("Approval Body", ""),
        "release_year": paddle.get("Release Year", 0),
        "paddle_rating": paddle.get("Paddle Rating", ""),
        "firepower": paddle.get("Firepower", 0)
    }
    
    return restructured

def restructure_matts_data(input_file: str, output_file: str):
    """Restructure the entire Matt's Pickleball dataset."""
    
    print(f"Loading data from {input_file}...")
    with open(input_file, 'r') as f:
        paddles = json.load(f)
    
    print(f"Restructuring {len(paddles)} paddles...")
    restructured_paddles = []
    
    for i, paddle in enumerate(paddles):
        try:
            restructured = restructure_paddle_data(paddle)
            restructured_paddles.append(restructured)
            
            if (i + 1) % 100 == 0:
                print(f"Processed {i + 1}/{len(paddles)} paddles...")
                
        except Exception as e:
            print(f"Error processing paddle {i}: {e}")
            continue
    
    print(f"Saving {len(restructured_paddles)} restructured paddles to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(restructured_paddles, f, indent=2)
    
    print("Restructuring complete!")
    
    # Show sample of restructured data
    if restructured_paddles:
        print("\nSample restructured paddle:")
        sample = restructured_paddles[0]
        print(f"Name: {sample['name']}")
        print(f"Brand: {sample['brand']}")
        print(f"Specs: {sample['specs']}")
        print(f"Performance: {sample['performance']}")

if __name__ == "__main__":
    restructure_matts_data(
        "data/scraped/mattspickleball.json", 
        "data/output/mattspickleball_restructured.json"
    )
