# app/models/recipe.py

from datetime import datetime
from app import db

class Recipe(db.Model):
    """Recipe model with dynamic macro calculation"""
    
    __tablename__ = 'recipes'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Basic Information
    name = db.Column(db.String(255), nullable=False, index=True)
    name_es = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    
    # Category
    category = db.Column(db.String(50), nullable=False, index=True)
    # Categories: 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'
    
    # Recipe Details
    instructions = db.Column(db.Text, nullable=False)
    prep_time_minutes = db.Column(db.Integer, nullable=True)
    cook_time_minutes = db.Column(db.Integer, nullable=True)
    servings = db.Column(db.Integer, nullable=False, default=1)
    
    # Media
    image_url = db.Column(db.String(500), nullable=True)
    video_url = db.Column(db.String(500), nullable=True)
    
    # Recipe Metadata
    difficulty = db.Column(db.String(20), nullable=True)  # 'easy', 'medium', 'hard'
    cuisine_type = db.Column(db.String(50), nullable=True)  # 'mexican', 'italian', etc.
    
    # Created by
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Verification & Quality
    is_verified = db.Column(db.Boolean, default=False, nullable=False, index=True)
    is_published = db.Column(db.Boolean, default=True, nullable=False, index=True)
    
    # Soft Delete
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Usage & Popularity
    view_count = db.Column(db.Integer, default=0, nullable=False)
    favorite_count = db.Column(db.Integer, default=0, nullable=False)
    last_viewed_at = db.Column(db.DateTime, nullable=True)
    
    # Tags (for filtering)
    tags = db.Column(db.String(500), nullable=True)  # Comma-separated: 'vegetarian,high-protein,low-carb'
    
    # Relationships
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    recipe_ingredients = db.relationship(
        'RecipeIngredient', 
        backref='recipe', 
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by='RecipeIngredient.order_index'
    )
    
    meal_logs = db.relationship(
        'MealLog', 
        backref='recipe', 
        lazy='dynamic'
    )
    
    def __repr__(self):
        return f'<Recipe {self.name}>'
    
    # Soft Delete Methods
    def soft_delete(self):
        """Soft delete recipe"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.is_published = False
        db.session.commit()
    
    def restore(self):
        """Restore soft-deleted recipe"""
        self.is_deleted = False
        self.deleted_at = None
        db.session.commit()
    
    # Publishing Methods
    def publish(self):
        """Publish recipe"""
        self.is_published = True
        db.session.commit()
    
    def unpublish(self):
        """Unpublish recipe"""
        self.is_published = False
        db.session.commit()
    
    # Usage Tracking
    def increment_view(self):
        """Track recipe views"""
        self.view_count += 1
        self.last_viewed_at = datetime.utcnow()
        db.session.commit()
    
    # Macro Calculation (Dynamic - NOT Stored)
    def calculate_macros(self, servings=None):
        """
        Calculate nutritional macros dynamically from ingredients.
        This ensures data is always current and never stale.
        """
        if servings is None:
            servings = self.servings
        
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fats = 0
        total_fiber = 0
        
        # Sum up all ingredients
        for recipe_ingredient in self.recipe_ingredients:
            ingredient = recipe_ingredient.ingredient
            quantity_grams = recipe_ingredient.quantity_grams
            
            if ingredient and quantity_grams:
                multiplier = quantity_grams / 100.0
                total_calories += ingredient.calories_per_100g * multiplier
                total_protein += ingredient.protein_per_100g * multiplier
                total_carbs += ingredient.carbs_per_100g * multiplier
                total_fats += ingredient.fats_per_100g * multiplier
                if ingredient.fiber_per_100g:
                    total_fiber += ingredient.fiber_per_100g * multiplier
        
        # Calculate per serving
        per_serving = {
            'calories': round(total_calories / servings, 1),
            'protein': round(total_protein / servings, 1),
            'carbs': round(total_carbs / servings, 1),
            'fats': round(total_fats / servings, 1),
            'fiber': round(total_fiber / servings, 1)
        }
        
        # Calculate totals
        totals = {
            'calories': round(total_calories, 1),
            'protein': round(total_protein, 1),
            'carbs': round(total_carbs, 1),
            'fats': round(total_fats, 1),
            'fiber': round(total_fiber, 1)
        }
        
        return {
            'per_serving': per_serving,
            'total': totals,
            'servings': servings
        }
    
    def get_total_time(self):
        """Get total preparation time"""
        prep = self.prep_time_minutes or 0
        cook = self.cook_time_minutes or 0
        return prep + cook
    
    def get_tags_list(self):
        """Get tags as list"""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',')]
        return []
    
    def has_tag(self, tag):
        """Check if recipe has a specific tag"""
        return tag in self.get_tags_list()
    
    def to_dict(self, include_ingredients=True, include_macros=True):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'name': self.name,
            'name_es': self.name_es,
            'description': self.description,
            'category': self.category,
            'instructions': self.instructions,
            'prep_time_minutes': self.prep_time_minutes,
            'cook_time_minutes': self.cook_time_minutes,
            'total_time_minutes': self.get_total_time(),
            'servings': self.servings,
            'image_url': self.image_url,
            'difficulty': self.difficulty,
            'cuisine_type': self.cuisine_type,
            'tags': self.get_tags_list(),
            'is_verified': self.is_verified,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_ingredients:
            data['ingredients'] = [
                ri.to_dict() for ri in self.recipe_ingredients.all()
            ]
        
        if include_macros:
            data['nutritional_info'] = self.calculate_macros()
        
        return data
    
    @staticmethod
    def get_active_query():
        """Query helper to exclude soft-deleted recipes"""
        return Recipe.query.filter_by(is_deleted=False)
    
    @staticmethod
    def get_published_query():
        """Query helper to get only published recipes"""
        return Recipe.query.filter_by(is_deleted=False, is_published=True)