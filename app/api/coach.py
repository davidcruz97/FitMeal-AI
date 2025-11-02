# app/api/coach.py
"""
Coach/Admin API
Advanced nutrition calculations and meal planning tools for coaches
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.ai.nutrition_calculator import get_nutrition_calculator
from app.ai.meal_planner import get_meal_planner

bp = Blueprint('api_coach', __name__)


def require_coach():
    """Decorator to require coach/admin role"""
    from functools import wraps
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            
            if not user or not user.is_nutritionist():
                return jsonify({'error': 'Access denied. Coach/Admin role required.'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ============================================
# Nutrition Calculator Endpoints
# ============================================

@bp.route('/calculate/bmr', methods=['POST'])
@jwt_required()
@require_coach()
def calculate_bmr():
    """
    Calculate BMR using different formulas
    
    Request body:
    {
        "weight_kg": 75.5,
        "height_cm": 175,
        "age": 28,
        "gender": "male",
        "formula": "mifflin"  // mifflin, harris_benedict, katch_mcardle
        "lean_body_mass_kg": 65.0  // required for katch_mcardle
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        calculator = get_nutrition_calculator()
        
        formula = data.get('formula', 'mifflin')
        
        if formula == 'katch_mcardle':
            if 'lean_body_mass_kg' not in data:
                return jsonify({'error': 'lean_body_mass_kg required for Katch-McArdle'}), 400
            
            bmr = calculator.calculate_bmr_katch_mcardle(data['lean_body_mass_kg'])
        elif formula == 'harris_benedict':
            bmr = calculator.calculate_bmr_harris_benedict(
                data['weight_kg'], data['height_cm'], data['age'], data['gender']
            )
        else:  # mifflin (default)
            bmr = calculator.calculate_bmr_mifflin(
                data['weight_kg'], data['height_cm'], data['age'], data['gender']
            )
        
        logger.info(f"✅ BMR calculated using {formula}: {bmr} kcal")
        
        return jsonify({
            'bmr': bmr,
            'formula_used': formula
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to calculate BMR: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/calculate/macros', methods=['POST'])
@jwt_required()
@require_coach()
def calculate_macros():
    """
    Calculate optimal macro distribution
    
    Request body:
    {
        "calories": 2500,
        "weight_kg": 75.5,
        "goals": ["build_muscle", "lean_gains"],
        "method": "by_goal"  // by_goal, custom, bodybuilding
        
        // For custom method:
        "protein_percentage": 0.30,
        "fat_percentage": 0.30,
        "carb_percentage": 0.40,
        
        // For bodybuilding method:
        "phase": "bulk"  // bulk, cut, maintenance
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        calculator = get_nutrition_calculator()
        
        method = data.get('method', 'by_goal')
        
        if method == 'custom':
            macros = calculator.calculate_macros_custom(
                data['calories'],
                data['protein_percentage'],
                data['fat_percentage'],
                data['carb_percentage']
            )
        elif method == 'bodybuilding':
            protein, carbs, fats = calculator.calculate_macros_bodybuilding(
                data['weight_kg'],
                data['phase']
            )
            macros = {
                'protein': protein,
                'carbs': carbs,
                'fats': fats,
                'calories': (protein * 4) + (carbs * 4) + (fats * 9)
            }
        else:  # by_goal
            macros = calculator.calculate_macros_by_goal(
                data['calories'],
                data['weight_kg'],
                data.get('goals', [])
            )
        
        # Validate macros
        validation = calculator.validate_macros(
            macros['protein'], macros['carbs'], macros['fats']
        )
        
        logger.info(f"✅ Macros calculated using {method} method")
        
        return jsonify({
            'macros': macros,
            'validation': validation,
            'method_used': method
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to calculate macros: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/calculate/body-composition', methods=['POST'])
@jwt_required()
@require_coach()
def calculate_body_composition():
    """
    Calculate body composition metrics
    
    Request body:
    {
        "weight_kg": 75.5,
        "height_cm": 175,
        "gender": "male",
        "body_fat_percentage": 0.15  // optional
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        calculator = get_nutrition_calculator()
        
        results = {}
        
        # BMI
        bmi = calculator.calculate_bmi(data['weight_kg'], data['height_cm'])
        results['bmi'] = bmi
        results['bmi_category'] = calculator.get_bmi_category(bmi)
        
        # Ideal weight range
        min_weight, max_weight = calculator.calculate_ideal_weight(
            data['height_cm'], data['gender']
        )
        results['ideal_weight_range'] = {
            'min': round(min_weight, 1),
            'max': round(max_weight, 1)
        }
        
        # Lean body mass (if body fat % provided)
        if 'body_fat_percentage' in data:
            lbm = calculator.calculate_lean_body_mass(
                data['weight_kg'],
                data['body_fat_percentage']
            )
            results['lean_body_mass_kg'] = round(lbm, 1)
            results['fat_mass_kg'] = round(data['weight_kg'] - lbm, 1)
        
        logger.info(f"✅ Body composition calculated")
        
        return jsonify(results), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to calculate body composition: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/calculate/timeline', methods=['POST'])
@jwt_required()
@require_coach()
def calculate_timeline():
    """
    Calculate weight loss/gain timeline
    
    Request body:
    {
        "current_weight": 80.0,
        "goal_weight": 75.0,
        "weekly_change": 0.5
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        calculator = get_nutrition_calculator()
        
        timeline = calculator.calculate_weight_loss_timeline(
            data['current_weight'],
            data['goal_weight'],
            data.get('weekly_change', 0.5)
        )
        
        logger.info(f"✅ Timeline calculated: {timeline['weeks']} weeks")
        
        return jsonify(timeline), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to calculate timeline: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================
# Meal Planning Endpoints
# ============================================

@bp.route('/meal-plan/weekly', methods=['POST'])
@jwt_required()
@require_coach()
def create_weekly_plan():
    """
    Generate comprehensive weekly meal plan for a user
    
    Request body:
    {
        "user_id": 123,
        "preferences": {
            "meal_count": 4,
            "cuisine_types": ["mexican", "italian"],
            "cooking_skill": "intermediate",
            "budget": "medium"
        }
    }
    """
    logger = current_app.logger
    coach_id = int(get_jwt_identity())
    
    try:
        data = request.get_json()
        
        # Get user
        user = User.query.get(data['user_id'])
        if not user or not user.profile_completed:
            return jsonify({'error': 'User not found or profile incomplete'}), 404
        
        # Convert user to dict
        user_profile = {
            'age': user.age,
            'gender': user.gender,
            'fitness_goals': user.fitness_goals,
            'target_calories': user.target_calories,
            'target_protein': user.target_protein,
            'target_carbs': user.target_carbs,
            'target_fats': user.target_fats,
            'activity_level': user.activity_level,
            'workout_days': user.workout_days,
            'food_allergies': user.food_allergies,
            'medical_conditions': user.medical_conditions
        }
        
        logger.info(f"🗓️ Coach {coach_id} creating weekly plan for user {user.id}")
        
        # Generate plan
        planner = get_meal_planner()
        plan = planner.generate_weekly_plan(
            user_profile,
            data.get('preferences')
        )
        
        logger.info(f"✅ Weekly plan generated for user {user.id}")
        
        return jsonify({
            'user_id': user.id,
            'user_name': user.full_name,
            'weekly_plan': plan,
            'created_by_coach': coach_id
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to create weekly plan: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/meal-plan/meal-prep', methods=['POST'])
@jwt_required()
@require_coach()
def create_meal_prep_plan():
    """
    Generate meal prep strategy
    
    Request body:
    {
        "user_id": 123,
        "prep_days": ["Sunday", "Wednesday"]
    }
    """
    logger = current_app.logger
    coach_id = int(get_jwt_identity())
    
    try:
        data = request.get_json()
        
        user = User.query.get(data['user_id'])
        if not user or not user.profile_completed:
            return jsonify({'error': 'User not found or profile incomplete'}), 404
        
        user_profile = {
            'target_calories': user.target_calories,
            'target_protein': user.target_protein,
            'target_carbs': user.target_carbs,
            'target_fats': user.target_fats,
            'fitness_goals': user.fitness_goals,
            'workout_days': user.workout_days
        }
        
        logger.info(f"🍱 Coach {coach_id} creating meal prep plan for user {user.id}")
        
        planner = get_meal_planner()
        plan = planner.generate_meal_prep_plan(
            user_profile,
            data.get('prep_days', ['Sunday'])
        )
        
        logger.info(f"✅ Meal prep plan generated for user {user.id}")
        
        return jsonify({
            'user_id': user.id,
            'meal_prep_plan': plan
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to create meal prep plan: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/meal-plan/day', methods=['POST'])
@jwt_required()
@require_coach()
def create_day_plan():
    """
    Generate single-day meal plan
    
    Request body:
    {
        "user_id": 123,
        "day_type": "workout"  // workout or rest
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        
        user = User.query.get(data['user_id'])
        if not user or not user.profile_completed:
            return jsonify({'error': 'User not found or profile incomplete'}), 404
        
        user_profile = {
            'target_calories': user.target_calories,
            'target_protein': user.target_protein,
            'target_carbs': user.target_carbs,
            'target_fats': user.target_fats,
            'fitness_goals': user.fitness_goals
        }
        
        planner = get_meal_planner()
        plan = planner.generate_day_meal_plan(
            user_profile,
            data.get('day_type', 'workout')
        )
        
        logger.info(f"✅ Day plan generated for user {user.id}")
        
        return jsonify({
            'user_id': user.id,
            'day_plan': plan,
            'day_type': data.get('day_type', 'workout')
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to create day plan: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/meal-plan/adjust', methods=['POST'])
@jwt_required()
@require_coach()
def adjust_meal_plan():
    """
    Adjust existing meal plan based on feedback
    
    Request body:
    {
        "meal_plan": "existing plan text...",
        "adjustments": {
            "remove_ingredients": ["chicken"],
            "add_preferences": ["more vegetables"],
            "budget": "low",
            "cooking_time": "quick"
        }
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        
        planner = get_meal_planner()
        adjusted_plan = planner.adjust_plan_for_preferences(
            data['meal_plan'],
            data['adjustments']
        )
        
        logger.info(f"✅ Meal plan adjusted")
        
        return jsonify({
            'adjusted_plan': adjusted_plan
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to adjust meal plan: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/meal-plan/competition', methods=['POST'])
@jwt_required()
@require_coach()
def create_competition_plan():
    """
    Generate competition prep meal plan
    
    Request body:
    {
        "user_id": 123,
        "weeks_out": 12
    }
    """
    logger = current_app.logger
    coach_id = int(get_jwt_identity())
    
    try:
        data = request.get_json()
        
        user = User.query.get(data['user_id'])
        if not user or not user.profile_completed:
            return jsonify({'error': 'User not found or profile incomplete'}), 404
        
        user_profile = {
            'weight_kg': float(user.weight),
            'target_calories': user.target_calories,
            'target_protein': user.target_protein,
            'target_carbs': user.target_carbs,
            'target_fats': user.target_fats,
            'fitness_goals': user.fitness_goals,
            'workout_days': user.workout_days
        }
        
        logger.info(
            f"🏆 Coach {coach_id} creating competition prep plan "
            f"for user {user.id} ({data['weeks_out']} weeks out)"
        )
        
        planner = get_meal_planner()
        plan = planner.generate_competition_prep_plan(
            user_profile,
            data['weeks_out']
        )
        
        logger.info(f"✅ Competition prep plan generated for user {user.id}")
        
        return jsonify({
            'user_id': user.id,
            'competition_plan': plan,
            'weeks_out': data['weeks_out']
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to create competition plan: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@bp.route('/shopping-list', methods=['POST'])
@jwt_required()
@require_coach()
def generate_shopping_list():
    """
    Generate shopping list from meal plan
    
    Request body:
    {
        "meal_plan": "weekly meal plan text..."
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        
        planner = get_meal_planner()
        shopping_list = planner.generate_shopping_list(data['meal_plan'])
        
        logger.info(f"✅ Shopping list generated")
        
        return jsonify({
            'shopping_list': shopping_list
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to generate shopping list: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500