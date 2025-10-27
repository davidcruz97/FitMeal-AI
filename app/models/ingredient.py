# app/models/ingredient.py
from datetime import datetime
from app import db


class Ingredient(db.Model):
    """Ingredient model with USDA integration and verification"""
    
    __tablename__ = 'ingredients'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Basic Information
    name = db.Column(db.String(255), nullable=False, index=True)
    name_es = db.Column(db.String(255), nullable=True)  # Spanish name
    category = db.Column(db.String(100), nullable=True, index=True)
    # Categories: 'vegetables', 'fruits', 'proteins', 'grains', 'dairy', 'oils', 'other'
    
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
    
    # YOLOv8 Detection
    yolo_detectable = db.Column(db.Boolean, default=False, nullable=False, index=True)
    yolo_class_name = db.Column(db.String(100), nullable=True, index=True)
    yolo_class_id = db.Column(db.Integer, nullable=True)
    
    # Verification & Quality
    is_verified = db.Column(db.Boolean, default=False, nullable=False, index=True)
    # True = Verified from USDA or by nutritionist
    # False = User-added or needs verification
    
    verified_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    
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
    
    # Metadata
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    
    # Relationships
    verified_by = db.relationship('User', foreign_keys=[verified_by_id])
    
    recipe_ingredients = db.relationship(
        'RecipeIngredient', 
        backref='ingredient', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __repr__(self):
        return f'<Ingredient {self.name}>'
    
    # Soft Delete Methods
    def soft_delete(self):
        """Soft delete ingredient"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        db.session.commit()
    
    def restore(self):
        """Restore soft-deleted ingredient"""
        self.is_deleted = False
        self.deleted_at = None
        db.session.commit()
    
    # Verification Methods
    def verify(self, user_id):
        """Mark ingredient as verified"""
        self.is_verified = True
        self.verified_by_id = user_id
        self.verified_at = datetime.utcnow()
        db.session.commit()
    
    # Nutritional Calculations
    def calculate_macros(self, quantity_grams):
        """Calculate macros for a specific quantity"""
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
            'name_es': self.name_es,
            'category': self.category,
            'is_verified': self.is_verified,
            'yolo_detectable': self.yolo_detectable,
            'image_url': self.image_url
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
    def get_active_query():
        """Query helper to exclude soft-deleted ingredients"""
        return Ingredient.query.filter_by(is_deleted=False)
    
    @staticmethod
    def get_verified_query():
        """Query helper to get only verified ingredients"""
        return Ingredient.query.filter_by(is_deleted=False, is_verified=True)
    
    @staticmethod
    def search_by_name(query_string, limit=10):
        """Search ingredients by name (for autocomplete)"""
        return Ingredient.get_active_query().filter(
            db.or_(
                Ingredient.name.ilike(f'%{query_string}%'),
                Ingredient.name_es.ilike(f'%{query_string}%')
            )
        ).order_by(
            Ingredient.name
        ).limit(limit).all()