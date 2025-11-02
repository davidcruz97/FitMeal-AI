# app/ai/nutrition_calculator.py
"""
Nutrition Calculator Utilities
Advanced calculations for coaches/nutritionists to create optimal plans
"""
import logging
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class NutritionCalculator:
    """Advanced nutrition calculations for coaching"""
    
    # Activity multipliers for TDEE
    ACTIVITY_MULTIPLIERS = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extremely_active': 1.9
    }
    
    # Protein recommendations by goal (g per kg bodyweight)
    PROTEIN_BY_GOAL = {
        'weight_loss': 2.0,
        'shred_fat': 2.0,
        'maintain_muscle': 1.8,
        'toned_body': 1.8,
        'build_muscle': 2.2,
        'lean_gains': 2.2,
        'balance': 1.6,
        'improve_fitness': 1.6,
        'improve_mental_health': 1.6,
        'core_strength': 1.6,
        'optimize_workouts': 1.8,
        'hormones_regulation': 1.6
    }
    
    def __init__(self):
        logger.info("✓ Nutrition Calculator initialized")
    
    # ============================================
    # BMR Calculations
    # ============================================
    
    def calculate_bmr_mifflin(self, weight_kg: float, height_cm: float, 
                               age: int, gender: str) -> int:
        """
        Mifflin-St Jeor Equation (Most accurate for general population)
        
        Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
        Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
        """
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
        
        if gender == 'male':
            bmr += 5
        else:  # female
            bmr -= 161
        
        return int(bmr)
    
    def calculate_bmr_harris_benedict(self, weight_kg: float, height_cm: float,
                                      age: int, gender: str) -> int:
        """
        Harris-Benedict Equation (Revised)
        
        Men: BMR = 88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)
        Women: BMR = 447.593 + (9.247 × weight) + (3.098 × height) - (4.330 × age)
        """
        if gender == 'male':
            bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
        else:
            bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)
        
        return int(bmr)
    
    def calculate_bmr_katch_mcardle(self, lean_body_mass_kg: float) -> int:
        """
        Katch-McArdle Formula (Most accurate when body fat % is known)
        
        BMR = 370 + (21.6 × lean body mass in kg)
        
        Requires body fat percentage to calculate lean body mass:
        LBM = weight × (1 - body_fat_percentage)
        """
        bmr = 370 + (21.6 * lean_body_mass_kg)
        return int(bmr)
    
    # ============================================
    # TDEE Calculations
    # ============================================
    
    def calculate_tdee(self, bmr: int, activity_level: str) -> int:
        """
        Calculate Total Daily Energy Expenditure
        TDEE = BMR × Activity Multiplier
        """
        multiplier = self.ACTIVITY_MULTIPLIERS.get(activity_level, 1.2)
        tdee = bmr * multiplier
        return int(tdee)
    
    def calculate_tdee_with_neat(self, bmr: int, activity_level: str, 
                                  neat_calories: int = 0) -> int:
        """
        Calculate TDEE with NEAT (Non-Exercise Activity Thermogenesis)
        
        NEAT = calories from daily activities (walking, fidgeting, etc.)
        Average NEAT: 200-800 kcal/day
        """
        base_tdee = self.calculate_tdee(bmr, activity_level)
        return base_tdee + neat_calories
    
    # ============================================
    # Calorie Goals
    # ============================================
    
    def calculate_calorie_goal(self, tdee: int, goal_type: str, 
                               weekly_goal_kg: float = 0.5) -> int:
        """
        Calculate daily calorie target based on goals
        
        Args:
            tdee: Total Daily Energy Expenditure
            goal_type: 'lose', 'maintain', 'gain'
            weekly_goal_kg: Target kg change per week
        
        Returns:
            Daily calorie target
        """
        if goal_type == 'maintain':
            return tdee
        
        # 1 kg fat = ~7700 kcal
        # Daily adjustment = (weekly_goal × 7700) / 7
        daily_adjustment = int((weekly_goal_kg * 7700) / 7)
        
        if goal_type == 'lose':
            return tdee - daily_adjustment
        else:  # gain
            return tdee + daily_adjustment
    
    def calculate_calorie_goal_by_percentage(self, tdee: int, 
                                             percentage: float) -> int:
        """
        Calculate calorie goal by percentage adjustment
        
        Example:
        - Weight loss: -20% (0.80)
        - Maintenance: 0% (1.0)
        - Weight gain: +15% (1.15)
        """
        return int(tdee * percentage)
    
    # ============================================
    # Macro Calculations
    # ============================================
    
    def calculate_macros_by_goal(self, calories: int, weight_kg: float,
                                  primary_goals: List[str]) -> Dict[str, int]:
        """
        Calculate optimal macro distribution based on goals
        
        Returns:
            Dict with protein, carbs, fats in grams
        """
        # Determine protein needs
        protein_per_kg = self._get_protein_requirement(primary_goals)
        protein_grams = int(weight_kg * protein_per_kg)
        
        # Determine fat percentage (for hormonal health)
        if any(goal in primary_goals for goal in ['hormones_regulation', 'improve_mental_health']):
            fat_percentage = 0.35  # 35% for hormonal health
        else:
            fat_percentage = 0.30  # Standard 30%
        
        fat_calories = calories * fat_percentage
        fat_grams = int(fat_calories / 9)
        
        # Remaining calories go to carbs
        protein_calories = protein_grams * 4
        remaining_calories = calories - protein_calories - fat_calories
        carb_grams = int(remaining_calories / 4)
        
        return {
            'protein': protein_grams,
            'carbs': carb_grams,
            'fats': fat_grams,
            'calories': calories
        }
    
    def calculate_macros_custom(self, calories: int, 
                                protein_percentage: float,
                                fat_percentage: float,
                                carb_percentage: float) -> Dict[str, int]:
        """
        Calculate macros with custom percentages
        
        Args:
            calories: Total daily calories
            protein_percentage: 0.0 to 1.0 (e.g., 0.30 for 30%)
            fat_percentage: 0.0 to 1.0
            carb_percentage: 0.0 to 1.0
        
        Note: Percentages should sum to 1.0
        """
        protein_grams = int((calories * protein_percentage) / 4)
        fat_grams = int((calories * fat_percentage) / 9)
        carb_grams = int((calories * carb_percentage) / 4)
        
        return {
            'protein': protein_grams,
            'carbs': carb_grams,
            'fats': fat_grams,
            'calories': calories
        }
    
    def calculate_macros_bodybuilding(self, weight_kg: float, 
                                       phase: str) -> Tuple[int, int, int]:
        """
        Calculate macros for bodybuilding phases
        
        Args:
            weight_kg: Body weight in kg
            phase: 'bulk', 'cut', 'maintenance'
        
        Returns:
            Tuple of (protein_g, carbs_g, fats_g)
        """
        if phase == 'bulk':
            protein = int(weight_kg * 2.2)
            fats = int(weight_kg * 1.0)
            carbs = int(weight_kg * 6.0)
        elif phase == 'cut':
            protein = int(weight_kg * 2.5)
            fats = int(weight_kg * 0.8)
            carbs = int(weight_kg * 2.5)
        else:  # maintenance
            protein = int(weight_kg * 2.0)
            fats = int(weight_kg * 0.9)
            carbs = int(weight_kg * 4.0)
        
        return (protein, carbs, fats)
    
    # ============================================
    # Water & Fiber
    # ============================================
    
    def calculate_water_intake(self, weight_kg: float, activity_level: str,
                               workout_days_per_week: int = 0) -> int:
        """
        Calculate daily water intake target
        
        Base: 35ml per kg bodyweight
        + 500ml per workout day
        + 250ml if very/extremely active
        
        Returns:
            Water intake in ml
        """
        # Base water
        base_water = int(weight_kg * 35)
        
        # Workout bonus (averaged per day)
        workout_bonus = int((workout_days_per_week / 7) * 500)
        
        # Activity bonus
        activity_bonus = 0
        if activity_level in ['very_active', 'extremely_active']:
            activity_bonus = 250
        
        total_water = base_water + workout_bonus + activity_bonus
        
        return total_water
    
    def calculate_fiber_intake(self, calories: int) -> int:
        """
        Calculate daily fiber target
        
        General recommendation: 14g per 1000 kcal
        
        Returns:
            Fiber in grams
        """
        fiber = int((calories / 1000) * 14)
        return max(fiber, 25)  # Minimum 25g
    
    # ============================================
    # Body Composition
    # ============================================
    
    def calculate_lean_body_mass(self, weight_kg: float, 
                                 body_fat_percentage: float) -> float:
        """
        Calculate lean body mass (muscle, bones, organs)
        
        LBM = weight × (1 - body_fat_percentage)
        """
        return weight_kg * (1 - body_fat_percentage)
    
    def calculate_ideal_weight(self, height_cm: float, gender: str,
                              frame: str = 'medium') -> Tuple[float, float]:
        """
        Calculate ideal weight range using Devine Formula
        
        Men: 50 kg + 2.3 kg per inch over 5 feet
        Women: 45.5 kg + 2.3 kg per inch over 5 feet
        
        Returns:
            Tuple of (min_weight, max_weight) based on frame
        """
        inches_over_5_feet = ((height_cm / 2.54) - 60)
        
        if gender == 'male':
            ideal_weight = 50 + (2.3 * inches_over_5_feet)
        else:
            ideal_weight = 45.5 + (2.3 * inches_over_5_feet)
        
        # Adjust for frame size
        if frame == 'small':
            return (ideal_weight * 0.9, ideal_weight * 0.95)
        elif frame == 'large':
            return (ideal_weight * 1.05, ideal_weight * 1.1)
        else:  # medium
            return (ideal_weight * 0.95, ideal_weight * 1.05)
    
    def calculate_bmi(self, weight_kg: float, height_cm: float) -> float:
        """
        Calculate Body Mass Index
        
        BMI = weight (kg) / (height (m))²
        """
        height_m = height_cm / 100
        bmi = weight_kg / (height_m ** 2)
        return round(bmi, 1)
    
    def get_bmi_category(self, bmi: float) -> str:
        """Get BMI category"""
        if bmi < 18.5:
            return 'Underweight'
        elif bmi < 25:
            return 'Normal weight'
        elif bmi < 30:
            return 'Overweight'
        else:
            return 'Obese'
    
    # ============================================
    # Progress Tracking
    # ============================================
    
    def calculate_weight_loss_timeline(self, current_weight: float,
                                       goal_weight: float,
                                       weekly_loss: float = 0.5) -> Dict:
        """
        Calculate realistic weight loss timeline
        
        Returns:
            Dict with weeks, months, and target date info
        """
        total_loss = current_weight - goal_weight
        weeks = int(total_loss / weekly_loss)
        months = round(weeks / 4.33, 1)
        
        return {
            'total_loss_kg': round(total_loss, 1),
            'weeks': weeks,
            'months': months,
            'recommended_weekly_loss': weekly_loss,
            'is_realistic': 0.2 <= weekly_loss <= 1.0
        }
    
    def calculate_calorie_deficit_from_loss(self, kg_lost: float,
                                           days: int) -> int:
        """
        Calculate actual calorie deficit from weight loss
        
        1 kg fat = 7700 kcal
        """
        total_deficit = kg_lost * 7700
        daily_deficit = int(total_deficit / days)
        return daily_deficit
    
    # ============================================
    # Helper Methods
    # ============================================
    
    def _get_protein_requirement(self, goals: List[str]) -> float:
        """Determine protein requirement from goals"""
        if not goals:
            return 1.6
        
        # Get highest protein requirement from goals
        protein_values = [
            self.PROTEIN_BY_GOAL.get(goal, 1.6) 
            for goal in goals
        ]
        return max(protein_values)
    
    def validate_macros(self, protein: int, carbs: int, fats: int) -> Dict:
        """
        Validate macro distribution
        
        Returns:
            Dict with total calories and percentage breakdown
        """
        total_calories = (protein * 4) + (carbs * 4) + (fats * 9)
        
        protein_pct = round((protein * 4 / total_calories) * 100, 1)
        carbs_pct = round((carbs * 4 / total_calories) * 100, 1)
        fats_pct = round((fats * 9 / total_calories) * 100, 1)
        
        return {
            'total_calories': total_calories,
            'protein_percentage': protein_pct,
            'carbs_percentage': carbs_pct,
            'fats_percentage': fats_pct,
            'valid': 95 <= (protein_pct + carbs_pct + fats_pct) <= 105
        }


# Singleton instance
_nutrition_calculator = None

def get_nutrition_calculator():
    """Get or create nutrition calculator instance"""
    global _nutrition_calculator
    if _nutrition_calculator is None:
        _nutrition_calculator = NutritionCalculator()
    return _nutrition_calculator