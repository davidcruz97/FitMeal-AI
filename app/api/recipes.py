# app/api/recipes.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, cache, limiter
from app.models.recipe import Recipe
from app.models.ingredient import Ingredient
from app.models.meal_scan import RecipeIngredient
from app.models.user import User
import time

bp = Blueprint('api_recipes', __name__)


@bp.route('/match', methods=['POST'])
@limiter.limit("50 per minute")
def match_recipes():
    """
    Find recipes that match given ingredients
    
    Request body:
    {
        "ingredient_ids": [1, 5, 8],
        "max_results": 10
    }
    
    Returns recipes sorted by match score (percentage of ingredients matched)
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        
        if not data or not data.get('ingredient_ids'):
            logger.warning("❌ Recipe match failed: No ingredient_ids provided")
            return jsonify({'error': 'ingredient_ids is required'}), 400
        
        ingredient_ids = data.get('ingredient_ids', [])
        max_results = min(int(data.get('max_results', 10)), 50)
        
        if not isinstance(ingredient_ids, list) or len(ingredient_ids) == 0:
            logger.warning(f"❌ Recipe match failed: Invalid ingredient_ids: {ingredient_ids}")
            return jsonify({'error': 'ingredient_ids must be a non-empty list'}), 400
        
        logger.info(f"🔍 Matching recipes for {len(ingredient_ids)} ingredients: {ingredient_ids}")
        
        start_time = time.time()
        
        # Get all published recipes
        recipes = Recipe.get_published_query().all()
        logger.debug(f"   Found {len(recipes)} published recipes to check")
        
        # Calculate match score for each recipe
        recipe_matches = []
        
        for recipe in recipes:
            # Get all ingredient IDs for this recipe
            recipe_ingredient_ids = [
                ri.ingredient_id 
                for ri in recipe.recipe_ingredients 
                if ri.ingredient_type == 'main'  # Only count main ingredients
            ]
            
            if not recipe_ingredient_ids:
                continue
            
            # Calculate match
            matched_ingredients = set(ingredient_ids) & set(recipe_ingredient_ids)
            match_count = len(matched_ingredients)
            total_required = len(recipe_ingredient_ids)
            match_percentage = (match_count / total_required) * 100
            
            # Only include recipes with at least 30% match
            if match_percentage >= 30:
                recipe_matches.append({
                    'recipe': recipe.to_dict(include_ingredients=True, include_macros=True),
                    'match_score': round(match_percentage, 1),
                    'matched_ingredients': match_count,
                    'total_ingredients': total_required,
                    'missing_ingredients': total_required - match_count
                })
        
        # Sort by match score (highest first)
        recipe_matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Limit results
        recipe_matches = recipe_matches[:max_results]
        
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(
            f"✅ Recipe matching complete: {len(recipe_matches)} matches found | "
            f"Processing time: {processing_time:.0f}ms"
        )
        
        if recipe_matches:
            logger.debug(
                f"   Top matches: " + 
                ", ".join([f"{m['recipe']['name']} ({m['match_score']}%)" 
                          for m in recipe_matches[:3]])
            )
        
        return jsonify({
            'matches': recipe_matches,
            'total_matches': len(recipe_matches),
            'query_ingredients': len(ingredient_ids)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Recipe matching failed: {e}", exc_info=True)
        return jsonify({'error': f'Recipe matching failed: {str(e)}'}), 500


@bp.route('', methods=['GET'])
@limiter.limit("100 per minute")
@cache.cached(timeout=600, query_string=True)  # Cache for 10 minutes
def list_recipes():
    """
    List all recipes with filtering and pagination
    
    Query params:
        page: page number (default: 1)
        per_page: items per page (default: 20, max: 50)
        category: filter by category (breakfast, lunch, dinner, snack)
        tag: filter by tag
        search: search in recipe name
    """
    logger = current_app.logger
    
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 50)
        category = request.args.get('category', '').strip()
        tag = request.args.get('tag', '').strip()
        search = request.args.get('search', '').strip()
        
        logger.debug(
            f"📖 Listing recipes: Page {page} | Category: {category or 'all'} | "
            f"Tag: {tag or 'none'} | Search: {search or 'none'}"
        )
        
        # Build query
        query = Recipe.get_published_query()
        
        if category:
            query = query.filter_by(category=category)
        
        if tag:
            query = query.filter(Recipe.tags.like(f'%{tag}%'))
        
        if search:
            query = query.filter(Recipe.name.ilike(f'%{search}%'))
        
        # Order by creation date (newest first)
        query = query.order_by(Recipe.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        logger.info(
            f"✅ Retrieved recipes: {len(pagination.items)} recipes | "
            f"Page {page}/{pagination.pages} | Total: {pagination.total}"
        )
        
        return jsonify({
            'recipes': [recipe.to_dict(include_ingredients=False, include_macros=False) for recipe in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to list recipes: {e}", exc_info=True)
        return jsonify({'error': f'Failed to list recipes: {str(e)}'}), 500


@bp.route('/<int:recipe_id>', methods=['GET'])
@limiter.limit("100 per minute")
def get_recipe(recipe_id):
    """
    Get recipe details by ID with full nutritional info
    
    Query params:
        servings: calculate macros for specific servings (optional)
    """
    logger = current_app.logger
    
    try:
        recipe = Recipe.query.get(recipe_id)
        
        if not recipe or not recipe.is_published:
            logger.warning(f"⚠️ Recipe not found: {recipe_id}")
            return jsonify({'error': 'Recipe not found'}), 404
        
        # Get servings from query param
        servings = request.args.get('servings', type=int)
        
        # Get recipe dict
        recipe_data = recipe.to_dict(include_ingredients=True, include_macros=False)
        
        # Calculate macros with custom servings if provided
        if servings:
            recipe_data['nutritional_info'] = recipe.calculate_macros(servings)
            logger.debug(f"📊 Calculated macros for {servings} servings")
        else:
            recipe_data['nutritional_info'] = recipe.calculate_macros()
        
        logger.info(
            f"✅ Retrieved recipe: {recipe.name} (ID: {recipe_id}) | "
            f"Category: {recipe.category}"
        )
        
        return jsonify({
            'recipe': recipe_data
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get recipe {recipe_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get recipe: {str(e)}'}), 500


@bp.route('/categories', methods=['GET'])
@cache.cached(timeout=3600)  # Cache for 1 hour
def get_categories():
    """Get all recipe categories with counts"""
    logger = current_app.logger
    
    try:
        categories = db.session.query(
            Recipe.category,
            db.func.count(Recipe.id).label('count')
        ).filter_by(
            is_published=True
        ).group_by(
            Recipe.category
        ).all()
        
        logger.debug(f"📚 Retrieved {len(categories)} recipe categories")
        
        return jsonify({
            'categories': [
                {
                    'name': cat.category,
                    'count': cat.count
                }
                for cat in categories
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get categories: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get categories: {str(e)}'}), 500


@bp.route('/tags', methods=['GET'])
@cache.cached(timeout=3600)  # Cache for 1 hour
def get_tags():
    """Get all unique recipe tags"""
    logger = current_app.logger
    
    try:
        recipes = Recipe.get_published_query().filter(Recipe.tags.isnot(None)).all()
        
        all_tags = set()
        for recipe in recipes:
            tags = recipe.get_tags_list()
            all_tags.update(tags)
        
        logger.debug(f"🏷️ Retrieved {len(all_tags)} unique tags")
        
        return jsonify({
            'tags': sorted(list(all_tags))
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get tags: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get tags: {str(e)}'}), 500


# Admin endpoints
@bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")
def create_recipe():
    """
    Create new recipe (admin/nutritionist only)
    
    Request body:
    {
        "name": "Grilled Chicken Salad",
        "category": "lunch",
        "instructions": "1. Grill chicken...",
        "prep_time_minutes": 15,
        "servings": 2,
        "ingredients": [
            {
                "ingredient_id": 6,
                "quantity": 1,
                "unit": "breast",
                "quantity_grams": 200,
                "ingredient_type": "main"
            }
        ]
    }
    """
    logger = current_app.logger
    
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or not user.is_nutritionist():
            logger.warning(
                f"🚫 Recipe creation denied: User {user_id} is not a nutritionist"
            )
            return jsonify({'error': 'Nutritionist access required'}), 403
        
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('instructions'):
            logger.warning(f"❌ Recipe creation failed: Missing required fields [User: {user_id}]")
            return jsonify({'error': 'Name and instructions are required'}), 400
        
        recipe_name = data.get('name').strip()
        logger.info(f"🍳 Creating recipe: {recipe_name} [User: {user.email}]")
        
        # Create recipe
        recipe = Recipe(
            name=recipe_name,
            category=data.get('category', 'lunch'),
            instructions=data.get('instructions').strip(),
            prep_time_minutes=data.get('prep_time_minutes'),
            cook_time_minutes=data.get('cook_time_minutes'),
            servings=data.get('servings', 1),
            difficulty=data.get('difficulty'),
            tags=data.get('tags'),
            created_by_id=user.id,
            is_published=data.get('is_published', True)
        )
        
        db.session.add(recipe)
        db.session.flush()  # Get recipe ID
        
        # Add ingredients
        ingredients_data = data.get('ingredients', [])
        logger.debug(f"   Adding {len(ingredients_data)} ingredients")
        
        for idx, ing_data in enumerate(ingredients_data):
            recipe_ingredient = RecipeIngredient(
                recipe_id=recipe.id,
                ingredient_id=ing_data['ingredient_id'],
                quantity=ing_data['quantity'],
                unit=ing_data.get('unit', 'g'),
                quantity_grams=ing_data.get('quantity_grams', ing_data['quantity']),
                ingredient_type=ing_data.get('ingredient_type', 'main'),
                preparation_note=ing_data.get('preparation_note'),
                order_index=idx
            )
            db.session.add(recipe_ingredient)
        
        db.session.commit()
        
        # Clear cache
        cache.clear()
        
        logger.info(
            f"✅ Recipe created successfully: {recipe_name} (ID: {recipe.id}) | "
            f"Category: {recipe.category} | Ingredients: {len(ingredients_data)} [User: {user.email}]"
        )
        
        return jsonify({
            'message': 'Recipe created successfully',
            'recipe': recipe.to_dict(include_ingredients=True, include_macros=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to create recipe: {e}", exc_info=True)
        return jsonify({'error': f'Failed to create recipe: {str(e)}'}), 500