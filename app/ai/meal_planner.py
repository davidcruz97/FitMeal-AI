# app/ai/meal_planner.py
"""
AI-Powered Weekly Meal Planner
Helps coaches/nutritionists create comprehensive weekly meal plans
"""
from app.ai.llm_manager import get_llm_manager
from app.ai.safety import get_nutrition_safety
from app.models.ingredient import Ingredient
from app import db
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class MealPlanner:
    """AI-powered weekly meal planning for coaches"""
    
    def __init__(self):
        """Initialize with shared LLM manager"""
        self.llm_manager = get_llm_manager()
        self.safety = get_nutrition_safety()
        logger.info("✓ Meal Planner initialized")
    
    def generate_weekly_plan(self, user_profile: Dict, 
                             plan_preferences: Optional[Dict] = None) -> str:
        """
        Generate complete 7-day meal plan
        
        Args:
            user_profile: Dict with user's nutrition data
            plan_preferences: Optional preferences (meal_count, cuisine_types, etc.)
        
        Returns:
            Formatted weekly meal plan as string
        """
        try:
            # Build context
            context, allergen_names, medical_conditions = self._build_plan_context(
                user_profile, plan_preferences
            )
            
            # Build safety instructions
            safety_instructions = self.safety.build_prompt_safety_instructions(
                allergen_names, medical_conditions
            )
            
            prompt = f"""You are a professional nutritionist creating a weekly meal plan.

{context}{safety_instructions}

Create a detailed 7-day meal plan (Monday to Sunday) with:

For each day:
- Breakfast
- Lunch  
- Dinner
- 2 Snacks (optional)

For each meal, provide:
1. Meal name
2. Ingredients with quantities
3. Approximate macros (calories, protein, carbs, fats)
4. Brief preparation notes (2-3 sentences)

Ensure:
- Variety throughout the week (no repeating meals)
- Balanced nutrition meeting daily targets
- Practical, easy-to-prepare meals
- Shopping list efficiency

Format clearly with day headers and meal sections."""
            
            logger.info(f"🗓️ Generating weekly meal plan")
            logger.debug(f"📝 User goals: {user_profile.get('fitness_goals', 'N/A')}")
            logger.debug(f"📝 Target calories: {user_profile.get('target_calories', 'N/A')}")
            logger.debug(f"📝 Allergies: {allergen_names}")
            
            # Get LLM with creative temperature
            llm = self.llm_manager.get_llm(temperature=0.7)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Weekly meal plan generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to generate weekly plan: {e}", exc_info=True)
            return "Unable to generate meal plan at this time."
    
    def generate_meal_prep_plan(self, user_profile: Dict, 
                               prep_days: List[str] = None) -> str:
        """
        Generate meal prep strategy for batch cooking
        
        Args:
            user_profile: User nutrition data
            prep_days: Days available for prep (e.g., ['Sunday', 'Wednesday'])
        
        Returns:
            Meal prep plan as string
        """
        try:
            context, allergen_names, medical_conditions = self._build_plan_context(user_profile)
            
            # Build safety instructions
            safety_instructions = self.safety.build_prompt_safety_instructions(
                allergen_names, medical_conditions
            )
            
            prep_days_text = ', '.join(prep_days) if prep_days else 'Sunday'
            
            prompt = f"""You are a meal prep expert. Create a weekly meal prep strategy.

{context}{safety_instructions}

Meal prep days: {prep_days_text}

Create a plan with:

1. **Prep Day Schedule**
   - What to cook on each prep day
   - Estimated prep time
   - Batch cooking quantities

2. **Weekly Menu**
   - Monday through Sunday
   - All meals using prepped ingredients
   - Assembly instructions

3. **Shopping List**
   - Organized by category
   - Exact quantities needed
   - Storage instructions

4. **Storage Tips**
   - How to store each component
   - Shelf life
   - Reheating instructions

Focus on:
- Time efficiency
- Food safety
- Nutrition goals
- Minimal waste"""
            
            logger.info(f"🍱 Generating meal prep plan (prep_days={prep_days_text}, allergies={allergen_names})")
            
            # Get LLM with creative temperature
            llm = self.llm_manager.get_llm(temperature=0.7)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Meal prep plan generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to generate meal prep plan: {e}", exc_info=True)
            return "Unable to generate meal prep plan at this time."
    
    def generate_shopping_list(self, weekly_meals: str) -> str:
        """
        Generate shopping list from weekly meal plan
        
        Args:
            weekly_meals: Weekly meal plan text
        
        Returns:
            Organized shopping list as string
        """
        try:
            prompt = f"""Based on this weekly meal plan, create a comprehensive shopping list:

{weekly_meals}

Organize the shopping list by category:
1. **Proteins** (meats, fish, eggs, etc.)
2. **Produce** (fruits and vegetables)
3. **Grains & Carbs** (rice, pasta, bread, etc.)
4. **Dairy** (milk, yogurt, cheese, etc.)
5. **Pantry Staples** (oils, spices, sauces, etc.)
6. **Snacks & Extras**

For each item:
- List quantity needed for the whole week
- Note if item can be bought in bulk
- Suggest alternatives if applicable

Keep it practical and organized for efficient shopping."""
            
            logger.info(f"🛒 Generating shopping list from meal plan ({len(weekly_meals)} chars)")
            
            # Get LLM with factual temperature
            llm = self.llm_manager.get_llm(temperature=0.5)
            response = llm.invoke(prompt)
            
            # Add general disclaimer
            response_with_disclaimer = response + self.safety.get_disclaimer()
            
            logger.info(f"✅ Shopping list generated ({len(response_with_disclaimer)} chars)")
            return response_with_disclaimer
            
        except Exception as e:
            logger.error(f"❌ Failed to generate shopping list: {e}", exc_info=True)
            return "Unable to generate shopping list at this time."
    
    def generate_day_meal_plan(self, user_profile: Dict, 
                               day_type: str = 'workout') -> str:
        """
        Generate single-day meal plan
        
        Args:
            user_profile: User nutrition data
            day_type: 'workout' or 'rest'
        
        Returns:
            Single day meal plan as string
        """
        try:
            context, allergen_names, medical_conditions = self._build_plan_context(user_profile)
            
            # Build safety instructions
            safety_instructions = self.safety.build_prompt_safety_instructions(
                allergen_names, medical_conditions
            )
            
            if day_type == 'workout':
                day_context = """This is a WORKOUT day. Focus on:
- Pre-workout fuel (carbs + moderate protein)
- Post-workout recovery (protein + carbs)
- Slightly higher carb intake
- Adequate hydration"""
            else:
                day_context = """This is a REST day. Focus on:
- Muscle recovery (adequate protein)
- Slightly lower carb intake
- Emphasis on micronutrients
- Anti-inflammatory foods"""
            
            prompt = f"""Create a detailed meal plan for today.

{context}

{day_context}{safety_instructions}

Provide:
- **Breakfast** (with time suggestion)
- **Morning Snack** (optional)
- **Lunch**
- **Afternoon Snack** (optional)
- **Dinner**
- **Evening Snack** (if calories allow)

For each meal:
1. Meal name and description
2. Ingredients with portions
3. Macros (calories, protein, carbs, fats)
4. Timing recommendation
5. Why this meal fits the day

Make it practical and delicious."""
            
            logger.info(f"📅 Generating {day_type} day meal plan (allergies={allergen_names})")
            
            # Get LLM with creative temperature
            llm = self.llm_manager.get_llm(temperature=0.7)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Day meal plan generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to generate day plan: {e}", exc_info=True)
            return "Unable to generate day meal plan at this time."
    
    def adjust_plan_for_preferences(self, meal_plan: str, 
                                    adjustments: Dict) -> str:
        """
        Modify existing meal plan based on preferences or restrictions
        
        Args:
            meal_plan: Existing meal plan text
            adjustments: Dict with preferences
                {
                    'remove_ingredients': ['chicken', 'dairy'],
                    'add_preferences': ['more vegetables', 'spicy food'],
                    'budget': 'low' / 'medium' / 'high',
                    'cooking_time': 'quick' / 'moderate' / 'any'
                }
        
        Returns:
            Adjusted meal plan as string
        """
        try:
            # Build adjustments text
            adjustments_text = []
            
            if 'remove_ingredients' in adjustments:
                items = ', '.join(adjustments['remove_ingredients'])
                adjustments_text.append(f"- Remove or replace: {items}")
            
            if 'add_preferences' in adjustments:
                prefs = ', '.join(adjustments['add_preferences'])
                adjustments_text.append(f"- Add preferences: {prefs}")
            
            if 'budget' in adjustments:
                adjustments_text.append(f"- Budget constraint: {adjustments['budget']}")
            
            if 'cooking_time' in adjustments:
                adjustments_text.append(f"- Cooking time: {adjustments['cooking_time']}")
            
            adjustments_str = '\n'.join(adjustments_text)
            
            prompt = f"""Modify this meal plan according to the following adjustments:

Original Plan:
{meal_plan}

Adjustments needed:
{adjustments_str}

Provide the complete revised meal plan maintaining:
- Same nutritional targets
- Same structure and format
- Practical substitutions
- Clear explanations of changes made

List major changes at the end."""
            
            logger.info(f"🔧 Adjusting meal plan ({len(adjustments)} adjustments)")
            logger.debug(f"📝 Adjustments: {adjustments}")
            
            # Get LLM with creative temperature
            llm = self.llm_manager.get_llm(temperature=0.7)
            response = llm.invoke(prompt)
            
            # Add general disclaimer
            response_with_disclaimer = response + self.safety.get_disclaimer()
            
            logger.info(f"✅ Meal plan adjusted ({len(response_with_disclaimer)} chars)")
            return response_with_disclaimer
            
        except Exception as e:
            logger.error(f"❌ Failed to adjust meal plan: {e}", exc_info=True)
            return "Unable to adjust meal plan at this time."
    
    def generate_competition_prep_plan(self, user_profile: Dict, 
                                       weeks_out: int) -> str:
        """
        Generate meal plan for bodybuilding/physique competition prep
        
        Args:
            user_profile: User data
            weeks_out: Weeks until competition
        
        Returns:
            Competition prep meal plan as string
        """
        try:
            context, allergen_names, medical_conditions = self._build_plan_context(user_profile)
            
            # Build safety instructions
            safety_instructions = self.safety.build_prompt_safety_instructions(
                allergen_names, medical_conditions
            )
            
            # Adjust strategy based on weeks out
            if weeks_out > 12:
                phase = "Early prep - gradual calorie reduction"
            elif weeks_out > 6:
                phase = "Mid prep - consistent deficit, high protein"
            elif weeks_out > 2:
                phase = "Peak week approach - carb cycling, water manipulation"
            else:
                phase = "Peak week - strategic carb loading, sodium/water manipulation"
            
            prompt = f"""Create a competition prep meal plan for a physique athlete.

{context}{safety_instructions}

Current phase: {weeks_out} weeks out ({phase})

Create a detailed plan with:

1. **Daily Meal Structure**
   - 5-6 meals spread throughout day
   - Precise macro targets per meal
   - Timing around training

2. **Weekly Strategy**
   - 7-day breakdown
   - Refeed days (if applicable)
   - Carb cycling approach
   - Sodium/water guidelines

3. **Food Selections**
   - Contest-prep friendly foods
   - Easy to digest proteins
   - Strategic carb sources
   - Essential fats

4. **Prep Tips**
   - Meal timing
   - Supplement recommendations
   - Digestion optimization
   - Energy management

Focus on sustainability, performance, and stage-ready conditioning."""
            
            logger.info(f"🏆 Generating competition prep plan ({weeks_out} weeks out, allergies={allergen_names})")
            
            # Get LLM with balanced temperature
            llm = self.llm_manager.get_llm(temperature=0.6)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Competition prep plan generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to generate competition prep plan: {e}", exc_info=True)
            return "Unable to generate competition prep plan at this time."
    
    def _build_plan_context(self, user_profile: Dict, 
                           preferences: Optional[Dict] = None):
        """
        Build context string for meal planning
        
        Returns:
            Tuple[str, List[str], List[str]]: (context_string, allergen_names, medical_conditions)
        """
        context_parts = []
        allergen_names = []
        medical_conditions = user_profile.get('medical_conditions', [])
        
        # User info
        if user_profile.get('age') and user_profile.get('gender'):
            context_parts.append(
                f"Person: {user_profile['age']}-year-old {user_profile['gender']}"
            )
        
        # Physical stats
        if user_profile.get('height') and user_profile.get('weight'):
            height = user_profile['height']
            weight = user_profile['weight']
            bmi = round(weight / ((height/100) ** 2), 1)
            context_parts.append(f"Physical: {height}cm, {weight}kg (BMI: {bmi})")
        
        # Goals
        if user_profile.get('fitness_goals'):
            goals = ', '.join([g.replace('_', ' ').title() for g in user_profile['fitness_goals']])
            context_parts.append(f"Goals: {goals}")
        
        # Nutrition targets
        if user_profile.get('target_calories'):
            context_parts.append(
                f"Daily targets: {user_profile['target_calories']} kcal, "
                f"{user_profile.get('target_protein', 0)}g protein, "
                f"{user_profile.get('target_carbs', 0)}g carbs, "
                f"{user_profile.get('target_fats', 0)}g fats"
            )
        
        # Activity
        if user_profile.get('activity_level'):
            activity = user_profile['activity_level'].replace('_', ' ').title()
            context_parts.append(f"Activity level: {activity}")
        
        # Training
        if user_profile.get('workout_days'):
            workout_days = ', '.join(user_profile['workout_days'])
            context_parts.append(f"Workout days: {workout_days}")
        
        # CRITICAL: Food allergies - resolve IDs to names
        if user_profile.get('food_allergies') and len(user_profile['food_allergies']) > 0:
            try:
                allergen_ids = user_profile['food_allergies']
                allergens = Ingredient.query.filter(Ingredient.id.in_(allergen_ids)).all()
                allergen_names = [ing.name for ing in allergens]
                
                if allergen_names:
                    allergen_list = ", ".join(allergen_names).upper()
                    context_parts.append(
                        f"🚨 CRITICAL ALLERGIES: MUST AVOID {allergen_list}"
                    )
                    logger.warning(f"⚠️ User has allergies: {allergen_names}")
            except Exception as e:
                logger.error(f"❌ Failed to resolve allergen IDs: {e}", exc_info=True)
        
        # Medical conditions
        if medical_conditions and len(medical_conditions) > 0:
            conditions = ', '.join([c.replace('_', ' ').title() for c in medical_conditions])
            context_parts.append(f"⚠️ Medical considerations: {conditions}")
            logger.info(f"⚠️ User has medical conditions: {medical_conditions}")
        
        # Preferences from plan_preferences
        if preferences:
            if preferences.get('meal_count'):
                context_parts.append(f"Meals per day: {preferences['meal_count']}")
            
            if preferences.get('cuisine_types'):
                cuisines = ', '.join(preferences['cuisine_types'])
                context_parts.append(f"Preferred cuisines: {cuisines}")
            
            if preferences.get('cooking_skill'):
                context_parts.append(f"Cooking skill: {preferences['cooking_skill']}")
            
            if preferences.get('budget'):
                context_parts.append(f"Budget: {preferences['budget']}")
        
        context_string = '\n'.join(context_parts)
        logger.debug(f"📋 Built plan context: {len(context_parts)} items, allergies={len(allergen_names)}")
        
        return context_string, allergen_names, medical_conditions
    
    def _add_safety_disclaimers(self, response, allergen_names, medical_conditions):
        """Add appropriate safety disclaimers to response"""
        disclaimers = []
        
        # Add allergy warning if applicable
        if allergen_names:
            disclaimers.append(self.safety.get_allergy_warning(allergen_names))
        
        # Add medical warnings if applicable
        if medical_conditions:
            disclaimers.append(self.safety.get_medical_warnings(medical_conditions))
        
        # Always add general disclaimer
        disclaimers.append(self.safety.get_disclaimer())
        
        return response + "".join(disclaimers)


# Singleton instance
_meal_planner = None

def get_meal_planner():
    """Get or create meal planner instance"""
    global _meal_planner
    if _meal_planner is None:
        logger.debug("🚀 Creating Meal Planner singleton")
        _meal_planner = MealPlanner()
    return _meal_planner