# app/ai/nutrition_advisor.py
"""
AI-Powered Nutrition Advisor
Answers nutrition questions with personalized context from user profile
"""
from app.ai.llm_manager import get_llm_manager
from app.ai.safety import get_nutrition_safety
from app.models.ingredient import Ingredient
from app import db
import logging

logger = logging.getLogger(__name__)


class NutritionAdvisor:
    """AI-powered nutrition Q&A and advice system"""
    
    def __init__(self):
        """Initialize with shared LLM manager"""
        self.llm_manager = get_llm_manager()
        self.safety = get_nutrition_safety()
        logger.info("✅ Nutrition Advisor initialized")
    
    def answer_question(self, question, user_profile=None):
        """
        Answer nutrition question with optional user context
        
        Args:
            question: User's nutrition question
            user_profile: User object for personalized advice (optional)
        
        Returns:
            Answer as string
        """
        try:
            # Build context
            context = ""
            allergen_names = []
            medical_conditions = []
            
            # Build context if user provided
            if user_profile:
                try:
                    context, allergen_names, medical_conditions = self._build_user_context(user_profile)
                except Exception as e:
                    logger.warning(f"⚠️ Could not build user context: {e}")
                
                # Build safety instructions for the prompt
                safety_instructions = self.safety.build_prompt_safety_instructions(
                    allergen_names, medical_conditions
                )
                context = f"\nUser context:\n{context}\n{safety_instructions}\n"
            
            prompt = f"""SYSTEM: You are Ale, an AI nutrition assistant having a casual conversation:
            
            USER INFO:
            The user's name is {user_profile.full_name.split()[0] if user_profile and user_profile.full_name else "there"}.
            {context}
            
            The user just said: "{question}"
            
            RESPONSE GUIDELINES:
            1. Respond as Ale naturally in 1-2 short paragraphs (max 100 words). 
            2. Be warm and direct. No headers, no bullet points, just friendly advice. 
            3. Answer their question directly. No role-playing, no made-up personas, just helpful nutrition advice.
            4. CRITICAL: Include inline citations for ANY specific recommendations, numbers, or health claims. 
               - Use format: "(Source: [Organization])" right after the claim
               - Examples of sources to cite:
                 * For protein recommendations: "(Source: International Society of Sports Nutrition)"
                 * For hydration guidelines: "(Source: National Academies of Sciences)"
                 * For general nutrition: "(Source: USDA Dietary Guidelines)"
                 * For sports nutrition: "(Source: American College of Sports Medicine)"
                 * For diet recommendations: "(Source: Academy of Nutrition and Dietetics)"
                 * For weight management: "(Source: WHO Nutrition Guidelines)"
               - Example response: "I'd recommend 1.6-2.2g of protein per kg of body weight (Source: International Society of Sports Nutrition). This helps with muscle recovery."
            5. EVERY numerical recommendation or health claim MUST have a source citation.
            6. If you cannot cite a reliable source, acknowledge uncertainty and recommend consulting a registered dietitian.
            7. Keep citations brief and inline - don't list sources at the end."""
            
            logger.info(f"💬 Answering nutrition question (personalized={bool(context)})")
            logger.debug(f"📝 Prompt length: {len(prompt)} chars")
            logger.debug(f"📝 Prompt: {prompt}")
            
            # Get LLM with factual temperature
            llm = self.llm_manager.get_llm(temperature=0.3)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers to response
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Answer generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to answer question: {e}", exc_info=True)
            return "I'm unable to answer that question right now. Please try again or consult with a nutritionist."
    
    def analyze_progress(self, user_profile, recent_meals_data):
        """
        Analyze user's nutrition progress and provide feedback
        
        Args:
            user_profile: User object
            recent_meals_data: Dictionary with recent nutrition stats
                {
                    'avg_calories': 2100,
                    'avg_protein': 150,
                    'avg_carbs': 200,
                    'avg_fats': 70,
                    'days_logged': 7
                }
        
        Returns:
            Analysis and recommendations as string
        """
        try:
            # Build user context
            context, allergen_names, medical_conditions = self._build_user_context(user_profile)
            
            # Build safety instructions
            safety_instructions = self.safety.build_prompt_safety_instructions(
                allergen_names, medical_conditions
            )
            
            # Build meals data
            meals_text = f"""Recent nutrition (last {recent_meals_data['days_logged']} days):
- Average calories: {recent_meals_data['avg_calories']} kcal/day
- Average protein: {recent_meals_data['avg_protein']}g/day
- Average carbs: {recent_meals_data['avg_carbs']}g/day
- Average fats: {recent_meals_data['avg_fats']}g/day"""
            
            prompt = f"""You are a professional nutritionist. Analyze this person's progress:

{context}

{meals_text}{safety_instructions}

Provide:
1. Overall assessment (are they on track for their goals?)
2. What they're doing well
3. 2-3 specific, actionable improvements with inline citations (e.g., "Increase protein to 1.6g/kg (Source: ISSN)")
4. Encouragement and motivation

CRITICAL: Include inline source citations for any specific recommendations using format: (Source: [Organization])

Be supportive but honest."""
            
            logger.info(f"📊 Analyzing nutrition progress ({recent_meals_data['days_logged']} days)")
            logger.debug(f"📝 Avg calories: {recent_meals_data['avg_calories']}, Avg protein: {recent_meals_data['avg_protein']}g")
            
            # Get LLM with balanced temperature
            llm = self.llm_manager.get_llm(temperature=0.5)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Progress analysis generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze progress: {e}", exc_info=True)
            return "Unable to analyze progress at this time. Please try again."
    
    def suggest_meal_timing(self, user_profile, workout_schedule):
        """
        Suggest optimal meal timing based on workout schedule
        
        Args:
            user_profile: User object
            workout_schedule: List of workout days
        
        Returns:
            Meal timing suggestions as string
        """
        try:
            # Build context
            context, allergen_names, medical_conditions = self._build_user_context(user_profile)
            
            # Build safety instructions
            safety_instructions = self.safety.build_prompt_safety_instructions(
                allergen_names, medical_conditions
            )
            
            workout_text = f"\nWorkout days: {', '.join(workout_schedule)}"
            
            prompt = f"""You are a sports nutritionist. Suggest optimal meal timing:

{context}{workout_text}{safety_instructions}

Provide:
1. Pre-workout nutrition strategy with citations
2. Post-workout nutrition strategy with citations
3. Meal timing on workout days
4. Meal timing on rest days
5. Key principles to follow

CRITICAL: Include inline source citations (e.g., "Consume protein within 2 hours post-workout (Source: ACSM)") for all timing recommendations.

Focus on performance and recovery."""
            
            logger.info(f"⏰ Generating meal timing suggestions (workout_days={len(workout_schedule)})")
            logger.debug(f"📝 Workout schedule: {workout_schedule}")
            
            # Get LLM with balanced temperature
            llm = self.llm_manager.get_llm(temperature=0.5)
            response = llm.invoke(prompt)
            
            # Add safety disclaimers
            response_with_disclaimers = self._add_safety_disclaimers(
                response, allergen_names, medical_conditions
            )
            
            logger.info(f"✅ Meal timing suggestions generated ({len(response_with_disclaimers)} chars)")
            return response_with_disclaimers
            
        except Exception as e:
            logger.error(f"❌ Failed to generate meal timing: {e}", exc_info=True)
            return "Unable to generate meal timing suggestions at this time."
    
    def explain_macro(self, macro_name):
        """
        Explain a macronutrient in simple terms

        Args:
            macro_name: 'protein', 'carbs', 'fats', 'calories', 'fiber', etc.

        Returns:
            Explanation as string
        """
        try:
            prompt = f"""Explain {macro_name} in 1-2 short paragraphs (max 100 words).

Include:
1. What it is and why it matters
2. Best food sources
3. Quick tips for daily intake with inline citation (e.g., "Adults need 0.8g/kg daily (Source: USDA Dietary Guidelines)")
4. Keep it simple and practical

CRITICAL: Include at least one inline source citation for any specific recommendation using format: (Source: [Organization])"""
            
            logger.info(f"📚 Explaining macro: {macro_name}")
            
            # Get LLM with factual temperature
            llm = self.llm_manager.get_llm(temperature=0.3)
            response = llm.invoke(prompt)
            
            # Add general disclaimer (no personalized warnings for public endpoint)
            response_with_disclaimer = response + self.safety.get_disclaimer()
            
            logger.info(f"✅ Explanation generated for {macro_name} ({len(response_with_disclaimer)} chars)")
            return response_with_disclaimer
            
        except Exception as e:
            logger.error(f"❌ Failed to explain macro '{macro_name}': {e}", exc_info=True)
            return f"Unable to explain {macro_name} at this time."
    
    def _build_user_context(self, user):
        """
        Build comprehensive context string from user profile
        
        Returns:
            Tuple[str, List[str], List[str]]: (context_string, allergen_names, medical_conditions)
        """
        context_parts = []
        allergen_names = []
        medical_conditions = user.medical_conditions if user.medical_conditions else []
        
        # Personal info
        name_text = user.full_name.split()[0] if user.full_name else "Client"
        if user.age and user.gender:
            context_parts.append(f"Client: {name_text}, {user.age}-year-old {user.gender}")
        
        # Physical stats
        if user.height and user.weight:
            bmi = round(float(user.weight) / ((float(user.height)/100) ** 2), 1)
            context_parts.append(f"Physical: {user.height}cm, {user.weight}kg (BMI: {bmi})")
        
        # Goals
        if user.fitness_goals:
            goals_readable = [g.replace('_', ' ').title() for g in user.fitness_goals]
            context_parts.append(f"Goals: {', '.join(goals_readable)}")
        
        # Targets
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
        
        # Activity
        if user.activity_level:
            activity = user.activity_level.replace('_', ' ').title()
            context_parts.append(f"Activity level: {activity}")
        
        # Lifting experience
        if user.lifting_experience:
            exp = user.lifting_experience.title()
            context_parts.append(f"Training experience: {exp}")
        
        # Training frequency
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
        
        # Medical conditions with emphasis
        if medical_conditions and len(medical_conditions) > 0:
            conditions_readable = [c.replace('_', ' ').title() for c in medical_conditions]
            context_parts.append(
                f"⚠️ Medical considerations: {', '.join(conditions_readable)}"
            )
            logger.info(f"⚠️ User has medical conditions: {conditions_readable}")
        
        # Hydration
        if user.target_water:
            context_parts.append(f"Hydration target: {user.target_water}ml/day")
        
        context_string = "\n".join(context_parts)
        logger.debug(f"📋 Built user context for {name_text}: {len(context_parts)} items, allergies={len(allergen_names)}")
        
        return context_string, allergen_names, medical_conditions
    
    def _add_safety_disclaimers(self, response, allergen_names, medical_conditions):
        """Add appropriate safety disclaimers to response"""
        disclaimers = []
        
        # Always add general disclaimer
        disclaimers.append(self.safety.get_disclaimer())
        
        return response + "".join(disclaimers)


# Singleton instance
_nutrition_advisor = None

def get_nutrition_advisor():
    """Get or create nutrition advisor instance"""
    global _nutrition_advisor
    if _nutrition_advisor is None:
        logger.debug("🚀 Creating Nutrition Advisor singleton")
        _nutrition_advisor = NutritionAdvisor()
    return _nutrition_advisor