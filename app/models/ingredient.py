# app/models/ingredient.py
from datetime import datetime
from app import db


class Ingredient(db.Model):
    """Simplified ingredient model with USDA integration"""
    
    __tablename__ = 'ingredients'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Basic Information
    name = db.Column(db.String(255), nullable=False, index=True)
    category = db.Column(db.String(100), nullable=True, index=True)
    # Categories: 'vegetable', 'fruit', 'protein', 'grain', 'dairy', 'oil', 'other'
    
    # USDA Integration
    usda_fdc_id = db.Column(db.Integer, nullable=True, unique=True, index=True)
    usda_data_source = db.Column(db.String(50), nullable=True)  # 'SR Legacy', 'Foundation', etc.
    
    # Nutritional Values (per 100g)
    calories_per_100g = db.Column(db.Float, nullable=False, default=0)
    protein_per_100g = db.Column(db.Float, nullable=False, default=0)
    carbs_per_100g = db.Column(db.Float, nullable=False, default=0)
    fats_per_100g = db.Column(db.Float, nullable=False, default=0)
    fiber_per_100g = db.Column(db.Float, nullable=True)
    
    # Additional Nutritional Info (optional)
    saturated_fat_per_100g = db.Column(db.Float, nullable=True)
    sugar_per_100g = db.Column(db.Float, nullable=True)
    sodium_per_100g = db.Column(db.Float, nullable=True)
    
    # Serving size information (from USDA RACC)
    serving_size_grams = db.Column(db.Float, nullable=True, comment='Standard serving size in grams (RACC)')
    serving_size_unit = db.Column(db.String(50), nullable=True, comment='Unit for serving (racc, cup, tbsp, etc)')
    serving_size_description = db.Column(db.String(200), nullable=True, comment='Human-readable serving description')
    
    # Image URL
    image_url = db.Column(db.String(500), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Relationships
    recipe_ingredients = db.relationship(
        'RecipeIngredient', 
        backref='ingredient', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __repr__(self):
        return f'<Ingredient {self.name}>'
    
    # Nutritional Calculations
    def calculate_macros(self, quantity_grams):
        """
        Calculate macros for a specific quantity
        Uses ONLY quantity_grams (not any other unit)
        """
        multiplier = quantity_grams / 100.0
        return {
            'calories': round(self.calories_per_100g * multiplier, 1),
            'protein': round(self.protein_per_100g * multiplier, 1),
            'carbs': round(self.carbs_per_100g * multiplier, 1),
            'fats': round(self.fats_per_100g * multiplier, 1),
            'fiber': round(self.fiber_per_100g * multiplier, 1) if self.fiber_per_100g else 0
        }
    
    def to_dict(self, include_nutritional=True):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'image_url': self.image_url,
            'serving_size_grams': self.serving_size_grams,
            'serving_size_unit': self.serving_size_unit,
            'serving_size_description': self.serving_size_description
        }
        
        if include_nutritional:
            data['nutritional_info'] = {
                'calories_per_100g': self.calories_per_100g,
                'protein_per_100g': self.protein_per_100g,
                'carbs_per_100g': self.carbs_per_100g,
                'fats_per_100g': self.fats_per_100g,
                'fiber_per_100g': self.fiber_per_100g,
                'sugar_per_100g': self.sugar_per_100g,
                'saturated_fat_per_100g': self.saturated_fat_per_100g,
                'sodium_per_100g': self.sodium_per_100g
            }
        
        return data
    
    @staticmethod
    def search_by_name(query_string, limit=10):
        """Search ingredients by name (for autocomplete)"""
        return Ingredient.query.filter(
            Ingredient.name.ilike(f'%{query_string}%')
        ).order_by(
            Ingredient.name
        ).limit(limit).all()