"""Recommendation response models."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.models.paddle import PaddleResponse


class MatchReason(BaseModel):
    """Explanation for why a paddle matches user preferences."""

    category: str = Field(..., description="Match category (e.g., 'skill_level', 'play_style')")
    reason: str = Field(..., description="Human-readable explanation")
    score: float = Field(..., ge=0, le=1, description="Match score for this category (0-1)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "play_style",
                "reason": "Excellent control for finesse players",
                "score": 0.92
            }
        }
    )


class PaddleRecommendation(BaseModel):
    """A single paddle recommendation with scoring details."""

    paddle: PaddleResponse = Field(..., description="Paddle details")
    overall_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Overall match score (0-1)"
    )
    confidence_score: float = Field(
        ...,
        ge=0,
        le=1,
        description="Confidence in this recommendation (0-1)"
    )
    match_reasons: List[MatchReason] = Field(
        ...,
        description="Detailed reasons for recommendation"
    )
    rank: int = Field(..., ge=1, description="Rank in recommendation list")

    # Categorical Scores
    skill_match_score: float = Field(..., ge=0, le=1, description="Skill level alignment score")
    style_match_score: float = Field(..., ge=0, le=1, description="Play style match score")
    physical_match_score: float = Field(..., ge=0, le=1, description="Physical attributes match")
    budget_match_score: float = Field(..., ge=0, le=1, description="Budget alignment score")

    # Alternative Options
    is_alternative: bool = Field(
        default=False,
        description="Whether this is an alternative suggestion"
    )
    alternative_reason: Optional[str] = Field(
        None,
        description="Reason for being suggested as alternative"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "paddle": {
                    "id": 1,
                    "name": "Pro Series Control",
                    "brand": "Selkirk",
                    "price_usd": 179.99,
                    "power_rating": 7,
                    "control_rating": 9,
                    "spin_rating": 8
                },
                "overall_score": 0.89,
                "confidence_score": 0.92,
                "match_reasons": [
                    {
                        "category": "play_style",
                        "reason": "Perfect for control-focused players",
                        "score": 0.95
                    }
                ],
                "rank": 1,
                "skill_match_score": 0.88,
                "style_match_score": 0.95,
                "physical_match_score": 0.82,
                "budget_match_score": 0.90,
                "is_alternative": False
            }
        }
    )


class RecommendationMetadata(BaseModel):
    """Metadata about the recommendation request."""

    total_paddles_searched: int = Field(..., description="Total paddles in search space")
    filters_applied: List[str] = Field(..., description="Filters that were applied")
    filters_relaxed: List[str] = Field(
        default_factory=list,
        description="Filters that were relaxed to find results"
    )
    search_duration_ms: float = Field(..., description="Search duration in milliseconds")
    vector_search_duration_ms: Optional[float] = Field(
        None,
        description="Vector search duration"
    )
    scoring_duration_ms: Optional[float] = Field(
        None,
        description="Scoring duration"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_paddles_searched": 150,
                "filters_applied": ["budget", "skill_level", "weight"],
                "filters_relaxed": [],
                "search_duration_ms": 87.5,
                "vector_search_duration_ms": 45.2,
                "scoring_duration_ms": 42.3
            }
        }
    )


class RecommendationResponse(BaseModel):
    """Complete recommendation response."""

    recommendations: List[PaddleRecommendation] = Field(
        ...,
        description="List of recommended paddles"
    )
    alternatives: List[PaddleRecommendation] = Field(
        default_factory=list,
        description="Alternative recommendations"
    )
    metadata: RecommendationMetadata = Field(
        ...,
        description="Request metadata"
    )
    user_preferences_summary: Dict[str, Any] = Field(
        ...,
        description="Summary of user preferences used"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "recommendations": [
                    {
                        "paddle": {
                            "id": 1,
                            "name": "Pro Series Control",
                            "brand": "Selkirk",
                            "price_usd": 179.99
                        },
                        "overall_score": 0.89,
                        "confidence_score": 0.92,
                        "match_reasons": [],
                        "rank": 1,
                        "skill_match_score": 0.88,
                        "style_match_score": 0.95,
                        "physical_match_score": 0.82,
                        "budget_match_score": 0.90,
                        "is_alternative": False
                    }
                ],
                "alternatives": [],
                "metadata": {
                    "total_paddles_searched": 150,
                    "filters_applied": ["budget", "skill_level"],
                    "filters_relaxed": [],
                    "search_duration_ms": 87.5
                },
                "user_preferences_summary": {
                    "skill_level": "intermediate",
                    "play_styles": ["control_finesse"],
                    "budget_range": "100-200"
                }
            }
        }
    )


class SkillSpecifications(BaseModel):
    """Recommended specifications for a skill level."""

    skill_level: str = Field(..., description="Skill level")
    recommended_weight_range: str = Field(..., description="Recommended weight range")
    recommended_balance: str = Field(..., description="Recommended balance point")
    power_vs_control: str = Field(..., description="Power vs control recommendation")
    core_preferences: List[str] = Field(..., description="Recommended core materials")
    face_preferences: List[str] = Field(..., description="Recommended face materials")
    typical_price_range: str = Field(..., description="Typical price range")
    key_features: List[str] = Field(..., description="Key features to look for")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "skill_level": "intermediate",
                "recommended_weight_range": "7.8-8.3 oz",
                "recommended_balance": "balanced to slightly head-light",
                "power_vs_control": "60% control, 40% power",
                "core_preferences": ["polymer", "nomex"],
                "face_preferences": ["fiberglass", "carbon_fiber"],
                "typical_price_range": "$100-$180",
                "key_features": [
                    "Good sweet spot size",
                    "Moderate spin capability",
                    "Comfortable grip"
                ]
            }
        }
    )


class ValidationResponse(BaseModel):
    """Response for preference validation."""

    is_valid: bool = Field(..., description="Whether preferences are valid")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    suggestions: List[str] = Field(
        default_factory=list,
        description="Suggestions for improvement"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "is_valid": True,
                "errors": [],
                "warnings": ["Budget range is quite narrow"],
                "suggestions": [
                    "Consider adding DUPR rating for better recommendations",
                    "Specify grip size for more accurate results"
                ]
            }
        }
    )
