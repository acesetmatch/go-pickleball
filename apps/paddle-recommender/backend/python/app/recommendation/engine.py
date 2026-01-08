from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.database import SourcePaddle
from app.models import UserPreferences, PaddleRecommendation
from app.recommendation.vector_store import PaddleVectorStore
from app.recommendation.scoring import PaddleScoring
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    def __init__(self):
        self.vector_store = PaddleVectorStore()
        self.scoring = PaddleScoring()

    def initialize(self, db: Session, force_sync: bool = False):
        """Initialize the recommendation engine"""
        self.vector_store.sync_paddles(db, force=force_sync)

    def build_search_query(self, preferences: UserPreferences) -> str:
        """Build semantic search query from user preferences"""
        query_parts = []

        # Primary goal
        goal_mappings = {
            'consistency': 'high control, forgiveness, stable, consistent, reliable',
            'power': 'powerful, high swing weight, pop, drive, aggressive',
            'spin': 'high spin, textured surface, gritty, RPM, topspin',
            'control': 'control, touch, soft game, placement, precision, feel'
        }
        query_parts.append(goal_mappings[preferences.primary_goal])

        # Skill level
        query_parts.append(f"{preferences.skill_level} player paddle")

        # Play styles
        style_mappings = {
            'aggressive_finishing': 'power, put-away, aggressive, drive',
            'all_court': 'balanced, versatile, all-around, control and power',
            'reset_first': 'control, reset, soft shots, stability, touch',
            'hand_speed': 'lightweight, quick, fast hands, maneuverable',
            'singles_specialist': 'reach, coverage, singles, stability',
            'driving_banger': 'drive, power, baseline, aggressive',
            'soft_game': 'control, touch, finesse, dinks, drops, placement, feel',
            'flicks_speed_ups': 'spin, quick, flicks, wrist action'
        }

        for style in preferences.playing_styles:
            style_key = style.value if hasattr(style, 'value') else style
            if style_key in style_mappings:
                query_parts.append(style_mappings[style_key])

        # Weight preference
        query_parts.append(f"{preferences.weight_tolerance} weight")

        # Pain points
        pain_point_mappings = {
            'resets_fall_short': 'more power, longer reach, moderate swing weight',
            'pop_ups': 'better control, higher twist weight, stability',
            'blocks_too_shallow': 'stable paddle, high twist weight, control',
            'not_enough_spin': 'high spin, textured surface, gritty',
            'wrist_hand_speed': 'lightweight, low swing weight, maneuverable',
            'vibration_comfort': 'soft core, arm-friendly, dampening, high twist weight'
        }

        for pain_point in preferences.pain_points:
            point_key = pain_point.value if hasattr(pain_point, 'value') else pain_point
            if point_key in pain_point_mappings:
                query_parts.append(pain_point_mappings[point_key])

        # Arm sensitivity
        if preferences.arm_sensitivity:
            query_parts.append('arm-friendly, soft core, thick core, vibration dampening')

        return " ".join(query_parts)

    def filter_paddles(self, paddles: List[SourcePaddle], preferences: UserPreferences) -> List[SourcePaddle]:
        """Filter paddles by hard constraints"""
        filtered = []

        for paddle in paddles:
            # Budget filter
            if paddle.price:
                try:
                    price = float(paddle.price)
                    if price < preferences.budget_min or price > preferences.budget_max:
                        continue
                except:
                    pass

            # Brand preferences
            if preferences.preferred_brands:
                company_lower = (paddle.company or "").lower()
                if not any(brand.lower() in company_lower for brand in preferences.preferred_brands):
                    continue

            if preferences.brands_to_avoid:
                company_lower = (paddle.company or "").lower()
                if any(brand.lower() in company_lower for brand in preferences.brands_to_avoid):
                    continue

            filtered.append(paddle)

        return filtered

    def get_recommendations(
        self,
        db: Session,
        preferences: UserPreferences,
        limit: int = 5
    ) -> List[PaddleRecommendation]:
        """Get paddle recommendations based on user preferences"""

        # Step 1: Build search query
        search_query = self.build_search_query(preferences)
        logger.info(f"Search query: {search_query}")

        # Step 2: Semantic search for similar paddles
        similar_paddle_metas = self.vector_store.search_similar_paddles(search_query, n_results=30)

        if not similar_paddle_metas:
            logger.warning("No similar paddles found")
            return []

        # Step 3: Get full paddle data from database
        paddle_ids = [meta['paddle_id'] for meta in similar_paddle_metas]
        paddles = db.query(SourcePaddle).filter(SourcePaddle.id.in_(paddle_ids)).all()

        # Step 4: Filter by constraints
        filtered_paddles = self.filter_paddles(paddles, preferences)

        if not filtered_paddles:
            logger.warning("No paddles after filtering")
            return []

        # Step 5: Score and rank
        scored_paddles = []
        for paddle in filtered_paddles:
            score = self.scoring.calculate_score(paddle, preferences)
            reasons = self.scoring.generate_match_reasons(paddle, preferences)

            scored_paddles.append({
                'paddle': paddle,
                'score': score,
                'reasons': reasons
            })

        # Sort by score
        scored_paddles.sort(key=lambda x: x['score'], reverse=True)

        # Step 6: Convert to response model
        recommendations = []
        for item in scored_paddles[:limit]:
            paddle = item['paddle']

            rec = PaddleRecommendation(
                id=paddle.id,
                company=paddle.company or "Unknown",
                paddle_name=paddle.paddle_name or "Unknown",
                price=float(paddle.price) if paddle.price else None,
                match_score=item['score'],
                match_reasons=item['reasons'],
                specs={
                    'weight': paddle.weight,
                    'swing_weight': paddle.swing_weight,
                    'twist_weight': paddle.twist_weight,
                    'core_thickness': paddle.core_thickness,
                    'spin_rpm': paddle.spin_rpm,
                    'control_rating': paddle.control_rating,
                    'power_rating': paddle.power_rating,
                    'spin_rating': paddle.spin_rating,
                    'feel_rating': paddle.feel_rating,
                    'forgiveness_rating': paddle.forgiveness_rating,
                    'touch_shots_rating': paddle.touch_shots_rating
                },
                purchase_link=paddle.purchase_link,
                paddle_image=paddle.paddle_image,
                source=paddle.source or "unknown"
            )
            recommendations.append(rec)

        return recommendations
