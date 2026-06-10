"""Paddle data models."""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, JSON
from sqlalchemy.orm import declarative_base
from pydantic import BaseModel, Field, ConfigDict

Base = declarative_base()


class SourcePaddle(Base):
    """
    SQLAlchemy model for paddle data from PostgreSQL.

    This model mirrors the paddle data structure from the main database.
    """
    __tablename__ = "source_paddles"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Basic Info
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=True)

    # Specifications
    weight_oz = Column(Float, nullable=True)
    length_inches = Column(Float, nullable=True)
    width_inches = Column(Float, nullable=True)
    handle_length_inches = Column(Float, nullable=True)
    grip_circumference_inches = Column(Float, nullable=True)

    # Materials
    core_material = Column(String(50), nullable=True)
    face_material = Column(String(50), nullable=True)

    # Thickness
    core_thickness_mm = Column(Float, nullable=True)

    # Price
    price_usd = Column(Float, nullable=True, index=True)

    # Performance Characteristics
    power_rating = Column(Integer, nullable=True)  # 1-10 scale
    control_rating = Column(Integer, nullable=True)  # 1-10 scale
    spin_rating = Column(Integer, nullable=True)  # 1-10 scale
    touch_rating = Column(Integer, nullable=True)  # 1-10 scale
    maneuverability_rating = Column(Integer, nullable=True)  # 1-10 scale

    # Shape & Design
    shape = Column(String(50), nullable=True)
    edge_guard = Column(Boolean, default=True)

    # Target Audience
    skill_level_target = Column(String(50), nullable=True)  # beginner, intermediate, advanced, pro

    # Description & Features
    description = Column(Text, nullable=True)
    features = Column(JSON, nullable=True)  # List of key features

    # URLs & Images
    product_url = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)

    # Availability
    in_stock = Column(Boolean, default=True)
    usapa_approved = Column(Boolean, default=True)

    # Additional Data
    review_rating = Column(Float, nullable=True)  # Average review rating
    review_count = Column(Integer, default=0)
    popularity_score = Column(Float, nullable=True)  # Calculated popularity

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        """String representation."""
        return f"<SourcePaddle(id={self.id}, name='{self.name}', brand='{self.brand}')>"


class PaddleResponse(BaseModel):
    """Pydantic model for paddle API responses."""

    id: int = Field(..., description="Paddle ID")
    name: str = Field(..., description="Paddle name")
    brand: str = Field(..., description="Brand name")
    model: Optional[str] = Field(None, description="Model identifier")

    # Specifications
    weight_oz: Optional[float] = Field(None, description="Weight in ounces")
    length_inches: Optional[float] = Field(None, description="Length in inches")
    width_inches: Optional[float] = Field(None, description="Width in inches")
    handle_length_inches: Optional[float] = Field(None, description="Handle length")
    grip_circumference_inches: Optional[float] = Field(None, description="Grip circumference")

    # Materials
    core_material: Optional[str] = Field(None, description="Core material type")
    face_material: Optional[str] = Field(None, description="Face material type")
    core_thickness_mm: Optional[float] = Field(None, description="Core thickness in mm")

    # Price
    price_usd: Optional[float] = Field(None, description="Price in USD")

    # Performance Ratings
    power_rating: Optional[int] = Field(None, ge=1, le=10, description="Power rating (1-10)")
    control_rating: Optional[int] = Field(None, ge=1, le=10, description="Control rating (1-10)")
    spin_rating: Optional[int] = Field(None, ge=1, le=10, description="Spin rating (1-10)")
    touch_rating: Optional[int] = Field(None, ge=1, le=10, description="Touch rating (1-10)")
    maneuverability_rating: Optional[int] = Field(
        None, ge=1, le=10, description="Maneuverability rating (1-10)"
    )

    # Shape & Design
    shape: Optional[str] = Field(None, description="Paddle shape")
    edge_guard: bool = Field(True, description="Has edge guard")

    # Target Audience
    skill_level_target: Optional[str] = Field(None, description="Target skill level")

    # Description
    description: Optional[str] = Field(None, description="Paddle description")
    features: Optional[List[str]] = Field(None, description="Key features")

    # URLs
    product_url: Optional[str] = Field(None, description="Product URL")
    image_url: Optional[str] = Field(None, description="Image URL")

    # Availability
    in_stock: bool = Field(True, description="In stock status")
    usapa_approved: bool = Field(True, description="USAPA approved")

    # Reviews
    review_rating: Optional[float] = Field(None, ge=0, le=5, description="Average review rating")
    review_count: int = Field(0, ge=0, description="Number of reviews")
    popularity_score: Optional[float] = Field(None, description="Popularity score")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Pro Series Control",
                "brand": "Selkirk",
                "model": "SLK-2024",
                "weight_oz": 8.0,
                "length_inches": 16.0,
                "width_inches": 8.0,
                "handle_length_inches": 5.25,
                "grip_circumference_inches": 4.25,
                "core_material": "polymer",
                "face_material": "carbon_fiber",
                "core_thickness_mm": 16,
                "price_usd": 179.99,
                "power_rating": 7,
                "control_rating": 9,
                "spin_rating": 8,
                "touch_rating": 9,
                "maneuverability_rating": 7,
                "shape": "standard",
                "edge_guard": True,
                "skill_level_target": "advanced",
                "in_stock": True,
                "usapa_approved": True,
                "review_rating": 4.7,
                "review_count": 243
            }
        }
    )


class PaddleDetail(PaddleResponse):
    """Extended paddle details with additional metadata."""

    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)
