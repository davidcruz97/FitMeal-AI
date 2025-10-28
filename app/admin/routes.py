# app/admin/routes.py
from flask import render_template, request, redirect, url_for, flash, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename
from app.admin import bp
from app import db
from app.admin.forms import RecipeForm, IngredientForm
from app.models.user import User
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.meal_scan import RecipeIngredient
from functools import wraps
import os
from datetime import datetime
import logging

# Set up logger for this module
logger = logging.getLogger(__name__)

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is logged in via session
        from flask import session
        if 'user_id' not in session:
            flash('Please login to access admin panel', 'error')
            return redirect(url_for('admin.login'))
        
        user = User.query.get(session['user_id'])
        if not user or not user.is_nutritionist():
            flash('You do not have permission to access this page', 'error')
            return redirect(url_for('admin.login'))
        
        return f(*args, **kwargs)
    return decorated_function


# ==================== AUTHENTICATION ====================

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """Admin login page"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        
        user = User.query.filter_by(email=email, is_deleted=False).first()
        
        if user and user.check_password(password) and user.is_nutritionist():
            from flask import session
            session['user_id'] = user.id
            session['user_name'] = user.full_name
            session['user_email'] = user.email
            user.update_last_login()
            
            flash(f'Welcome back, {user.full_name}!', 'success')
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Invalid credentials or insufficient permissions', 'error')
    
    return render_template('auth/login.html')


@bp.route('/logout')
@admin_required
def logout():
    """Admin logout"""
    from flask import session
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('admin.login'))


# ==================== DASHBOARD ====================

@bp.route('/')
@bp.route('/dashboard')
@admin_required
def dashboard():
    """Admin dashboard with statistics"""
    logger = current_app.logger
    
    # Get statistics
    total_recipes = Recipe.get_active_query().count()
    published_recipes = Recipe.get_published_query().count()
    total_ingredients = Ingredient.get_active_query().count()
    verified_ingredients = Ingredient.get_verified_query().count()
    total_users = User.get_active_query().filter_by(user_type='user').count()
    
    # Recent recipes
    recent_recipes = Recipe.get_active_query().order_by(
        Recipe.created_at.desc()
    ).limit(5).all()
    
    # Popular recipes
    popular_recipes = Recipe.get_published_query().order_by(
        Recipe.view_count.desc()
    ).limit(5).all()
    
    logger.info(f"📊 Admin dashboard accessed | Recipes: {total_recipes} | Ingredients: {total_ingredients}")
    
    # Create stats dictionary for the template
    stats = {
        'total_users': total_users,
        'total_recipes': total_recipes,
        'published_recipes': published_recipes,
        'total_ingredients': total_ingredients,
        'verified_ingredients': verified_ingredients
    }
    
    return render_template('admin/dashboard.html',
                         stats=stats,
                         recent_recipes=recent_recipes,
                         popular_recipes=popular_recipes)

# ==================== USER MANAGEMENT ====================

@bp.route('/users')
@admin_required
def users():
    """List all users"""
    page = request.args.get('page', 1, type=int)
    
    query = User.get_active_query().filter_by(user_type='user')
    query = query.order_by(User.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=20, error_out=False)
    
    return render_template('admin/users.html',
                         users=pagination.items,
                         pagination=pagination)

# ==================== RECIPE MANAGEMENT ====================

@bp.route('/recipes')
@admin_required
def recipes():
    """List all recipes with filtering"""
    page = request.args.get('page', 1, type=int)
    category = request.args.get('category', '')
    search = request.args.get('search', '')
    
    query = Recipe.get_active_query()
    
    if category:
        query = query.filter_by(category=category)
    
    if search:
        query = query.filter(Recipe.name.ilike(f'%{search}%'))
    
    query = query.order_by(Recipe.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=20, error_out=False)
    
    return render_template('admin/recipes.html',
                         recipes=pagination.items,
                         pagination=pagination,
                         category=category,
                         search=search)


@bp.route('/recipes/create', methods=['GET', 'POST'])
@admin_required
def recipe_create():
    """Create new recipe"""
    logger = current_app.logger
    from flask import session
    
    if request.method == 'POST':
        try:
            # Get form data
            name = request.form.get('name', '').strip()
            name_es = request.form.get('name_es', '').strip()
            category = request.form.get('category', 'lunch')
            description = request.form.get('description', '').strip()
            instructions = request.form.get('instructions', '').strip()
            prep_time = request.form.get('prep_time_minutes', type=int)
            cook_time = request.form.get('cook_time_minutes', type=int)
            servings = request.form.get('servings', 1, type=int)
            difficulty = request.form.get('difficulty', 'medium')
            tags = request.form.get('tags', '').strip()
            is_published = request.form.get('is_published') == 'on'
            
            # Validation
            if not name or not instructions:
                flash('Recipe name and instructions are required', 'error')
                return redirect(url_for('admin.recipe_create'))
            
            # Create recipe
            recipe = Recipe(
                name=name,
                name_es=name_es or None,
                category=category,
                description=description or None,
                instructions=instructions,
                prep_time_minutes=prep_time,
                cook_time_minutes=cook_time,
                servings=servings,
                difficulty=difficulty,
                tags=tags or None,
                created_by_id=session['user_id'],
                is_verified=True,
                is_published=is_published
            )
            
            db.session.add(recipe)
            db.session.flush()
            
            # Handle image upload
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename:
                    # Validate file extension
                    allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
                    filename = secure_filename(file.filename)
                    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
                    
                    if file_ext in allowed_extensions:
                        # Generate unique filename
                        import uuid
                        unique_filename = f"recipe_{recipe.id}_{uuid.uuid4().hex[:8]}.{file_ext}"
                        
                        # Save file
                        upload_folder = current_app.config['UPLOAD_FOLDER']
                        recipe_folder = os.path.join(upload_folder, 'recipes')
                        os.makedirs(recipe_folder, exist_ok=True)
                        
                        filepath = os.path.join(recipe_folder, unique_filename)
                        file.save(filepath)
                        
                        # Update recipe with image URL
                        recipe.image_url = f'/static/uploads/recipes/{unique_filename}'
                        
                        logger.info(f"📸 Image saved: {unique_filename} for recipe {recipe.id}")
                    else:
                        logger.warning(f"⚠️ Invalid image format: {file_ext} (allowed: {allowed_extensions})")
                        flash('Invalid image format. Please use JPG, PNG, or WebP', 'warning')
            
            # Add ingredients
            ingredient_ids = request.form.getlist('ingredient_id[]')
            quantities = request.form.getlist('quantity[]')
            units = request.form.getlist('unit[]')
            types = request.form.getlist('ingredient_type[]')
            
            for idx, ing_id in enumerate(ingredient_ids):
                if ing_id and quantities[idx]:
                    # Get ingredient first
                    ingredient = Ingredient.query.get(int(ing_id))
                    quantity_grams = convert_to_grams(float(quantities[idx]), units[idx], ingredient)

                    recipe_ingredient = RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=int(ing_id),
                        quantity=float(quantities[idx]),
                        unit=units[idx],
                        quantity_grams=quantity_grams,
                        ingredient_type=types[idx] if idx < len(types) else 'main',
                        order_index=idx
                    )
                    db.session.add(recipe_ingredient)
            
            db.session.commit()
            
            logger.info(f"✅ Recipe created: {name} (ID: {recipe.id})")
            flash(f'Recipe "{name}" created successfully!', 'success')
            
            return redirect(url_for('admin.recipe_view', recipe_id=recipe.id))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Failed to create recipe: {e}", exc_info=True)
            flash(f'Error creating recipe: {str(e)}', 'error')
            return redirect(url_for('admin.recipe_create'))
    
    # GET request - show form
    ingredients = Ingredient.get_active_query().order_by(Ingredient.name).all()
    form = RecipeForm()
    return render_template('admin/recipe_form.html', 
                         recipe=None,
                         form=form,
                         ingredients=ingredients)


@bp.route('/recipes/<int:recipe_id>')
@admin_required
def recipe_view(recipe_id):
    """View recipe details"""
    recipe = Recipe.query.get_or_404(recipe_id)
    
    if recipe.is_deleted:
        flash('Recipe not found', 'error')
        return redirect(url_for('admin.recipes'))
    
    # Calculate nutritional info
    nutritional_info = recipe.calculate_macros()
    
    ingredients = Ingredient.get_active_query().order_by(Ingredient.name).all()
    
    return render_template('admin/recipe_form.html',
                     recipe=recipe,
                     nutritional_info=nutritional_info,
                     ingredients=ingredients,
                     form=None,
                     view_mode=True)


@bp.route('/recipes/<int:recipe_id>/edit', methods=['GET', 'POST'])
@admin_required
def recipe_edit(recipe_id):
    """Edit existing recipe"""
    logger = current_app.logger
    from flask import session
    
    recipe = Recipe.query.get_or_404(recipe_id)
    
    if recipe.is_deleted:
        flash('Recipe not found', 'error')
        return redirect(url_for('admin.recipes'))
    
    if request.method == 'POST':
        try:
            # Update fields
            recipe.name = request.form.get('name', '').strip()
            recipe.name_es = request.form.get('name_es', '').strip() or None
            recipe.category = request.form.get('category', 'lunch')
            recipe.description = request.form.get('description', '').strip() or None
            recipe.instructions = request.form.get('instructions', '').strip()
            recipe.prep_time_minutes = request.form.get('prep_time_minutes', type=int)
            recipe.cook_time_minutes = request.form.get('cook_time_minutes', type=int)
            recipe.servings = request.form.get('servings', 1, type=int)
            recipe.difficulty = request.form.get('difficulty', 'medium')
            recipe.tags = request.form.get('tags', '').strip() or None
            recipe.is_published = request.form.get('is_published') == 'on'
            
            # Handle image upload
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename:
                    # Validate file extension
                    allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
                    filename = secure_filename(file.filename)
                    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
                    
                    if file_ext in allowed_extensions:
                        # Generate unique filename
                        import uuid
                        unique_filename = f"recipe_{recipe.id}_{uuid.uuid4().hex[:8]}.{file_ext}"
                        
                        # Save file
                        upload_folder = current_app.config['UPLOAD_FOLDER']
                        recipe_folder = os.path.join(upload_folder, 'recipes')
                        os.makedirs(recipe_folder, exist_ok=True)
                        
                        filepath = os.path.join(recipe_folder, unique_filename)
                        file.save(filepath)
                        
                        # Delete old image if exists
                        if recipe.image_url:
                            old_image_path = os.path.join(current_app.root_path, recipe.image_url.lstrip('/'))
                            if os.path.exists(old_image_path):
                                try:
                                    os.remove(old_image_path)
                                    logger.info(f"🗑️ Deleted old image: {recipe.image_url}")
                                except Exception as e:
                                    logger.warning(f"⚠️ Could not delete old image: {e}")
                        
                        # Update recipe with new image URL
                        recipe.image_url = f'/static/uploads/recipes/{unique_filename}'
                        
                        logger.info(f"📸 Image saved: {unique_filename} for recipe {recipe.id}")
                    else:
                        logger.warning(f"⚠️ Invalid image format: {file_ext} (allowed: {allowed_extensions})")
                        flash('Invalid image format. Please use JPG, PNG, or WebP', 'warning')
            
            # Remove old ingredients
            RecipeIngredient.query.filter_by(recipe_id=recipe.id).delete()
            
            # Add updated ingredients
            ingredient_ids = request.form.getlist('ingredient_id[]')
            quantities = request.form.getlist('quantity[]')
            units = request.form.getlist('unit[]')
            types = request.form.getlist('ingredient_type[]')
            
            for idx, ing_id in enumerate(ingredient_ids):
                if ing_id and quantities[idx]:
                    # Get ingredient first
                    ingredient = Ingredient.query.get(int(ing_id))
                    quantity_grams = convert_to_grams(float(quantities[idx]), units[idx], ingredient)
                    
                    recipe_ingredient = RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=int(ing_id),
                        quantity=float(quantities[idx]),
                        unit=units[idx],
                        quantity_grams=quantity_grams,
                        ingredient_type=types[idx] if idx < len(types) else 'main',
                        order_index=idx
                    )
                    db.session.add(recipe_ingredient)
            
            db.session.commit()
            
            logger.info(f"✅ Recipe updated: {recipe.name} (ID: {recipe.id})")
            flash(f'Recipe "{recipe.name}" updated successfully!', 'success')
            
            return redirect(url_for('admin.recipe_view', recipe_id=recipe.id))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Failed to update recipe {recipe_id}: {e}", exc_info=True)
            flash(f'Error updating recipe: {str(e)}', 'error')
    
    # GET request - show form
    ingredients = Ingredient.get_active_query().order_by(Ingredient.name).all()
    form = RecipeForm(obj=recipe)
    return render_template('admin/recipe_form.html',
                         recipe=recipe,
                         form=form,
                         ingredients=ingredients)


@bp.route('/recipes/<int:recipe_id>/delete', methods=['POST'])
@admin_required
def recipe_delete(recipe_id):
    """Delete recipe permanently (hard delete)"""
    logger = current_app.logger
    from flask import session
    
    recipe = Recipe.query.get_or_404(recipe_id)
    
    try:
        recipe_name = recipe.name
        
        # Delete associated image if exists
        if recipe.image_url:
            image_path = os.path.join(current_app.root_path, recipe.image_url.lstrip('/'))
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                    logger.info(f"🗑️ Deleted recipe image: {recipe.image_url}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not delete image: {e}")
        
        # Delete recipe (cascade will delete recipe_ingredients automatically)
        db.session.delete(recipe)
        db.session.commit()
        
        logger.info(f"🗑️ Recipe deleted permanently: {recipe_name} (ID: {recipe_id})")
        flash(f'Recipe "{recipe_name}" deleted successfully', 'success')
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to delete recipe {recipe_id}: {e}", exc_info=True)
        flash(f'Error deleting recipe: {str(e)}', 'error')
    
    return redirect(url_for('admin.recipes'))


@bp.route('/recipes/<int:recipe_id>/toggle-publish', methods=['POST'])
@admin_required
def toggle_publish_recipe(recipe_id):
    """Toggle recipe published status"""
    recipe = Recipe.query.get_or_404(recipe_id)
    
    try:
        if recipe.is_published:
            recipe.unpublish()
            flash(f'Recipe "{recipe.name}" unpublished', 'info')
        else:
            recipe.publish()
            flash(f'Recipe "{recipe.name}" published', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error: {str(e)}', 'error')
    
    return redirect(url_for('admin.recipe_view', recipe_id=recipe_id))


# ==================== INGREDIENT MANAGEMENT ====================

def convert_to_grams(quantity, unit, ingredient=None):
    """
    Convert various units to grams for nutritional calculations
    Uses ingredient serving size when available
    """
    unit = unit.lower().strip()
    
    # Already in grams
    if unit in ['g', 'gram', 'grams']:
        return quantity
    
    # Use ingredient's serving size if unit matches
    if ingredient and ingredient.serving_size_grams and ingredient.serving_size_unit:
        if unit == ingredient.serving_size_unit.lower():
            return quantity * ingredient.serving_size_grams
    
    # Volume to weight (approximate)
    if unit in ['ml', 'milliliter', 'milliliters']:
        return quantity
    
    if unit in ['cup', 'cups']:
        return quantity * 240
    
    if unit in ['tbsp', 'tablespoon', 'tablespoons']:
        return quantity * 15
    
    if unit in ['tsp', 'teaspoon', 'teaspoons', 'tea spoon']:
        return quantity * 5
    
    # Common units
    if unit in ['scoop', 'scoops']:
        return quantity * 30
    
    # Generic units (use ingredient-specific if available)
    if unit in ['unit', 'units', 'piece', 'pieces']:
        if ingredient:
            name_lower = ingredient.name.lower()
            if 'egg' in name_lower:
                return quantity * 50
            elif 'bread' in name_lower or 'slice' in name_lower:
                return quantity * 30
        return quantity * 100  # Default
    
    # Default: assume 100g per unit
    return quantity * 100

@bp.route('/ingredients')
@admin_required
def ingredients():
    """List all ingredients"""
    page = request.args.get('page', 1, type=int)
    category = request.args.get('category', '')
    search = request.args.get('search', '')
    
    query = Ingredient.get_active_query()
    
    if category:
        query = query.filter_by(category=category)
    
    if search:
        query = query.filter(
            db.or_(
                Ingredient.name.ilike(f'%{search}%'),
                Ingredient.name_es.ilike(f'%{search}%')
            )
        )
    
    query = query.order_by(Ingredient.name)
    
    pagination = query.paginate(page=page, per_page=50, error_out=False)
    
    return render_template('admin/ingredients.html',
                     ingredients=pagination.items,
                     pagination=pagination,
                     category=category,
                     search=search,
                     form=IngredientForm())


@bp.route('/ingredients/create', methods=['POST'])
@admin_required
def ingredient_create():
    """Create new ingredient"""
    logger = current_app.logger
    from flask import session
    
    try:
        name = request.form.get('name', '').strip()
        name_es = request.form.get('name_es', '').strip()
        category = request.form.get('category', 'other')
        
        if not name:
            flash('Ingredient name is required', 'error')
            return redirect(url_for('admin.ingredients'))
        
        ingredient = Ingredient(
            name=name,
            name_es=name_es or None,
            category=category,
            calories_per_100g=float(request.form.get('calories_per_100g', 0)),
            protein_per_100g=float(request.form.get('protein_per_100g', 0)),
            carbs_per_100g=float(request.form.get('carbs_per_100g', 0)),
            fats_per_100g=float(request.form.get('fats_per_100g', 0)),
            fiber_per_100g=float(request.form.get('fiber_per_100g') or 0) or None,
            yolo_detectable=request.form.get('yolo_detectable') == 'on',
            yolo_class_name=request.form.get('yolo_class_name', '').strip() or None,
            is_verified=True,
            verified_by_id=session['user_id']
        )
        
        db.session.add(ingredient)
        db.session.commit()
        
        logger.info(f"✅ Ingredient created: {name} (ID: {ingredient.id})")
        flash(f'Ingredient "{name}" created successfully!', 'success')
        
        return redirect(url_for('admin.ingredients'))
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to create ingredient: {e}", exc_info=True)
        flash(f'Error creating ingredient: {str(e)}', 'error')
        return redirect(url_for('admin.ingredients'))


@bp.route('/ingredients/<int:ingredient_id>/update', methods=['POST'])
@admin_required
def ingredient_update(ingredient_id):
    """Update existing ingredient"""
    logger = current_app.logger
    
    ingredient = Ingredient.query.get_or_404(ingredient_id)
    
    try:
        ingredient.name = request.form.get('name', '').strip()
        ingredient.name_es = request.form.get('name_es', '').strip() or None
        ingredient.category = request.form.get('category', 'other')
        ingredient.calories_per_100g = float(request.form.get('calories_per_100g', 0))
        ingredient.protein_per_100g = float(request.form.get('protein_per_100g', 0))
        ingredient.carbs_per_100g = float(request.form.get('carbs_per_100g', 0))
        ingredient.fats_per_100g = float(request.form.get('fats_per_100g', 0))
        ingredient.fiber_per_100g = float(request.form.get('fiber_per_100g') or 0) or None
        ingredient.yolo_detectable = request.form.get('yolo_detectable') == 'on'
        ingredient.yolo_class_name = request.form.get('yolo_class_name', '').strip() or None
        
        db.session.commit()
        
        logger.info(f"✅ Ingredient updated: {ingredient.name} (ID: {ingredient_id})")
        flash(f'Ingredient "{ingredient.name}" updated successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to update ingredient {ingredient_id}: {e}", exc_info=True)
        flash(f'Error updating ingredient: {str(e)}', 'error')
    
    return redirect(url_for('admin.ingredients'))


@bp.route('/ingredients/<int:ingredient_id>/delete', methods=['POST'])
@admin_required
def ingredient_delete(ingredient_id):
    """Delete ingredient permanently (hard delete)"""
    logger = current_app.logger
    from flask import session
    
    ingredient = Ingredient.query.get_or_404(ingredient_id)
    
    try:
        ingredient_name = ingredient.name
        
        # Check if ingredient is used in any recipes
        recipe_count = RecipeIngredient.query.filter_by(ingredient_id=ingredient_id).count()
        
        if recipe_count > 0:
            flash(f'Cannot delete "{ingredient_name}" - it is used in {recipe_count} recipe(s). Remove it from recipes first.', 'error')
            return redirect(url_for('admin.ingredients'))
        
        # Delete associated image if exists
        if ingredient.image_url:
            image_path = os.path.join(current_app.root_path, ingredient.image_url.lstrip('/'))
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                    logger.info(f"🗑️ Deleted ingredient image: {ingredient.image_url}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not delete image: {e}")
        
        # Delete ingredient
        db.session.delete(ingredient)
        db.session.commit()
        
        logger.info(f"🗑️ Ingredient deleted permanently: {ingredient_name} (ID: {ingredient_id})")
        flash(f'Ingredient "{ingredient_name}" deleted successfully', 'success')
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to delete ingredient {ingredient_id}: {e}", exc_info=True)
        flash(f'Error deleting ingredient: {str(e)}', 'error')
    
    return redirect(url_for('admin.ingredients'))

@bp.route('/api/ingredients/<int:ingredient_id>/serving')
@admin_required
def get_ingredient_serving(ingredient_id):
    """Get serving size info for an ingredient"""
    ingredient = Ingredient.query.get(ingredient_id)
    
    if not ingredient or ingredient.is_deleted:
        return jsonify({'error': 'Ingredient not found'}), 404
    
    return jsonify({
        'serving_size_grams': ingredient.serving_size_grams,
        'serving_size_unit': ingredient.serving_size_unit,
        'serving_size_description': ingredient.serving_size_description
    })

# ==================== API HELPERS (AJAX) ====================

@bp.route('/api/ingredients/search')
@admin_required
def api_search_ingredients():
    """AJAX endpoint for ingredient autocomplete"""
    query = request.args.get('q', '').strip()
    
    if len(query) < 2:
        return jsonify([])
    
    ingredients = Ingredient.get_active_query().filter(
        db.or_(
            Ingredient.name.ilike(f'%{query}%'),
            Ingredient.name_es.ilike(f'%{query}%')
        )
    ).order_by(Ingredient.name).limit(20).all()
    
    return jsonify([{
        'id': ing.id,
        'name': ing.name,
        'category': ing.category
    } for ing in ingredients])

# ==================== USDA INTEGRATION ====================

@bp.route('/usda/search')
@admin_required
def usda_search():
    """Search USDA food database"""
    from app.admin.usda_api import usda_api
    import requests
    
    query = request.args.get('query', '')
    results = []
    error = None

    if query:
        try:
            results = usda_api.search_foods(query)
        except requests.exceptions.Timeout:
            error = "⏱️ Connection timeout: The USDA API is taking too long to respond. This might be due to network restrictions. Please try again later."
        except requests.exceptions.ConnectionError:
            error = "🔌 Connection error: Unable to reach the USDA API. Please check your network connection."
        except ValueError as e:
            error = str(e)
        except Exception as e:
            error = f"❌ Error searching USDA database: {str(e)}"

    return render_template('admin/usda_search.html',
                           query=query,
                           results=results,
                           error=error)


@bp.route('/usda/import/<int:fdc_id>', methods=['POST'])
@admin_required
def usda_import(fdc_id):
    """Import an ingredient from USDA database"""
    from app.admin.usda_api import usda_api
    from flask import session
    import requests
    
    try:
        # Get current user ID from session
        current_user_id = session.get('user_id')
        
        # Get ingredient data from USDA
        ingredient_data = usda_api.import_to_ingredient(fdc_id)
        
        if not ingredient_data:
            flash('Failed to import ingredient from USDA', 'error')
            return redirect(url_for('admin.usda_search'))
        
        # Check if ingredient already exists (including soft-deleted ones)
        existing = Ingredient.query.filter(
            db.or_(
                Ingredient.name == ingredient_data['name'],
                Ingredient.usda_fdc_id == fdc_id
            )
        ).first()
        
        if existing:
            # Restore if soft-deleted
            if existing.deleted_at:
                existing.deleted_at = None
                existing.is_deleted = False
                logger.info(f"♻️ Restored soft-deleted ingredient: {existing.name}")
            
            # Update with new USDA data
            existing.category = ingredient_data['category']
            existing.calories_per_100g = ingredient_data['calories_per_100g']
            existing.protein_per_100g = ingredient_data['protein_per_100g']
            existing.carbs_per_100g = ingredient_data['carbs_per_100g']
            existing.fats_per_100g = ingredient_data['fats_per_100g']
            existing.fiber_per_100g = ingredient_data.get('fiber_per_100g')
            existing.saturated_fat_per_100g = ingredient_data.get('saturated_fat_per_100g')
            existing.sugar_per_100g = ingredient_data.get('sugar_per_100g')
            existing.sodium_per_100g = ingredient_data.get('sodium_per_100g')
            existing.serving_size_grams = ingredient_data.get('serving_size_grams')
            existing.serving_size_unit = ingredient_data.get('serving_size_unit')
            existing.serving_size_description = ingredient_data.get('serving_size_description')
            existing.usda_fdc_id = fdc_id
            existing.is_verified = True
            existing.verified_by_id = current_user_id
            
            db.session.commit()
            
            logger.info(f"🔄 Updated existing ingredient: {existing.name} (FDC ID: {fdc_id})")
            flash(f'Ingredient "{existing.name}" updated successfully!', 'success')
            
        else:
            # Create new ingredient
            ingredient = Ingredient(
                name=ingredient_data['name'],
                category=ingredient_data['category'],
                calories_per_100g=ingredient_data['calories_per_100g'],
                protein_per_100g=ingredient_data['protein_per_100g'],
                carbs_per_100g=ingredient_data['carbs_per_100g'],
                fats_per_100g=ingredient_data['fats_per_100g'],
                fiber_per_100g=ingredient_data.get('fiber_per_100g'),
                saturated_fat_per_100g=ingredient_data.get('saturated_fat_per_100g'),
                sugar_per_100g=ingredient_data.get('sugar_per_100g'),
                sodium_per_100g=ingredient_data.get('sodium_per_100g'),
                serving_size_grams=ingredient_data.get('serving_size_grams'),
                serving_size_unit=ingredient_data.get('serving_size_unit'),
                serving_size_description=ingredient_data.get('serving_size_description'),
                usda_fdc_id=fdc_id,
                is_verified=True,
                verified_by_id=current_user_id
            )
            
            db.session.add(ingredient)
            db.session.commit()
            
            logger.info(f"✅ USDA ingredient imported: {ingredient.name} (FDC ID: {fdc_id})")
            flash(f'Ingredient "{ingredient.name}" imported successfully!', 'success')
        
        return redirect(url_for('admin.ingredients'))
    
    except requests.exceptions.Timeout:
        db.session.rollback()
        logger.error(f"⏱️ USDA API timeout importing FDC ID {fdc_id}")
        flash('⏱️ Connection timeout: The USDA API is taking too long to respond. Please try again later.', 'error')
        return redirect(url_for('admin.usda_search'))
    
    except requests.exceptions.ConnectionError:
        db.session.rollback()
        logger.error(f"🔌 USDA API connection error importing FDC ID {fdc_id}")
        flash('🔌 Connection error: Unable to reach the USDA API. Please check your network connection.', 'error')
        return redirect(url_for('admin.usda_search'))
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error importing from USDA: {str(e)}", exc_info=True)
        flash(f'Error importing ingredient: {str(e)}', 'error')
        return redirect(url_for('admin.usda_search'))