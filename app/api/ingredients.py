# app/api/ingredients.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, cache, limiter
from app.models.ingredient import Ingredient
from app.models.user import User

bp = Blueprint('api_ingredients', __name__)


@bp.route('/search', methods=['GET'])
@limiter.limit("100 per minute")
@cache.cached(timeout=300, query_string=True)  # Cache for 5 minutes
def search_ingredients():
    """
    Search ingredients by name (autocomplete)
    
    Query params:
        q: search query (required)
        limit: max results (default: 10, max: 50)
    
    Example: GET /api/ingredients/search?q=chick&limit=5
    """
    logger = current_app.logger
    
    try:
        query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 10)), 50)
        
        logger.debug(f"🔎 Ingredient search: query='{query}', limit={limit}")
        
        if not query:
            return jsonify({'error': 'Search query (q) is required'}), 400
        
        if len(query) < 2:
            return jsonify({'error': 'Search query must be at least 2 characters'}), 400
        
        # Search ingredients
        ingredients = Ingredient.search_by_name(query, limit)
        
        logger.info(f"✅ Found {len(ingredients)} ingredients for '{query}'")
        
        return jsonify({
            'query': query,
            'ingredients': [ing.to_dict(include_nutritional=False) for ing in ingredients],
            'total': len(ingredients)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Search failed: {e}", exc_info=True)
        return jsonify({'error': f'Search failed: {str(e)}'}), 500


@bp.route('', methods=['GET'])
@limiter.limit("50 per minute")
@cache.cached(timeout=600, query_string=True)  # Cache for 10 minutes
def list_ingredients():
    """
    List all ingredients with filtering and pagination
    
    Query params:
        page: page number (default: 1)
        per_page: items per page (default: 20, max: 100)
        category: filter by category
    """
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        category = request.args.get('category', '').strip()
        
        # Build query
        query = Ingredient.query
        
        if category:
            query = query.filter_by(category=category)
        
        # Order by name
        query = query.order_by(Ingredient.name)
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'ingredients': [ing.to_dict(include_nutritional=False) for ing in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to list ingredients: {str(e)}'}), 500


@bp.route('/<int:ingredient_id>', methods=['GET'])
@limiter.limit("100 per minute")
@cache.cached(timeout=600)  # Cache for 10 minutes
def get_ingredient(ingredient_id):
    """
    Get ingredient details by ID
    
    Params:
        ingredient_id: ingredient ID
    """
    try:
        ingredient = Ingredient.query.get(ingredient_id)
        
        if not ingredient:
            return jsonify({'error': 'Ingredient not found'}), 404
        
        return jsonify({
            'ingredient': ingredient.to_dict(include_nutritional=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get ingredient: {str(e)}'}), 500


@bp.route('/categories', methods=['GET'])
@cache.cached(timeout=3600)  # Cache for 1 hour
def get_categories():
    """
    Get all ingredient categories with counts
    """
    try:
        categories = db.session.query(
            Ingredient.category,
            db.func.count(Ingredient.id).label('count')
        ).group_by(
            Ingredient.category
        ).all()
        
        return jsonify({
            'categories': [
                {
                    'name': cat.category,
                    'count': cat.count
                }
                for cat in categories if cat.category
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get categories: {str(e)}'}), 500


# Admin endpoints
@bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def create_ingredient():
    """
    Create new ingredient (admin/nutritionist only)
    
    Request body:
    {
        "name": "Chicken Breast",
        "category": "protein",
        "calories_per_100g": 165,
        "protein_per_100g": 31,
        "carbs_per_100g": 0,
        "fats_per_100g": 3.6,
        "fiber_per_100g": 0
    }
    """
    logger = current_app.logger
    
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or not user.is_nutritionist():
            return jsonify({'error': 'Nutritionist access required'}), 403
        
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'Ingredient name is required'}), 400
        
        # Create ingredient
        ingredient = Ingredient(
            name=data.get('name').strip(),
            category=data.get('category', 'other'),
            calories_per_100g=float(data.get('calories_per_100g', 0)),
            protein_per_100g=float(data.get('protein_per_100g', 0)),
            carbs_per_100g=float(data.get('carbs_per_100g', 0)),
            fats_per_100g=float(data.get('fats_per_100g', 0)),
            fiber_per_100g=float(data.get('fiber_per_100g', 0)) if data.get('fiber_per_100g') else None
        )
        
        db.session.add(ingredient)
        db.session.commit()
        
        logger.info(f"✅ Created ingredient: {ingredient.name} (ID: {ingredient.id})")
        
        # Clear cache
        cache.clear()
        
        return jsonify({
            'message': 'Ingredient created successfully',
            'ingredient': ingredient.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to create ingredient: {e}", exc_info=True)
        return jsonify({'error': f'Failed to create ingredient: {str(e)}'}), 500