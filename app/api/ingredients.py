# app/api/ingredients.py
from flask import Blueprint, request, jsonify
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
        verified_only: return only verified ingredients (default: false)
    
    Example: GET /api/ingredients/search?q=chick&limit=5
    """
    try:
        query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 10)), 50)
        verified_only = request.args.get('verified_only', 'false').lower() == 'true'
        
        if not query:
            return jsonify({'error': 'Search query (q) is required'}), 400
        
        if len(query) < 2:
            return jsonify({'error': 'Search query must be at least 2 characters'}), 400
        
        # Build query
        if verified_only:
            ingredients = Ingredient.get_verified_query().filter(
                db.or_(
                    Ingredient.name.ilike(f'%{query}%'),
                    Ingredient.name_es.ilike(f'%{query}%')
                )
            ).order_by(
                Ingredient.usage_count.desc(),
                Ingredient.name
            ).limit(limit).all()
        else:
            ingredients = Ingredient.search_by_name(query, limit)
        
        return jsonify({
            'query': query,
            'results': [ing.to_dict(include_nutritional=False) for ing in ingredients],
            'total': len(ingredients)
        }), 200
        
    except Exception as e:
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
        verified_only: return only verified ingredients (default: false)
        yolo_only: return only YOLO-detectable ingredients (default: false)
    """
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        category = request.args.get('category', '').strip()
        verified_only = request.args.get('verified_only', 'false').lower() == 'true'
        yolo_only = request.args.get('yolo_only', 'false').lower() == 'true'
        
        # Build query
        query = Ingredient.get_active_query()
        
        if verified_only:
            query = query.filter_by(is_verified=True)
        
        if yolo_only:
            query = query.filter_by(yolo_detectable=True)
        
        if category:
            query = query.filter_by(category=category)
        
        # Order by usage and name
        query = query.order_by(Ingredient.usage_count.desc(), Ingredient.name)
        
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
        
        if not ingredient or ingredient.is_deleted:
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
        ).filter_by(
            is_deleted=False
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
        "name_es": "Pechuga de Pollo",
        "category": "proteins",
        "calories_per_100g": 165,
        "protein_per_100g": 31,
        "carbs_per_100g": 0,
        "fats_per_100g": 3.6,
        "fiber_per_100g": 0
    }
    """
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
            name_es=data.get('name_es', '').strip() or None,
            category=data.get('category', 'other'),
            calories_per_100g=float(data.get('calories_per_100g', 0)),
            protein_per_100g=float(data.get('protein_per_100g', 0)),
            carbs_per_100g=float(data.get('carbs_per_100g', 0)),
            fats_per_100g=float(data.get('fats_per_100g', 0)),
            fiber_per_100g=float(data.get('fiber_per_100g', 0)) if data.get('fiber_per_100g') else None,
            yolo_detectable=data.get('yolo_detectable', False),
            yolo_class_name=data.get('yolo_class_name'),
            is_verified=user.is_nutritionist(),
            verified_by_id=user.id if user.is_nutritionist() else None
        )
        
        db.session.add(ingredient)
        db.session.commit()
        
        # Clear cache
        cache.clear()
        
        return jsonify({
            'message': 'Ingredient created successfully',
            'ingredient': ingredient.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create ingredient: {str(e)}'}), 500