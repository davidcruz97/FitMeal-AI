# app/api/onboarding.py
"""
User Onboarding API
Complete 10-screen registration flow
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User

bp = Blueprint('api_onboarding', __name__)


# ============================================
# VALID OPTIONS (Reference for frontend)
# ============================================

VALID_FITNESS_GOALS = [
    'improve_fitness',
    'build_muscle',
    'shred_fat',
    'toned_body',
    'weight_loss',
    'improve_mental_health',
    'balance',
    'maintain_muscle',
    'core_strength',
    'optimize_workouts',
    'lean_gains',
    'hormones_regulation'
]

VALID_GENDERS = ['male', 'female']

VALID_MEDICAL_CONDITIONS = [
    'hypothyroidism',
    'eating_disorder_anemia',
    'eating_disorder_anorexia',
    'eating_disorder_bulimia',
    'eating_disorder_compulsive',
    'special_medications',
    'pregnancy_intention',  # female only
    'polycystic_ovary',     # female only
    'infertility',
    'acne',
    'insulin_resistance',
    'diabetes'
]

VALID_ACTIVITY_LEVELS = [
    'sedentary',          # Little to no exercise, office job
    'lightly_active',     # Light exercise 1-3 days/week
    'moderately_active',  # Moderate exercise 3-5 days/week
    'very_active',        # Strenuous exercise 6-7 days/week
    'extremely_active'    # Strenuous exercise twice a day
]

VALID_LIFTING_EXPERIENCE = [
    'beginner',      # New to bodybuilding
    'intermediate',  # Lifted weights before
    'advanced'       # Lifting for years
]

VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']


# ============================================
# ENDPOINTS
# ============================================

@bp.route('/options', methods=['GET'])
def get_onboarding_options():
    """
    Get all valid options for onboarding screens
    Use this to populate dropdowns and selections in mobile app
    """
    return jsonify({
        'fitness_goals': [
            {'value': 'improve_fitness', 'label': 'Improve fitness'},
            {'value': 'build_muscle', 'label': 'Build muscle'},
            {'value': 'shred_fat', 'label': 'Shred fat'},
            {'value': 'toned_body', 'label': 'Toned body'},
            {'value': 'weight_loss', 'label': 'Weight loss'},
            {'value': 'improve_mental_health', 'label': 'Improve mental health'},
            {'value': 'balance', 'label': 'Balance'},
            {'value': 'maintain_muscle', 'label': 'Maintain muscle'},
            {'value': 'core_strength', 'label': 'Core strength'},
            {'value': 'optimize_workouts', 'label': 'Optimize workouts'},
            {'value': 'lean_gains', 'label': 'Lean gains'},
            {'value': 'hormones_regulation', 'label': 'Hormones regulation'},
        ],
        'genders': [
            {'value': 'male', 'label': 'Male'},
            {'value': 'female', 'label': 'Female'},
        ],
        'medical_conditions': [
            {'value': 'hypothyroidism', 'label': 'Hypothyroidism'},
            {'value': 'eating_disorder_anemia', 'label': 'Anemia'},
            {'value': 'eating_disorder_anorexia', 'label': 'Anorexia'},
            {'value': 'eating_disorder_bulimia', 'label': 'Bulimia'},
            {'value': 'eating_disorder_compulsive', 'label': 'Compulsive eating'},
            {'value': 'special_medications', 'label': 'Special medications'},
            {'value': 'pregnancy_intention', 'label': 'Pregnancy intention (female only)'},
            {'value': 'polycystic_ovary', 'label': 'Polycystic ovary syndrome (female only)'},
            {'value': 'infertility', 'label': 'Infertility'},
            {'value': 'acne', 'label': 'Acne'},
            {'value': 'insulin_resistance', 'label': 'Insulin resistance'},
            {'value': 'diabetes', 'label': 'Diabetes'},
        ],
        'activity_levels': [
            {'value': 'sedentary', 'label': 'Sedentary', 'description': 'Little to no exercise, office job'},
            {'value': 'lightly_active', 'label': 'Lightly active', 'description': 'Light exercise 1-3 days/week'},
            {'value': 'moderately_active', 'label': 'Moderately active', 'description': 'Moderate exercise 3-5 days/week'},
            {'value': 'very_active', 'label': 'Very active', 'description': 'Strenuous exercise 6-7 days/week'},
            {'value': 'extremely_active', 'label': 'Extremely active', 'description': 'Strenuous exercise twice a day'},
        ],
        'lifting_experience': [
            {'value': 'beginner', 'label': 'Beginner', 'description': "I'm new to bodybuilding"},
            {'value': 'intermediate', 'label': 'Intermediate', 'description': "I've lifted weights before"},
            {'value': 'advanced', 'label': 'Advanced', 'description': "I've been lifting for years"},
        ],
        'days': VALID_DAYS,
    }), 200


@bp.route('/complete', methods=['POST'])
@jwt_required()
def complete_onboarding():
    """
    Complete full onboarding with all 10 screens of data
    
    Request body:
    {
        "fitness_goals": ["build_muscle", "lean_gains"],
        "gender": "male",
        "food_allergies": [123, 456],  // ingredient IDs
        "medical_conditions": ["hypothyroidism"],
        "activity_level": "moderately_active",
        "lifting_experience": "intermediate",
        "age": 28,
        "height": 175,
        "weight": 75.5,
        "workout_days": ["monday", "wednesday", "friday", "saturday"]
    }
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        data = request.get_json()
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Validate required fields
        required_fields = [
            'fitness_goals', 'gender', 'activity_level', 
            'lifting_experience', 'age', 'height', 'weight', 'workout_days'
        ]
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing_fields
            }), 400
        
        # Validate all fields
        validation_error = validate_onboarding_data(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Update user profile
        user.fitness_goals = data['fitness_goals']
        user.gender = data['gender']
        user.age = data['age']
        user.height = data['height']
        user.weight = data['weight']
        
        user.food_allergies = data.get('food_allergies', [])
        user.medical_conditions = data.get('medical_conditions', [])
        
        user.activity_level = data['activity_level']
        user.lifting_experience = data['lifting_experience']
        user.workout_days = data['workout_days']
        
        # Calculate nutrition targets
        user.update_nutrition_targets()
        
        logger.info(
            f"✅ Onboarding completed for user {user_id}: "
            f"Goals={user.fitness_goals}, "
            f"BMR={user.calculated_bmr}, "
            f"TDEE={user.calculated_tdee}, "
            f"Target={user.target_calories}kcal, "
            f"Protein={user.target_protein}g, "
            f"Carbs={user.target_carbs}g, "
            f"Fats={user.target_fats}g, "
            f"Water={user.target_water}ml, "
            f"Workout days={len(user.workout_days)}/week"
        )
        
        return jsonify({
            'message': 'Onboarding completed successfully',
            'user': user.to_dict(include_nutrition=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to complete onboarding for user {user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to complete onboarding: {str(e)}'}), 500


@bp.route('/status', methods=['GET'])
@jwt_required()
def get_onboarding_status():
    """Check if user has completed onboarding"""
    user_id = int(get_jwt_identity())
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'profile_completed': user.profile_completed,
            'profile_completed_at': user.profile_completed_at.isoformat() if user.profile_completed_at else None,
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Failed to get onboarding status: {e}")
        return jsonify({'error': str(e)}), 500


def validate_onboarding_data(data):
    """
    Validate onboarding data
    
    Returns:
        Error message if validation fails, None if valid
    """
    # Validate fitness goals (multi-select, at least 1)
    if 'fitness_goals' in data:
        goals = data['fitness_goals']
        if not isinstance(goals, list) or len(goals) == 0:
            return "At least one fitness goal must be selected"
        
        invalid_goals = [g for g in goals if g not in VALID_FITNESS_GOALS]
        if invalid_goals:
            return f"Invalid fitness goals: {', '.join(invalid_goals)}"
    
    # Validate gender
    if 'gender' in data:
        if data['gender'] not in VALID_GENDERS:
            return f"Gender must be one of: {', '.join(VALID_GENDERS)}"
    
    # Validate food allergies (array of ingredient IDs)
    if 'food_allergies' in data:
        if not isinstance(data['food_allergies'], list):
            return "Food allergies must be an array of ingredient IDs"
    
    # Validate medical conditions
    if 'medical_conditions' in data:
        conditions = data['medical_conditions']
        if not isinstance(conditions, list):
            return "Medical conditions must be an array"
        
        invalid_conditions = [c for c in conditions if c not in VALID_MEDICAL_CONDITIONS]
        if invalid_conditions:
            return f"Invalid medical conditions: {', '.join(invalid_conditions)}"
        
        # Validate female-only conditions
        gender = data.get('gender')
        if gender == 'male':
            female_only = ['pregnancy_intention', 'polycystic_ovary']
            male_with_female_condition = [c for c in conditions if c in female_only]
            if male_with_female_condition:
                return f"Conditions not applicable to males: {', '.join(male_with_female_condition)}"
    
    # Validate activity level
    if 'activity_level' in data:
        if data['activity_level'] not in VALID_ACTIVITY_LEVELS:
            return f"Activity level must be one of: {', '.join(VALID_ACTIVITY_LEVELS)}"
    
    # Validate lifting experience
    if 'lifting_experience' in data:
        if data['lifting_experience'] not in VALID_LIFTING_EXPERIENCE:
            return f"Lifting experience must be one of: {', '.join(VALID_LIFTING_EXPERIENCE)}"
    
    # Validate age
    if 'age' in data:
        age = int(data['age'])
        if not (13 <= age <= 120):
            return "Age must be between 13 and 120 years"
    
    # Validate height
    if 'height' in data:
        height = int(data['height'])
        if not (100 <= height <= 250):
            return "Height must be between 100 and 250 cm"
    
    # Validate weight
    if 'weight' in data:
        weight = float(data['weight'])
        if not (30 <= weight <= 300):
            return "Weight must be between 30 and 300 kg"
    
    # Validate workout days (at least 1, recommend 4+)
    if 'workout_days' in data:
        days = data['workout_days']
        if not isinstance(days, list) or len(days) == 0:
            return "At least one workout day must be selected"
        
        if len(days) < 4:
            # This is a warning, not an error - we still allow it
            current_app.logger.warning(
                f"User selected only {len(days)} workout days. "
                "Recommended: 4+ days for optimal results"
            )
        
        invalid_days = [d for d in days if d not in VALID_DAYS]
        if invalid_days:
            return f"Invalid workout days: {', '.join(invalid_days)}"
    
    return None