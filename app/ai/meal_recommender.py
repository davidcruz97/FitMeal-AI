# app/ai/meal_recommender.py
"""
AI-Powered Meal Recommender
Uses local LLM to suggest recipes based on user profile and available ingredients
"""
from app.ai.llm_manager import get_llm_manager
from app.ai.safety import get_nutrition_safety
from app.models.ingredient import Ingredient
from app import db
import logging

logger = logging.getLogger(__name__)


class MealRecommender:
    """AI-powered meal recommendation system"""
    
    def __init__(self):
        """Initialize with shared LLM manager"""
        self.llm_manager = get_llm_manager()
        self.safety = get_nutrition_safety()
        logger.info("✓ Meal Recommender initialized")
    
    def recommend_recipes(self, user_profile, available_ingredients=None, meal_type=None):
        """
        Recommend recipes based on user profile
        
        Args:
            user_profile: User object with nutrition targets and preferences
            available_ingredients: List of ingredient names (optional)
            meal_type: 'breakfast', 'lunch', 'dinner', 'snack' (optional)
        
        Returns:
            String with recipe recommendations
        """
        try:
            # Build context from user profile
            context, allergen_names, medical_conditions = self._build_user_context(user_profile)
            
            # Build safety instructions for the prompt
            safety_instructions = self.safety.build_prompt_safety_instructions(
                allergen_names, medical_conditions
            )
            
            # Build ingredients context
            ingredients_text = ""
            if available_ingredients and len(available_ingredients) > 0:
                ingredients_text = f"\nAvailable ingredients: {', '.join(available_ingredients)}"
            
            # Build meal type context
            meal_text = f" for {meal_type}" if meal_type else ""
            
            prompt = f"""You are a professional nutritionist. Recommend 3 healthy meal options{meal_text} for this person:

{context}{ingredients_text}{safety_instructions}

For each meal, provide:
1. Meal name
2. Brief description (1 sentence)
3. Approximate macros (calories, protein, carbs, fats)
4. Why it's good for their goals

Keep it practical, realistic, and aligned with their targets."""
            
            logger.info(f"🍽️ Generating meal recommendations (meal_type={meal_type}, ingredients={len(available_ingredients) if available_ingredients else 0})")
            logger.debug(f"📝 Prompt length: {len(prompt)} chars, Allergies: {allergen_names}")
            
            # Get LLM with creative temperature
            llm = self.llm_manager.get_llm(temperature=0.7)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers to response
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Meal recommendations generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to generate recommendations: {e}", exc_info=True)
            return "Unable to generate recommendations at this time. Please try again."
    
    def suggest_recipe_for_macros(self, target_calories, target_protein, target_carbs, target_fats, 
                                   meal_type=None, dietary_restrictions=None):
        """
        Suggest recipe that hits specific macro targets
        
        Args:
            target_calories: Target calories
            target_protein: Target protein (g)
            target_carbs: Target carbs (g)
            target_fats: Target fats (g)
            meal_type: Type of meal (optional)
            dietary_restrictions: List of restrictions (optional)
        
        Returns:
            Recipe suggestion as string
        """
        try:
            meal_text = f"{meal_type} " if meal_type else ""
            restrictions_text = ""
            if dietary_restrictions:
                restrictions_text = f"\nDietary restrictions: {', '.join(dietary_restrictions)}"
            
            prompt = f"""Create a {meal_text}recipe that hits these macros:
- Calories: {target_calories} kcal
- Protein: {target_protein}g
- Carbs: {target_carbs}g
- Fats: {target_fats}g{restrictions_text}

Provide:
1. Recipe name
2. Ingredients with quantities
3. Simple cooking instructions
4. Nutritional breakdown

Make it practical and easy to prepare."""
            
            logger.info(f"🎯 Generating recipe for macros: {target_calories}kcal, P{target_protein}g, C{target_carbs}g, F{target_fats}g")
            logger.debug(f"📝 Meal type: {meal_type}, Restrictions: {dietary_restrictions}")
            
            # Get LLM with creative temperature
            llm = self.llm_manager.get_llm(temperature=0.7)
            response = llm.invoke(prompt)
            
            # Add general disclaimer
            response_with_disclaimer = response + self.safety.get_disclaimer()
            
            logger.info(f"✅ Recipe generated ({len(response_with_disclaimer)} chars)")
            return response_with_disclaimer
            
        except Exception as e:
            logger.error(f"❌ Failed to generate recipe: {e}", exc_info=True)
            return "Unable to generate recipe at this time. Please try again."
    
    def modify_recipe_for_goals(self, recipe_name, recipe_ingredients, user_goals):
        """
        Suggest modifications to a recipe to better align with goals
        
        Args:
            recipe_name: Name of the recipe
            recipe_ingredients: List of ingredients
            user_goals: List of fitness goals
        
        Returns:
            Modification suggestions as string
        """
        try:
            goals_text = ", ".join(user_goals)
            ingredients_text = "\n".join([f"- {ing}" for ing in recipe_ingredients])
            
            prompt = f"""Recipe: {recipe_name}

Current ingredients:
{ingredients_text}

User goals: {goals_text}

Suggest ingredient swaps or portion adjustments to better align this recipe with their goals. Focus on:
- Increasing protein if building muscle
- Reducing calories if losing weight
- Balancing macros for their needs

Provide 3-5 practical modifications."""
            
            logger.info(f"🔧 Generating recipe modifications for '{recipe_name}' (goals: {goals_text})")
            logger.debug(f"📝 Ingredients count: {len(recipe_ingredients)}")
            
            # Get LLM with creative temperature
            llm = self.llm_manager.get_llm(temperature=0.7)
            response = llm.invoke(prompt)
            
            # Add general disclaimer
            response_with_disclaimer = response + self.safety.get_disclaimer()
            
            logger.info(f"✅ Recipe modifications generated ({len(response_with_disclaimer)} chars)")
            return response_with_disclaimer
            
        except Exception as e:
            logger.error(f"❌ Failed to generate modifications: {e}", exc_info=True)
            return "Unable to generate modifications at this time. Please try again."
    
    def _build_user_context(self, user):
        """
        Build comprehensive context string from user profile
        
        Returns:
            Tuple[str, List[str], List[str]]: (context_string, allergen_names, medical_conditions)
        """
        context_parts = []
        allergen_names = []
        medical_conditions = user.medical_conditions if user.medical_conditions else []
        
        # Personal info (friendly with first name)
        name_text = user.full_name.split()[0] if user.full_name else "Client"
        if user.age and user.gender:
            context_parts.append(f"Client: {name_text}, {user.age}-year-old {user.gender}")
        
        # Physical stats with BMI
        if user.height and user.weight:
            bmi = round(user.weight / ((user.height/100) ** 2), 1)
            context_parts.append(f"Physical: {user.height}cm, {user.weight}kg (BMI: {bmi})")
        
        # Goals (primary focus)
        if user.fitness_goals:
            goals_readable = [g.replace('_', ' ').title() for g in user.fitness_goals]
            context_parts.append(f"Goals: {', '.join(goals_readable)}")
        
        # Calculated nutrition targets
        if user.target_calories:
            context_parts.append(
                f"Daily targets: {user.target_calories}kcal "
                f"(Protein:{user.target_protein}g, Carbs:{user.target_carbs}g, Fats:{user.target_fats}g)"
            )
            
            # Add metabolism context
            if user.calculated_bmr and user.calculated_tdee:
                context_parts.append(
                    f"Metabolism: BMR={user.calculated_bmr}kcal, TDEE={user.calculated_tdee}kcal"
                )
        
        # Activity and training
        if user.activity_level:
            activity = user.activity_level.replace('_', ' ').title()
            context_parts.append(f"Activity level: {activity}")
        
        if user.lifting_experience:
            context_parts.append(f"Training experience: {user.lifting_experience.title()}")
        
        if user.workout_days:
            workout_count = len(user.workout_days) if isinstance(user.workout_days, list) else 0
            if workout_count > 0:
                context_parts.append(f"Training frequency: {workout_count} days/week")
        
        # CRITICAL: Food allergies - resolve IDs to names
        if user.food_allergies and len(user.food_allergies) > 0:
            try:
                allergen_ids = user.food_allergies
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
            conditions_readable = [c.replace('_', ' ').title() for c in medical_conditions]
            context_parts.append(
                f"⚠️ Medical considerations: {', '.join(conditions_readable)}"
            )
            logger.info(f"⚠️ User has medical conditions: {conditions_readable}")
        
        # Hydration target
        if user.target_water:
            context_parts.append(f"Hydration target: {user.target_water}ml/day")
        
        context_string = "\n".join(context_parts)
        logger.debug(f"📋 Built user context for {name_text}: {len(context_parts)} items, allergies={len(allergen_names)}")
        
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
_meal_recommender = None

def get_meal_recommender():
    """Get or create meal recommender instance"""
    global _meal_recommender
    if _meal_recommender is None:
        logger.debug("🚀 Creating Meal Recommender singleton")
        _meal_recommender = MealRecommender()
    return _meal_recommender