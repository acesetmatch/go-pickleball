from typing import Dict, Any, List
from app.models import UserPreferences, PlayStyle, PainPoint
import re

class PaddleScoring:
    @staticmethod
    def calculate_score(paddle: Any, preferences: UserPreferences) -> float:
        """Calculate match score for a paddle based on user preferences"""
        weights = {
            'primary_goal': 0.25,
            'play_style': 0.20,
            'weight': 0.10,
            'swing_weight': 0.10,
            'twist_weight': 0.10,
            'price': 0.10,
            'spin': 0.10,
            'build': 0.05
        }

        score = 0
        score += PaddleScoring._score_goal_alignment(paddle, preferences) * weights['primary_goal']
        score += PaddleScoring._score_play_style(paddle, preferences) * weights['play_style']
        score += PaddleScoring._score_weight(paddle, preferences) * weights['weight']
        score += PaddleScoring._score_swing_weight(paddle, preferences) * weights['swing_weight']
        score += PaddleScoring._score_twist_weight(paddle, preferences) * weights['twist_weight']
        score += PaddleScoring._score_budget(paddle, preferences) * weights['price']
        score += PaddleScoring._score_spin(paddle, preferences) * weights['spin']
        score += PaddleScoring._score_build_quality(paddle, preferences) * weights['build']

        return round(score, 2)

    @staticmethod
    def _score_goal_alignment(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on primary goal alignment"""
        score = 0

        if preferences.primary_goal == "consistency":
            if paddle.control_rating:
                score += (paddle.control_rating / 10) * 50
            if paddle.forgiveness_rating:
                score += (paddle.forgiveness_rating / 10) * 50

        elif preferences.primary_goal == "power":
            if paddle.power_percentile:
                percentile = PaddleScoring._parse_percentile(paddle.power_percentile)
                score += percentile
            if paddle.serve_speed and paddle.serve_speed > 50:
                score += min((paddle.serve_speed - 50) * 2, 100)

        elif preferences.primary_goal == "spin":
            if paddle.spin_rpm:
                score += min((paddle.spin_rpm / 2000) * 100, 100)
            if paddle.spin_percentile:
                percentile = PaddleScoring._parse_percentile(paddle.spin_percentile)
                score += percentile * 0.5

        elif preferences.primary_goal == "control":
            if paddle.control_rating:
                score += (paddle.control_rating / 10) * 50
            if paddle.touch_shots_rating:
                score += (paddle.touch_shots_rating / 10) * 30
            if paddle.feel_rating:
                score += (paddle.feel_rating / 10) * 20

        return min(score, 100)

    @staticmethod
    def _score_play_style(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on play style match"""
        style_scores = {}

        for style in preferences.playing_styles:
            if style in [PlayStyle.AGGRESSIVE_FINISHING, PlayStyle.DRIVING_BANGER]:
                if paddle.swing_weight and paddle.swing_weight > 115:
                    style_scores[style] = 80
                if paddle.power_percentile:
                    power = PaddleScoring._parse_percentile(paddle.power_percentile)
                    style_scores[style] = max(style_scores.get(style, 0), power)

            elif style in [PlayStyle.SOFT_GAME, PlayStyle.RESET_FIRST]:
                # High control is crucial for soft game
                if paddle.control_rating and paddle.control_rating >= 8:
                    style_scores[style] = 95
                if paddle.touch_shots_rating and paddle.touch_shots_rating >= 8:
                    style_scores[style] = max(style_scores.get(style, 0), 90)
                if paddle.feel_rating and paddle.feel_rating >= 8:
                    style_scores[style] = max(style_scores.get(style, 0), 85)
                # Higher twist weight for stability
                if paddle.twist_weight and paddle.twist_weight > 6.5:
                    style_scores[style] = max(style_scores.get(style, 0), 90)
                # Moderate swing weight for soft feet movement
                if paddle.swing_weight and 105 <= paddle.swing_weight <= 113:
                    style_scores[style] = max(style_scores.get(style, 0), 85)
                if paddle.forgiveness_rating and paddle.forgiveness_rating >= 7:
                    style_scores[style] = max(style_scores.get(style, 0), 80)

            elif style == PlayStyle.HAND_SPEED:
                if paddle.swing_weight and paddle.swing_weight < 110:
                    style_scores[style] = 85
                # Balanced twist weight for quick hands with stability
                if paddle.twist_weight and 6.0 <= paddle.twist_weight <= 6.8:
                    style_scores[style] = max(style_scores.get(style, 0), 80)

            elif style == PlayStyle.ALL_COURT:
                if paddle.control_rating and 7 <= paddle.control_rating <= 8.5:
                    style_scores[style] = 85

        if style_scores:
            return sum(style_scores.values()) / len(style_scores)
        return 50

    @staticmethod
    def _score_weight(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on weight preference"""
        if not paddle.weight:
            return 50

        weight_ranges = {
            'light': {'min': 7.0, 'max': 7.8, 'ideal': 7.4},
            'medium': {'min': 7.8, 'max': 8.2, 'ideal': 8.0},
            'heavy': {'min': 8.2, 'max': 9.0, 'ideal': 8.5}
        }

        range_info = weight_ranges[preferences.weight_tolerance]

        if range_info['min'] <= paddle.weight <= range_info['max']:
            distance = abs(paddle.weight - range_info['ideal'])
            max_distance = (range_info['max'] - range_info['min']) / 2
            return 100 - (distance / max_distance * 50)

        # Outside preferred range
        distance = (range_info['min'] - paddle.weight if paddle.weight < range_info['min']
                   else paddle.weight - range_info['max'])
        return max(0, 50 - distance * 25)

    @staticmethod
    def _score_swing_weight(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on swing weight preference"""
        if not paddle.swing_weight:
            return 50

        swing_weight_map = {
            'light': {'min': 100, 'max': 110},
            'medium': {'min': 110, 'max': 120},
            'heavy': {'min': 120, 'max': 130}
        }

        range_info = swing_weight_map[preferences.weight_tolerance]

        if range_info['min'] <= paddle.swing_weight <= range_info['max']:
            return 100

        distance = (range_info['min'] - paddle.swing_weight if paddle.swing_weight < range_info['min']
                   else paddle.swing_weight - range_info['max'])
        return max(0, 100 - distance * 5)

    @staticmethod
    def _score_twist_weight(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on twist weight for stability"""
        if not paddle.twist_weight:
            return 50

        score = 50  # Base score

        # For soft game and reset players, higher twist weight is better
        if (PlayStyle.RESET_FIRST in preferences.playing_styles or
            PlayStyle.SOFT_GAME in preferences.playing_styles or
            preferences.primary_goal in ['control', 'consistency']):

            if paddle.twist_weight >= 7.0:
                score = 100  # Excellent stability for soft shots
            elif paddle.twist_weight >= 6.5:
                score = 85  # Good stability for dinks and drops
            elif paddle.twist_weight >= 6.0:
                score = 70
            else:
                score = 40  # Poor stability for soft game

        # For hand speed players, moderate twist weight
        elif PlayStyle.HAND_SPEED in preferences.playing_styles:
            if 6.0 <= paddle.twist_weight <= 6.8:
                score = 90  # Sweet spot
            elif paddle.twist_weight < 6.0:
                score = 70  # Very quick but less stable
            else:
                score = 60  # Stable but might feel sluggish

        # For power players
        elif (PlayStyle.DRIVING_BANGER in preferences.playing_styles or
              PlayStyle.AGGRESSIVE_FINISHING in preferences.playing_styles or
              preferences.primary_goal == 'power'):

            if paddle.twist_weight >= 6.3:
                score = 80
            else:
                score = 60

        # For singles players
        elif PlayStyle.SINGLES_SPECIALIST in preferences.playing_styles:
            if paddle.twist_weight >= 6.8:
                score = 95  # Excellent for wide reach
            elif paddle.twist_weight >= 6.3:
                score = 75
            else:
                score = 50

        # Use percentile if available
        if paddle.twist_weight_percentile:
            percentile = PaddleScoring._parse_percentile(paddle.twist_weight_percentile)
            score = (score * 0.7) + (percentile * 0.3)

        return min(score, 100)

    @staticmethod
    def _score_budget(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on budget fit"""
        if not paddle.price:
            return 50

        try:
            price = float(paddle.price)
        except:
            return 50

        if preferences.budget_min <= price <= preferences.budget_max:
            # Prefer middle of budget range
            midpoint = (preferences.budget_min + preferences.budget_max) / 2
            range_size = preferences.budget_max - preferences.budget_min
            distance = abs(price - midpoint)
            return 100 - (distance / range_size * 40)

        return 0  # Outside budget

    @staticmethod
    def _score_spin(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on spin requirements"""
        if (PainPoint.NOT_ENOUGH_SPIN in preferences.pain_points or
            preferences.primary_goal == 'spin'):

            if paddle.spin_rpm:
                return min((paddle.spin_rpm / 2000) * 100, 100)

            if paddle.spin_percentile:
                return PaddleScoring._parse_percentile(paddle.spin_percentile)

        return 70  # Neutral score

    @staticmethod
    def _score_build_quality(paddle: Any, preferences: UserPreferences) -> float:
        """Score based on build quality and materials"""
        score = 70  # Base score

        # Arm sensitivity considerations
        if preferences.arm_sensitivity:
            if paddle.core_thickness and paddle.core_thickness >= 16:
                score += 20  # Thicker cores are arm-friendly
            if paddle.core_material and ('soft' in paddle.core_material.lower() or
                                         'polymer' in paddle.core_material.lower()):
                score += 10

        # Premium materials
        if paddle.face_material and ('carbon' in paddle.face_material.lower() or
                                     'kevlar' in paddle.face_material.lower()):
            score += 10

        # Build type
        if paddle.build_type and 'thermoform' in paddle.build_type.lower():
            score += 10

        return min(score, 100)

    @staticmethod
    def _parse_percentile(percentile_str: str) -> float:
        """Extract numeric value from percentile string"""
        if not percentile_str:
            return 50

        match = re.search(r'(\d+)', str(percentile_str))
        if match:
            return float(match.group(1))
        return 50

    @staticmethod
    def generate_match_reasons(paddle: Any, preferences: UserPreferences) -> List[str]:
        """Generate human-readable reasons for the match"""
        reasons = []

        # Goal-based reasons
        if preferences.primary_goal == "consistency" and paddle.control_rating and paddle.control_rating >= 8:
            reasons.append(f"Excellent control rating ({paddle.control_rating}/10) for consistent play")

        if preferences.primary_goal == "power" and paddle.power_percentile:
            reasons.append(f"High power output ({paddle.power_percentile}) for aggressive shots")

        if preferences.primary_goal == "spin" and paddle.spin_rpm and paddle.spin_rpm > 1500:
            reasons.append(f"Superior spin generation ({paddle.spin_rpm} RPM)")

        # Weight match
        if paddle.weight:
            weight_ranges = {
                'light': '7.0-7.8 oz',
                'medium': '7.8-8.2 oz',
                'heavy': '8.2+ oz'
            }
            reasons.append(f"Weight ({paddle.weight} oz) matches your {preferences.weight_tolerance} preference")

        # Arm sensitivity
        if preferences.arm_sensitivity and paddle.core_thickness and paddle.core_thickness >= 16:
            reasons.append(f"{paddle.core_thickness}mm core provides arm-friendly cushioning")

        # Play style specific
        if PlayStyle.HAND_SPEED in preferences.playing_styles and paddle.swing_weight and paddle.swing_weight < 110:
            reasons.append("Low swing weight for quick hand speed at the net")

        if PlayStyle.SOFT_GAME in preferences.playing_styles:
            if paddle.control_rating and paddle.feel_rating:
                reasons.append(f"Superior control ({paddle.control_rating}/10) and feel ({paddle.feel_rating}/10) for precise soft game placement")
            if paddle.swing_weight and 105 <= paddle.swing_weight <= 113:
                reasons.append(f"Optimal swing weight ({paddle.swing_weight}) for soft feet movement and control")

        if PlayStyle.RESET_FIRST in preferences.playing_styles and paddle.twist_weight and paddle.twist_weight >= 6.5:
            reasons.append(f"High twist weight ({paddle.twist_weight}) provides stability for consistent resets")

        return reasons if reasons else ["Balanced paddle matching your preferences"]
