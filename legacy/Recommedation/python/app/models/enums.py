"""Enums for paddle recommendation system."""

from enum import Enum


class SkillLevel(str, Enum):
    """Player skill level."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PROFESSIONAL = "professional"


class DUPRRange(str, Enum):
    """DUPR (Dynamic Universal Pickleball Rating) ranges."""
    DUPR_2_0_2_5 = "2.0-2.5"
    DUPR_2_5_3_0 = "2.5-3.0"
    DUPR_3_0_3_5 = "3.0-3.5"
    DUPR_3_5_4_0 = "3.5-4.0"
    DUPR_4_0_4_5 = "4.0-4.5"
    DUPR_4_5_5_0 = "4.5-5.0"
    DUPR_5_0_5_5 = "5.0-5.5"
    DUPR_5_5_PLUS = "5.5+"


class PlayStyle(str, Enum):
    """Player play style preferences."""
    AGGRESSIVE_POWER = "aggressive_power"
    CONTROL_FINESSE = "control_finesse"
    ALL_COURT_BALANCED = "all_court_balanced"
    DEFENSIVE_COUNTER = "defensive_counter"
    TOUCH_SOFT_GAME = "touch_soft_game"
    SPIN_HEAVY = "spin_heavy"
    FAST_HANDS_QUICK = "fast_hands_quick"


class SwingStyle(str, Enum):
    """Player swing style."""
    LONG_LOOPY = "long_loopy"
    COMPACT_FAST = "compact_fast"
    MEDIUM_CONTROLLED = "medium_controlled"
    WRISTY_SPIN = "wristy_spin"


class ReactionTime(str, Enum):
    """Player reaction time."""
    VERY_FAST = "very_fast"
    FAST = "fast"
    AVERAGE = "average"
    DELIBERATE = "deliberate"


class PainPoint(str, Enum):
    """Player pain points or issues to address."""
    ELBOW_PAIN = "elbow_pain"
    SHOULDER_PAIN = "shoulder_pain"
    WRIST_PAIN = "wrist_pain"
    LACK_OF_POWER = "lack_of_power"
    LACK_OF_CONTROL = "lack_of_control"
    INCONSISTENT_SERVES = "inconsistent_serves"
    DIFFICULTY_WITH_SPIN = "difficulty_with_spin"
    HAND_SHOCK = "hand_shock"
    FATIGUE = "fatigue"
    NONE = "none"


class Environment(str, Enum):
    """Playing environment."""
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    BOTH = "both"


class ShotPreference(str, Enum):
    """Preferred shot types."""
    DRIVES = "drives"
    DINKS = "dinks"
    LOBS = "lobs"
    VOLLEYS = "volleys"
    SERVES = "serves"
    THIRD_SHOT_DROP = "third_shot_drop"
    SPEED_UPS = "speed_ups"
    RESETS = "resets"


class BuildQuality(str, Enum):
    """Paddle build quality preference."""
    BUDGET = "budget"
    MID_RANGE = "mid_range"
    PREMIUM = "premium"
    PRO_LEVEL = "pro_level"


class CoreMaterial(str, Enum):
    """Paddle core material."""
    POLYMER = "polymer"
    NOMEX = "nomex"
    ALUMINUM = "aluminum"
    CARBON = "carbon"
    HYBRID = "hybrid"
    FOAM = "foam"


class FaceMaterial(str, Enum):
    """Paddle face material."""
    FIBERGLASS = "fiberglass"
    CARBON_FIBER = "carbon_fiber"
    GRAPHITE = "graphite"
    COMPOSITE = "composite"


class PaddleShape(str, Enum):
    """Paddle shape."""
    STANDARD = "standard"
    ELONGATED = "elongated"
    WIDEBODY = "widebody"
    HYBRID = "hybrid"


class HandleLength(str, Enum):
    """Handle length preference."""
    SHORT = "short"       # 4-4.5 inches
    STANDARD = "standard" # 4.5-5 inches
    LONG = "long"        # 5-5.5 inches
    EXTRA_LONG = "extra_long"  # 5.5+ inches


class WeightPreference(str, Enum):
    """Weight preference."""
    LIGHT = "light"           # <7.3 oz
    MEDIUM_LIGHT = "medium_light"  # 7.3-7.8 oz
    MEDIUM = "medium"         # 7.8-8.3 oz
    MEDIUM_HEAVY = "medium_heavy"  # 8.3-8.8 oz
    HEAVY = "heavy"          # >8.8 oz


class GripSize(str, Enum):
    """Grip circumference."""
    SMALL = "small"      # 4.0-4.125 inches
    MEDIUM = "medium"    # 4.125-4.25 inches
    LARGE = "large"      # 4.25-4.375 inches
    EXTRA_LARGE = "extra_large"  # 4.375-4.5 inches


class SpinGeneration(str, Enum):
    """Spin generation capability preference."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class CustomizationOption(str, Enum):
    """Paddle customization options."""
    LEAD_TAPE = "lead_tape"
    GRIP_MODIFICATION = "grip_modification"
    EDGE_GUARD_REMOVAL = "edge_guard_removal"
    WEIGHT_ADJUSTMENT = "weight_adjustment"
    NONE = "none"


# Mapping functions for DUPR to skill level
def dupr_to_skill_level(dupr: DUPRRange) -> SkillLevel:
    """Convert DUPR range to skill level."""
    mapping = {
        DUPRRange.DUPR_2_0_2_5: SkillLevel.BEGINNER,
        DUPRRange.DUPR_2_5_3_0: SkillLevel.BEGINNER,
        DUPRRange.DUPR_3_0_3_5: SkillLevel.INTERMEDIATE,
        DUPRRange.DUPR_3_5_4_0: SkillLevel.INTERMEDIATE,
        DUPRRange.DUPR_4_0_4_5: SkillLevel.ADVANCED,
        DUPRRange.DUPR_4_5_5_0: SkillLevel.ADVANCED,
        DUPRRange.DUPR_5_0_5_5: SkillLevel.PROFESSIONAL,
        DUPRRange.DUPR_5_5_PLUS: SkillLevel.PROFESSIONAL,
    }
    return mapping.get(dupr, SkillLevel.INTERMEDIATE)


def skill_level_to_dupr_ranges(skill: SkillLevel) -> list[DUPRRange]:
    """Get DUPR ranges for a skill level."""
    mapping = {
        SkillLevel.BEGINNER: [DUPRRange.DUPR_2_0_2_5, DUPRRange.DUPR_2_5_3_0],
        SkillLevel.INTERMEDIATE: [DUPRRange.DUPR_3_0_3_5, DUPRRange.DUPR_3_5_4_0],
        SkillLevel.ADVANCED: [DUPRRange.DUPR_4_0_4_5, DUPRRange.DUPR_4_5_5_0],
        SkillLevel.PROFESSIONAL: [DUPRRange.DUPR_5_0_5_5, DUPRRange.DUPR_5_5_PLUS],
    }
    return mapping.get(skill, [DUPRRange.DUPR_3_0_3_5])
