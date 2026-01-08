"""Unit tests for data models."""

import pytest
from pydantic import ValidationError

from app.models.enums import (
    SkillLevel,
    DUPRRange,
    PlayStyle,
    SwingStyle,
    ReactionTime,
    PainPoint,
    Environment,
    ShotPreference,
    dupr_to_skill_level,
    skill_level_to_dupr_ranges,
)
from app.models.preferences import EnhancedUserPreferences
from app.models.paddle import PaddleResponse
from app.models.recommendations import (
    MatchReason,
    PaddleRecommendation,
    RecommendationMetadata,
    RecommendationResponse,
)


class TestEnums:
    """Test enum classes and utility functions."""

    def test_skill_level_enum(self) -> None:
        """Test SkillLevel enum."""
        assert SkillLevel.BEGINNER.value == "beginner"
        assert SkillLevel.INTERMEDIATE.value == "intermediate"
        assert SkillLevel.ADVANCED.value == "advanced"
        assert SkillLevel.PROFESSIONAL.value == "professional"

    def test_dupr_to_skill_level(self) -> None:
        """Test DUPR to skill level conversion."""
        assert dupr_to_skill_level(DUPRRange.DUPR_2_0_2_5) == SkillLevel.BEGINNER
        assert dupr_to_skill_level(DUPRRange.DUPR_3_5_4_0) == SkillLevel.INTERMEDIATE
        assert dupr_to_skill_level(DUPRRange.DUPR_4_5_5_0) == SkillLevel.ADVANCED
        assert dupr_to_skill_level(DUPRRange.DUPR_5_5_PLUS) == SkillLevel.PROFESSIONAL

    def test_skill_level_to_dupr_ranges(self) -> None:
        """Test skill level to DUPR ranges conversion."""
        beginner_ranges = skill_level_to_dupr_ranges(SkillLevel.BEGINNER)
        assert DUPRRange.DUPR_2_0_2_5 in beginner_ranges
        assert DUPRRange.DUPR_2_5_3_0 in beginner_ranges

        advanced_ranges = skill_level_to_dupr_ranges(SkillLevel.ADVANCED)
        assert DUPRRange.DUPR_4_0_4_5 in advanced_ranges
        assert DUPRRange.DUPR_4_5_5_0 in advanced_ranges


class TestEnhancedUserPreferences:
    """Test EnhancedUserPreferences model."""

    def test_valid_preferences(self) -> None:
        """Test creating valid user preferences."""
        prefs = EnhancedUserPreferences(
            skill_level=SkillLevel.INTERMEDIATE,
            dupr_rating=DUPRRange.DUPR_3_5_4_0,
            play_styles=[PlayStyle.CONTROL_FINESSE, PlayStyle.ALL_COURT_BALANCED],
            shot_preferences=[ShotPreference.DINKS, ShotPreference.THIRD_SHOT_DROP],
            swing_style=SwingStyle.COMPACT_FAST,
            reaction_time=ReactionTime.FAST,
            environment=Environment.OUTDOOR,
            budget_min=100.0,
            budget_max=200.0,
        )

        assert prefs.skill_level == SkillLevel.INTERMEDIATE
        assert len(prefs.play_styles) == 2
        assert prefs.budget_min == 100.0
        assert prefs.budget_max == 200.0

    def test_budget_validation(self) -> None:
        """Test budget validation."""
        with pytest.raises(ValidationError) as exc_info:
            EnhancedUserPreferences(
                skill_level=SkillLevel.INTERMEDIATE,
                play_styles=[PlayStyle.CONTROL_FINESSE],
                shot_preferences=[ShotPreference.DINKS, ShotPreference.DRIVES],
                swing_style=SwingStyle.COMPACT_FAST,
                budget_min=200.0,
                budget_max=100.0,  # Invalid: max < min
            )

        assert "budget_max must be greater than or equal to budget_min" in str(exc_info.value)

    def test_unique_play_styles(self) -> None:
        """Test play styles must be unique."""
        with pytest.raises(ValidationError) as exc_info:
            EnhancedUserPreferences(
                skill_level=SkillLevel.INTERMEDIATE,
                play_styles=[
                    PlayStyle.CONTROL_FINESSE,
                    PlayStyle.CONTROL_FINESSE,  # Duplicate
                ],
                shot_preferences=[ShotPreference.DINKS, ShotPreference.DRIVES],
                swing_style=SwingStyle.COMPACT_FAST,
            )

        assert "play_styles must contain unique values" in str(exc_info.value)

    def test_unique_shot_preferences(self) -> None:
        """Test shot preferences must be unique."""
        with pytest.raises(ValidationError) as exc_info:
            EnhancedUserPreferences(
                skill_level=SkillLevel.INTERMEDIATE,
                play_styles=[PlayStyle.CONTROL_FINESSE],
                shot_preferences=[
                    ShotPreference.DINKS,
                    ShotPreference.DINKS,  # Duplicate
                ],
                swing_style=SwingStyle.COMPACT_FAST,
            )

        assert "shot_preferences must contain unique values" in str(exc_info.value)

    def test_dominant_hand_validation(self) -> None:
        """Test dominant hand validation."""
        # Valid values
        prefs = EnhancedUserPreferences(
            skill_level=SkillLevel.INTERMEDIATE,
            play_styles=[PlayStyle.CONTROL_FINESSE],
            shot_preferences=[ShotPreference.DINKS, ShotPreference.DRIVES],
            swing_style=SwingStyle.COMPACT_FAST,
            dominant_hand="right",
        )
        assert prefs.dominant_hand == "right"

        # Invalid value
        with pytest.raises(ValidationError) as exc_info:
            EnhancedUserPreferences(
                skill_level=SkillLevel.INTERMEDIATE,
                play_styles=[PlayStyle.CONTROL_FINESSE],
                shot_preferences=[ShotPreference.DINKS, ShotPreference.DRIVES],
                swing_style=SwingStyle.COMPACT_FAST,
                dominant_hand="invalid",
            )

        assert "dominant_hand must be" in str(exc_info.value)

    def test_min_max_lengths(self) -> None:
        """Test minimum and maximum list lengths."""
        # Too few play styles
        with pytest.raises(ValidationError):
            EnhancedUserPreferences(
                skill_level=SkillLevel.INTERMEDIATE,
                play_styles=[],  # Empty list
                shot_preferences=[ShotPreference.DINKS, ShotPreference.DRIVES],
                swing_style=SwingStyle.COMPACT_FAST,
            )

        # Too many play styles
        with pytest.raises(ValidationError):
            EnhancedUserPreferences(
                skill_level=SkillLevel.INTERMEDIATE,
                play_styles=[
                    PlayStyle.CONTROL_FINESSE,
                    PlayStyle.ALL_COURT_BALANCED,
                    PlayStyle.AGGRESSIVE_POWER,
                    PlayStyle.DEFENSIVE_COUNTER,  # 4 items, max is 3
                ],
                shot_preferences=[ShotPreference.DINKS, ShotPreference.DRIVES],
                swing_style=SwingStyle.COMPACT_FAST,
            )


