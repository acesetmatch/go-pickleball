from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT_PRO = "expert_pro"

class PlayStyle(str, Enum):
    AGGRESSIVE_FINISHING = "aggressive_finishing"
    ALL_COURT = "all_court"
    RESET_FIRST = "reset_first"
    HAND_SPEED = "hand_speed"
    SINGLES_SPECIALIST = "singles_specialist"
    DRIVING_BANGER = "driving_banger"
    SOFT_GAME = "soft_game"
    FLICKS_SPEED_UPS = "flicks_speed_ups"

class PainPoint(str, Enum):
    RESETS_FALL_SHORT = "resets_fall_short"
    POP_UPS = "pop_ups"
    BLOCKS_TOO_SHALLOW = "blocks_too_shallow"
    NOT_ENOUGH_SPIN = "not_enough_spin"
    WRIST_HAND_SPEED = "wrist_hand_speed"
    VIBRATION_COMFORT = "vibration_comfort"

class UserPreferences(BaseModel):
    # Skill Level & Context
    skill_level: SkillLevel
    game_format: Literal["singles", "doubles", "both"]
    competitive_level: Literal["recreational", "league", "tournament"]

    # Play Style & Tendencies
    playing_styles: List[PlayStyle]
    game_focus: Literal["power", "control", "spin", "balanced"]

    # Physical Factors
    arm_sensitivity: bool = False
    grip_size: Optional[str] = None
    handle_length: Optional[str] = None
    weight_tolerance: Literal["light", "medium", "heavy"]

    # Paddle Feel & Customization
    paddle_feel: Literal["more_power", "more_control", "balanced"]
    customization_preference: bool = False

    # Current Setup & Pain Points
    current_paddle: Optional[str] = None
    pain_points: List[PainPoint] = []
    additional_notes: Optional[str] = None

    # Environment & Opponents
    playing_environment: int = Field(50, ge=0, le=100)  # 0=outdoor, 100=indoor
    common_opponents: List[Literal["bangers", "dinkers", "mixed"]] = []

    # Budget & Brand
    budget_min: float = 50
    budget_max: float = 500
    preferred_brands: Optional[List[str]] = None
    brands_to_avoid: Optional[List[str]] = None

    # Aspirations/Goals
    primary_goal: Literal["consistency", "power", "spin", "control"]
    target_rating: Optional[float] = None

class PaddleRecommendation(BaseModel):
    id: int
    company: str
    paddle_name: str
    price: Optional[float]
    match_score: float
    match_reasons: List[str]
    specs: dict
    purchase_link: Optional[str]
    paddle_image: Optional[str]
    source: str
