# app/api/ai.py
"""
AI Features API
Endpoints for meal recommendations, nutrition Q&A, and personalized advice
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import limiter
from app.models.user import User
from app.ai.llm_manager import get_llm_manager
from app.ai.meal_recommender import get_meal_recommender
from app.ai.nutrition_advisor import get_nutrition_advisor

bp = Blueprint('api_ai', __name__)


# ============================================
# Warmup Endpoint
# ============================================

@bp.route('/warmup', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def warmup_ai():
    """
    Warm up the AI model
    
    Call this when user opens AI features to preload the model into RAM.
    Subsequent AI requests will be much faster.
    
    Returns:
        200: AI ready
        500: Warmup failed
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    logger.info(f"🔥 Warmup request from user_id={user_id}")
    
    try:
        manager = get_llm_manager()
        
        # Check if already warm
        if manager.is_ready():
            logger.debug(f"⚡ Model already warm for user_id={user_id}")
            return jsonify({
                "status": "ready",
                "message": "AI advisor is ready",
                "already_warm": True
            }), 200
        
        # Warm up the model
        success = manager.warmup()
        
        if success:
            logger.info(f"✅ Warmup successful for user_id={user_id}")
            return jsonify({
                "status": "ready",
                "message": "AI advisor is ready",
                "already_warm": False
            }), 200
        else:
            logger.error(f"❌ Warmup failed for user_id={user_id}")
            return jsonify({
                "status": "error",
                "message": "Failed to warm up AI"
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Warmup error for user_id={user_id}: {e}", exc_info=True)
        return jsonify({
            "error": "Warmup failed",
            "details": str(e)
        }), 500


# ============================================
# Status Endpoint
# ============================================

@bp.route('/status', methods=['GET'])
@jwt_required()
def ai_status():
    """Get AI system status"""
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    logger.debug(f"📊 Status check from user_id={user_id}")
    
    try:
        manager = get_llm_manager()
        status = manager.get_status()
        
        return jsonify({
            "status": "online",
            **status
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Status check error: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


# ============================================
# Meal Recommendations
# ============================================

@bp.route('/recommend-meals', methods=['POST'])
@jwt_required()
@limiter.limit("30 per hour")
def recommend_meals():
    """
    Get AI-powered meal recommendations
    
    Request body (all optional):
    {
        "available_ingredients": ["chicken", "broccoli", "rice"],
        "meal_type": "dinner"  // breakfast, lunch, dinner, snack
    }
    
    Returns personalized meal recommendations based on user profile
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"⚠️ User not found: user_id={user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        if not user.profile_completed:
            logger.warning(f"⚠️ Profile incomplete for user_id={user_id}")
            return jsonify({
                'error': 'Please complete your profile first to get personalized recommendations'
            }), 400
        
        data = request.get_json() or {}
        available_ingredients = data.get('available_ingredients', [])
        meal_type = data.get('meal_type')
        
        # Validate meal_type
        if meal_type and meal_type not in ['breakfast', 'lunch', 'dinner', 'snack']:
            logger.warning(f"⚠️ Invalid meal_type={meal_type} from user_id={user_id}")
            return jsonify({
                'error': 'Invalid meal_type. Must be: breakfast, lunch, dinner, or snack'
            }), 400
        
        logger.info(
            f"🍽️ Generating meal recommendations for user_id={user_id} "
            f"(meal_type={meal_type}, ingredients={len(available_ingredients)})"
        )
        
        # Get recommendations
        recommender = get_meal_recommender()
        recommendations = recommender.recommend_recipes(
            user_profile=user,
            available_ingredients=available_ingredients if available_ingredients else None,
            meal_type=meal_type
        )
        
        logger.info(f"✅ Recommendations generated for user_id={user_id}")
        
        return jsonify({
            'recommendations': recommendations,
            'user_targets': {
                'calories': user.target_calories,
                'protein': user.target_protein,
                'carbs': user.target_carbs,
                'fats': user.target_fats
            }
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to generate recommendations for user_id={user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to generate recommendations: {str(e)}'}), 500


@bp.route('/recipe-for-macros', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def recipe_for_macros():
    """
    Generate recipe for specific macro targets
    
    Request body:
    {
        "target_calories": 500,
        "target_protein": 40,
        "target_carbs": 50,
        "target_fats": 15,
        "meal_type": "lunch",  // optional
        "dietary_restrictions": ["vegetarian"]  // optional
    }
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['target_calories', 'target_protein', 'target_carbs', 'target_fats']
        missing = [f for f in required if f not in data]
        
        if missing:
            logger.warning(f"⚠️ Missing fields from user_id={user_id}: {missing}")
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing
            }), 400
        
        logger.info(
            f"🎯 Generating recipe for macros: {data['target_calories']}kcal, "
            f"P{data['target_protein']}g, C{data['target_carbs']}g, F{data['target_fats']}g "
            f"[user_id={user_id}]"
        )
        
        # Generate recipe
        recommender = get_meal_recommender()
        recipe = recommender.suggest_recipe_for_macros(
            target_calories=data['target_calories'],
            target_protein=data['target_protein'],
            target_carbs=data['target_carbs'],
            target_fats=data['target_fats'],
            meal_type=data.get('meal_type'),
            dietary_restrictions=data.get('dietary_restrictions')
        )
        
        logger.info(f"✅ Recipe generated for user_id={user_id}")
        
        return jsonify({
            'recipe': recipe
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to generate recipe for user_id={user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to generate recipe: {str(e)}'}), 500


@bp.route('/modify-recipe', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def modify_recipe():
    """
    Get suggestions to modify a recipe for user's goals
    
    Request body:
    {
        "recipe_name": "Chicken Alfredo",
        "recipe_ingredients": ["chicken", "pasta", "cream", "parmesan"]
    }
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        user = User.query.get(user_id)
        if not user or not user.profile_completed:
            logger.warning(f"⚠️ Profile incomplete for user_id={user_id}")
            return jsonify({
                'error': 'Please complete your profile first'
            }), 400
        
        data = request.get_json()
        
        if 'recipe_name' not in data or 'recipe_ingredients' not in data:
            logger.warning(f"⚠️ Missing recipe data from user_id={user_id}")
            return jsonify({
                'error': 'Missing required fields: recipe_name, recipe_ingredients'
            }), 400
        
        logger.info(f"🔧 Modifying recipe '{data['recipe_name']}' for user_id={user_id}")
        
        # Generate modifications
        recommender = get_meal_recommender()
        modifications = recommender.modify_recipe_for_goals(
            recipe_name=data['recipe_name'],
            recipe_ingredients=data['recipe_ingredients'],
            user_goals=user.fitness_goals
        )
        
        logger.info(f"✅ Recipe modifications generated for user_id={user_id}")
        
        return jsonify({
            'modifications': modifications,
            'user_goals': user.fitness_goals
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to modify recipe for user_id={user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to modify recipe: {str(e)}'}), 500


# ============================================
# Nutrition Q&A
# ============================================

@bp.route('/ask-nutrition', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def ask_nutrition():
    """
    Ask a nutrition question and get personalized advice
    
    Request body:
    {
        "question": "What should I eat before a morning workout?"
    }
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"⚠️ User not found: user_id={user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'question' not in data or not data['question'].strip():
            logger.warning(f"⚠️ Empty question from user_id={user_id}")
            return jsonify({'error': 'Question is required'}), 400
        
        question = data['question'].strip()
        
        logger.info(f"💬 Answering nutrition question for user_id={user_id}: {question[:50]}...")
        
        # Get answer
        advisor = get_nutrition_advisor()
        answer = advisor.answer_question(
            question=question,
            user_profile=user if user.profile_completed else None
        )
        
        logger.info(f"✅ Answer generated for user_id={user_id}")
        
        return jsonify({
            'question': question,
            'answer': answer,
            'personalized': user.profile_completed
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to answer question for user_id={user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to answer question: {str(e)}'}), 500


@bp.route('/meal-timing', methods=['GET'])
@jwt_required()
@limiter.limit("10 per hour")
def get_meal_timing():
    """
    Get personalized meal timing suggestions based on workout schedule
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        user = User.query.get(user_id)
        if not user or not user.profile_completed:
            logger.warning(f"⚠️ Profile incomplete for user_id={user_id}")
            return jsonify({
                'error': 'Please complete your profile first'
            }), 400
        
        logger.info(f"⏰ Generating meal timing for user_id={user_id}")
        
        # Get suggestions
        advisor = get_nutrition_advisor()
        suggestions = advisor.suggest_meal_timing(
            user_profile=user,
            workout_schedule=user.workout_days or []
        )
        
        logger.info(f"✅ Meal timing generated for user_id={user_id}")
        
        return jsonify({
            'suggestions': suggestions,
            'workout_days': user.workout_days,
            'rest_days': user.rest_days
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to generate meal timing for user_id={user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to generate meal timing: {str(e)}'}), 500


@bp.route('/explain/<macro_name>', methods=['GET'])
@limiter.limit("30 per hour")
def explain_macro(macro_name):
    """
    Get explanation of a macronutrient (public endpoint)
    
    Path parameter:
        macro_name: protein, carbs, fats, calories, fiber, etc.
    """
    logger = current_app.logger
    
    try:
        logger.info(f"📚 Explaining macro: {macro_name}")
        
        # Get explanation
        advisor = get_nutrition_advisor()
        explanation = advisor.explain_macro(macro_name)
        
        logger.info(f"✅ Explanation generated for {macro_name}")
        
        return jsonify({
            'macro': macro_name,
            'explanation': explanation
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to explain {macro_name}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to explain {macro_name}: {str(e)}'}), 500