class TestPaddleResponse:
    """Test PaddleResponse model."""

    def test_valid_paddle_response(self) -> None:
        """Test creating valid paddle response."""
        paddle = PaddleResponse(
            id=1,
            name="Pro Series Control",
            brand="Selkirk",
            model="SLK-2024",
            weight_oz=8.0,
            price_usd=179.99,
            power_rating=7,
            control_rating=9,
            spin_rating=8,
        )

        assert paddle.id == 1
        assert paddle.name == "Pro Series Control"
        assert paddle.brand == "Selkirk"
        assert paddle.weight_oz == 8.0
        assert paddle.price_usd == 179.99

    def test_rating_bounds(self) -> None:
        """Test rating value bounds."""
        # Valid ratings
        paddle = PaddleResponse(
            id=1,
            name="Test Paddle",
            brand="Test Brand",
            power_rating=5,
            control_rating=10,
            spin_rating=1,
        )
        assert paddle.power_rating == 5
        assert paddle.control_rating == 10
        assert paddle.spin_rating == 1

        # Invalid rating (too high)
        with pytest.raises(ValidationError):
            PaddleResponse(
                id=1,
                name="Test Paddle",
                brand="Test Brand",
                power_rating=11,  # Max is 10
            )


class TestRecommendationModels:
    """Test recommendation response models."""

    def test_match_reason(self) -> None:
        """Test MatchReason model."""
        reason = MatchReason(
            category="play_style",
            reason="Excellent control for finesse players",
            score=0.92,
        )

        assert reason.category == "play_style"
        assert reason.score == 0.92

        # Test score bounds
        with pytest.raises(ValidationError):
            MatchReason(
                category="test",
                reason="test",
                score=1.5,  # Max is 1.0
            )

    def test_paddle_recommendation(self) -> None:
        """Test PaddleRecommendation model."""
        paddle = PaddleResponse(
            id=1,
            name="Test Paddle",
            brand="Test Brand",
        )

        recommendation = PaddleRecommendation(
            paddle=paddle,
            overall_score=0.89,
            confidence_score=0.92,
            match_reasons=[
                MatchReason(category="skill", reason="Good match", score=0.9)
            ],
            rank=1,
            skill_match_score=0.88,
            style_match_score=0.95,
            physical_match_score=0.82,
            budget_match_score=0.90,
        )

        assert recommendation.overall_score == 0.89
        assert recommendation.rank == 1
        assert len(recommendation.match_reasons) == 1
        assert not recommendation.is_alternative

    def test_recommendation_metadata(self) -> None:
        """Test RecommendationMetadata model."""
        metadata = RecommendationMetadata(
            total_paddles_searched=150,
            filters_applied=["budget", "skill_level"],
            filters_relaxed=[],
            search_duration_ms=87.5,
        )

        assert metadata.total_paddles_searched == 150
        assert len(metadata.filters_applied) == 2
        assert metadata.search_duration_ms == 87.5

    def test_recommendation_response(self) -> None:
        """Test complete RecommendationResponse model."""
        paddle = PaddleResponse(
            id=1,
            name="Test Paddle",
            brand="Test Brand",
        )

        recommendation = PaddleRecommendation(
            paddle=paddle,
            overall_score=0.89,
            confidence_score=0.92,
            match_reasons=[],
            rank=1,
            skill_match_score=0.88,
            style_match_score=0.95,
            physical_match_score=0.82,
            budget_match_score=0.90,
        )

        metadata = RecommendationMetadata(
            total_paddles_searched=150,
            filters_applied=["budget"],
            search_duration_ms=87.5,
        )

        response = RecommendationResponse(
            recommendations=[recommendation],
            alternatives=[],
            metadata=metadata,
            user_preferences_summary={"skill_level": "intermediate"},
        )

        assert len(response.recommendations) == 1
        assert len(response.alternatives) == 0
        assert response.metadata.total_paddles_searched == 150


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
