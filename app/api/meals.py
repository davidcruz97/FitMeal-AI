# app/api/meals.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, limiter
from app.models.meal_scan import MealLog, MealScan
from app.models.recipe import Recipe
from app.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('api_meals', __name__)


@bp.route('/log', methods=['POST'])
@jwt_required()
@limiter.limit("100 per hour")
def log_meal():
    """
    Log a consumed meal
    
    Request body:
    {
        "recipe_id": 1,
        "meal_type": "lunch",
        "servings_consumed": 1.5,
        "notes": "Delicious!",
        "scan_id": 5  (optional)
    }
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        data = request.get_json()
        
        if not data or not data.get('recipe_id'):
            logger.warning(f"❌ Meal log failed: No recipe_id provided [User: {user_id}]")
            return jsonify({'error': 'recipe_id is required'}), 400
        
        recipe_id = data.get('recipe_id')
        meal_type = data.get('meal_type', 'lunch')
        servings_consumed = float(data.get('servings_consumed', 1.0))
        notes = data.get('notes', '').strip()
        scan_id = data.get('scan_id')
        
        logger.info(
            f"🍽️  Logging meal: Recipe {recipe_id} | Type: {meal_type} | "
            f"Servings: {servings_consumed} [User: {user_id}]"
        )
        
        # Validate meal_type
        valid_meal_types = ['breakfast', 'lunch', 'dinner', 'snack']
        if meal_type not in valid_meal_types:
            logger.warning(
                f"❌ Meal log failed: Invalid meal_type '{meal_type}' [User: {user_id}]"
            )
            return jsonify({'error': f'meal_type must be one of: {", ".join(valid_meal_types)}'}), 400
        
        # Check if recipe exists
        recipe = Recipe.query.get(recipe_id)
        if not recipe or recipe.is_deleted:
            logger.warning(
                f"❌ Meal log failed: Recipe {recipe_id} not found [User: {user_id}]"
            )
            return jsonify({'error': 'Recipe not found'}), 404
        
        # Calculate nutritional values for the consumed servings
        macros = recipe.calculate_macros(servings=servings_consumed)
        
        logger.debug(
            f"📊 Calculated macros: {macros['total']['calories']:.1f} kcal | "
            f"P: {macros['total']['protein']:.1f}g | "
            f"C: {macros['total']['carbs']:.1f}g | "
            f"F: {macros['total']['fats']:.1f}g"
        )
        
        # Create meal log
        meal_log = MealLog(
            user_id=user_id,
            recipe_id=recipe_id,
            scan_id=scan_id,
            meal_type=meal_type,
            servings_consumed=servings_consumed,
            calories_logged=macros['total']['calories'],
            protein_logged=macros['total']['protein'],
            carbs_logged=macros['total']['carbs'],
            fats_logged=macros['total']['fats'],
            notes=notes,
            consumed_at=datetime.utcnow()
        )
        
        db.session.add(meal_log)
        db.session.commit()
        
        logger.info(
            f"✅ Meal logged successfully: {recipe.name} ({meal_type}) | "
            f"ID: {meal_log.id} | {macros['total']['calories']:.0f} kcal [User: {user_id}]"
        )
        
        return jsonify({
            'message': 'Meal logged successfully',
            'meal_log': meal_log.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to log meal for user {user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to log meal: {str(e)}'}), 500


@bp.route('/history', methods=['GET'])
@jwt_required()
@limiter.limit("100 per minute")
def get_meal_history():
    """
    Get user's meal history
    
    Query params:
        page: page number (default: 1)
        per_page: items per page (default: 20, max: 100)
        days: filter last N days (default: 30)
        meal_type: filter by meal type
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        days = int(request.args.get('days', 30))
        meal_type = request.args.get('meal_type', '').strip()
        
        logger.debug(
            f"📜 Fetching meal history: Last {days} days | Page {page} | "
            f"Type: {meal_type or 'all'} [User: {user_id}]"
        )
        
        # Build query
        query = MealLog.get_active_query().filter_by(user_id=user_id)
        
        # Filter by date range
        since_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(MealLog.consumed_at >= since_date)
        
        # Filter by meal type
        if meal_type:
            query = query.filter_by(meal_type=meal_type)
        
        # Order by most recent first
        query = query.order_by(MealLog.consumed_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        logger.info(
            f"✅ Retrieved meal history: {len(pagination.items)} meals | "
            f"Page {page}/{pagination.pages} | Total: {pagination.total} [User: {user_id}]"
        )
        
        return jsonify({
            'meals': [meal.to_dict() for meal in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get meal history for user {user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get meal history: {str(e)}'}), 500


@bp.route('/stats', methods=['GET'])
@jwt_required()
@limiter.limit("50 per minute")
def get_nutrition_stats():
    """
    Get nutrition statistics for a date range
    
    Query params:
        days: calculate stats for last N days (default: 7)
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        days = int(request.args.get('days', 7))
        
        logger.debug(f"📊 Calculating nutrition stats for last {days} days [User: {user_id}]")
        
        # Calculate date range
        since_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all meals in range
        meals = MealLog.get_active_query().filter(
            MealLog.user_id == user_id,
            MealLog.consumed_at >= since_date
        ).all()
        
        if not meals:
            logger.info(f"ℹ️  No meals found for stats calculation [User: {user_id}]")
            return jsonify({
                'stats': {
                    'total_meals': 0,
                    'total_calories': 0,
                    'total_protein': 0,
                    'total_carbs': 0,
                    'total_fats': 0,
                    'avg_calories_per_day': 0,
                    'avg_protein_per_day': 0,
                    'avg_carbs_per_day': 0,
                    'avg_fats_per_day': 0
                },
                'days': days
            }), 200
        
        # Calculate totals
        total_calories = sum(meal.calories_logged for meal in meals)
        total_protein = sum(meal.protein_logged for meal in meals)
        total_carbs = sum(meal.carbs_logged for meal in meals)
        total_fats = sum(meal.fats_logged for meal in meals)
        
        # Calculate daily breakdown
        daily_breakdown = {}
        for meal in meals:
            date_key = meal.consumed_at.date().isoformat()
            if date_key not in daily_breakdown:
                daily_breakdown[date_key] = {
                    'date': date_key,
                    'calories': 0,
                    'protein': 0,
                    'carbs': 0,
                    'fats': 0,
                    'meals': []
                }
            
            daily_breakdown[date_key]['calories'] += meal.calories_logged
            daily_breakdown[date_key]['protein'] += meal.protein_logged
            daily_breakdown[date_key]['carbs'] += meal.carbs_logged
            daily_breakdown[date_key]['fats'] += meal.fats_logged
            daily_breakdown[date_key]['meals'].append({
                'meal_type': meal.meal_type,
                'recipe_name': meal.recipe.name if meal.recipe else None,
                'calories': meal.calories_logged
            })
        
        # Calculate meal type distribution
        meal_type_counts = {}
        for meal in meals:
            meal_type_counts[meal.meal_type] = meal_type_counts.get(meal.meal_type, 0) + 1
        
        logger.info(
            f"✅ Calculated nutrition stats: {len(meals)} meals | "
            f"Avg {total_calories/days:.0f} kcal/day | "
            f"P: {total_protein/days:.0f}g C: {total_carbs/days:.0f}g F: {total_fats/days:.0f}g [User: {user_id}]"
        )
        
        return jsonify({
            'stats': {
                'total_meals': len(meals),
                'total_calories': round(total_calories, 1),
                'total_protein': round(total_protein, 1),
                'total_carbs': round(total_carbs, 1),
                'total_fats': round(total_fats, 1),
                'avg_calories_per_day': round(total_calories / days, 1),
                'avg_protein_per_day': round(total_protein / days, 1),
                'avg_carbs_per_day': round(total_carbs / days, 1),
                'avg_fats_per_day': round(total_fats / days, 1),
                'meal_type_distribution': meal_type_counts
            },
            'daily_breakdown': sorted(daily_breakdown.values(), key=lambda x: x['date'], reverse=True),
            'days': days,
            'date_range': {
                'from': since_date.date().isoformat(),
                'to': datetime.utcnow().date().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get nutrition stats for user {user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500


@bp.route('/<int:meal_id>', methods=['GET'])
@jwt_required()
def get_meal(meal_id):
    """Get meal log details by ID"""
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        meal = MealLog.query.get(meal_id)
        
        if not meal or meal.is_deleted:
            logger.warning(f"⚠️  Meal not found: {meal_id} [User: {user_id}]")
            return jsonify({'error': 'Meal not found'}), 404
        
        # Check ownership
        if meal.user_id != user_id:
            logger.warning(
                f"🚫 Access denied: User {user_id} attempted to access meal {meal_id} "
                f"owned by user {meal.user_id}"
            )
            return jsonify({'error': 'Access denied'}), 403
        
        logger.debug(f"📊 Retrieved meal {meal_id} [User: {user_id}]")
        
        return jsonify({
            'meal': meal.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get meal {meal_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get meal: {str(e)}'}), 500


@bp.route('/<int:meal_id>', methods=['DELETE'])
@jwt_required()
def delete_meal(meal_id):
    """Delete (hard delete) a meal log permanently"""
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        meal = MealLog.query.get(meal_id)
        
        if not meal or meal.is_deleted:
            logger.warning(f"⚠️  Meal not found: {meal_id} [User: {user_id}]")
            return jsonify({'error': 'Meal not found'}), 404
        
        # Check ownership
        if meal.user_id != user_id:
            logger.warning(
                f"🚫 Access denied: User {user_id} attempted to delete meal {meal_id}"
            )
            return jsonify({'error': 'Access denied'}), 403
        
        recipe_name = meal.recipe.name if meal.recipe else 'Unknown'
        
        # Hard delete
        db.session.delete(meal)
        db.session.commit()
        
        logger.info(f"🗑️  Meal deleted: {meal_id} ({recipe_name}) [User: {user_id}]")
        
        return jsonify({
            'message': 'Meal deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to delete meal {meal_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to delete meal: {str(e)}'}), 500