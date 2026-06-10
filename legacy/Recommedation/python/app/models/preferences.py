"""User preference models for paddle recommendations."""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

from app.models.enums import (
    SkillLevel,
    DUPRRange,
    PlayStyle,
    SwingStyle,
    ReactionTime,
    PainPoint,
    Environment,
    ShotPreference,
    BuildQuality,
    WeightPreference,
    GripSize,
    SpinGeneration,
    CustomizationOption,
)


class EnhancedUserPreferences(BaseModel):
    """Enhanced user preferences for paddle recommendations."""

    # Basic Player Info
    skill_level: SkillLevel = Field(
        ...,
        description="Player's overall skill level"
    )
    dupr_rating: Optional[DUPRRange] = Field(
        default=None,
        description="DUPR rating range (optional but recommended)"
    )

    # Play Style (Ranked Preferences)
    play_styles: List[PlayStyle] = Field(
        ...,
        min_length=1,
        max_length=3,
        description="Ranked play styles (1-3), most important first"
    )

    # Shot Preferences (Ranked)
    shot_preferences: List[ShotPreference] = Field(
        ...,
        min_length=2,
        max_length=5,
        description="Ranked shot preferences (2-5), most important first"
    )

    # Physical Attributes
    swing_style: SwingStyle = Field(
        ...,
        description="Player's swing style"
    )
    reaction_time: ReactionTime = Field(
        default=ReactionTime.AVERAGE,
        description="Player's reaction time"
    )

    # Pain Points / Issues
    pain_points: List[PainPoint] = Field(
        default_factory=list,
        description="Physical issues or gameplay challenges to address"
    )

    # Playing Conditions
    environment: Environment = Field(
        default=Environment.BOTH,
        description="Primary playing environment"
    )
    court_surface: Optional[str] = Field(
        default=None,
        description="Specific court surface (e.g., 'acrylic', 'concrete', 'sport court')"
    )

    # Budget & Quality
    budget_min: Optional[float] = Field(
        default=None,
        ge=0,
        description="Minimum budget in USD"
    )
    budget_max: Optional[float] = Field(
        default=None,
        ge=0,
        description="Maximum budget in USD"
    )
    build_quality: BuildQuality = Field(
        default=BuildQuality.MID_RANGE,
        description="Desired build quality level"
    )

    # Paddle Specifications
    weight_preference: Optional[WeightPreference] = Field(
        default=None,
        description="Preferred paddle weight range"
    )
    grip_size: Optional[GripSize] = Field(
        default=None,
        description="Preferred grip circumference"
    )
    spin_requirement: SpinGeneration = Field(
        default=SpinGeneration.MEDIUM,
        description="Desired spin generation capability"
    )

    # Brand & Customization
    preferred_brands: List[str] = Field(
        default_factory=list,
        max_length=5,
        description="Preferred paddle brands (optional)"
    )
    avoided_brands: List[str] = Field(
        default_factory=list,
        max_length=5,
        description="Brands to avoid (optional)"
    )
    customization_options: List[CustomizationOption] = Field(
        default_factory=list,
        description="Interested in customization options"
    )

    # Additional Context
    current_paddle: Optional[str] = Field(
        default=None,
        description="Current paddle model (if upgrading)"
    )
    likes_about_current: Optional[str] = Field(
        default=None,
        max_length=500,
        description="What they like about current paddle"
    )
    dislikes_about_current: Optional[str] = Field(
        default=None,
        max_length=500,
        description="What they dislike about current paddle"
    )

    # Experience Level Details
    years_playing: Optional[int] = Field(
        default=None,
        ge=0,
        le=50,
        description="Years of pickleball experience"
    )
    plays_per_week: Optional[int] = Field(
        default=None,
        ge=0,
        le=30,
        description="Average times playing per week"
    )
    tournament_player: bool = Field(
        default=False,
        description="Whether player competes in tournaments"
    )

    # Hand & Grip Info
    dominant_hand: Optional[str] = Field(
        default=None,
        description="Dominant hand (right/left/ambidextrous)"
    )
    two_handed_backhand: bool = Field(
        default=False,
        description="Uses two-handed backhand"
    )

    @field_validator("budget_max")
    @classmethod
    def validate_budget_range(cls, v: Optional[float], info) -> Optional[float]:
        """Validate that budget_max is greater than budget_min."""
        if v is not None and info.data.get("budget_min") is not None:
            if v < info.data["budget_min"]:
                raise ValueError("budget_max must be greater than or equal to budget_min")
        return v

    @field_validator("play_styles")
    @classmethod
    def validate_unique_play_styles(cls, v: List[PlayStyle]) -> List[PlayStyle]:
        """Ensure play styles are unique."""
        if len(v) != len(set(v)):
            raise ValueError("play_styles must contain unique values")
        return v

    @field_validator("shot_preferences")
    @classmethod
    def validate_unique_shot_preferences(cls, v: List[ShotPreference]) -> List[ShotPreference]:
        """Ensure shot preferences are unique."""
        if len(v) != len(set(v)):
            raise ValueError("shot_preferences must contain unique values")
        return v

    @field_validator("dominant_hand")
    @classmethod
    def validate_dominant_hand(cls, v: Optional[str]) -> Optional[str]:
        """Validate dominant hand value."""
        if v is not None:
            v = v.lower()
            if v not in ["right", "left", "ambidextrous"]:
                raise ValueError("dominant_hand must be 'right', 'left', or 'ambidextrous'")
        return v

    model_config = ConfigDict(
        use_enum_values=False,
        json_schema_extra={
            "example": {
                "skill_level": "intermediate",
                "dupr_rating": "3.5-4.0",
                "play_styles": ["control_finesse", "all_court_balanced"],
                "shot_preferences": ["dinks", "third_shot_drop", "resets"],
                "swing_style": "compact_fast",
                "reaction_time": "fast",
                "pain_points": ["elbow_pain"],
                "environment": "outdoor",
                "budget_min": 100,
                "budget_max": 200,
                "build_quality": "mid_range",
                "spin_requirement": "high",
                "years_playing": 2,
                "plays_per_week": 3,
                "tournament_player": False,
                "dominant_hand": "right"
            }
        }
    )
