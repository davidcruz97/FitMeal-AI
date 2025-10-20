# app/models/meal_scan.py

from datetime import datetime
from app import db

class RecipeIngredient(db.Model):
    """Junction table linking recipes to ingredients with quantities"""
    
    __tablename__ = 'recipe_ingredients'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    recipe_id = db.Column(
        db.Integer, 
        db.ForeignKey('recipes.id', ondelete='CASCADE'), 
        nullable=False,
        index=True
    )
    ingredient_id = db.Column(
        db.Integer, 
        db.ForeignKey('ingredients.id', ondelete='CASCADE'), 
        nullable=False,
        index=True
    )
    
    # Quantity Information
    quantity = db.Column(db.Float, nullable=False)  # Numeric quantity
    unit = db.Column(db.String(50), nullable=False)  # 'g', 'ml', 'cup', 'tablespoon', etc.
    quantity_grams = db.Column(db.Float, nullable=False)  # Normalized to grams for calculations
    
    # Ingredient Type
    ingredient_type = db.Column(
        db.String(20), 
        nullable=False, 
        default='main'
    )  # 'main' or 'optional'
    
    # Preparation Notes
    preparation_note = db.Column(db.String(255), nullable=True)
    # Examples: "chopped", "diced", "cooked", "raw", "sliced thin"
    
    # Display Order (for recipe instructions)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    def __repr__(self):
        return f'<RecipeIngredient recipe_id={self.recipe_id} ingredient_id={self.ingredient_id}>'
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'ingredient': self.ingredient.to_dict(include_nutritional=False) if self.ingredient else None,
            'quantity': self.quantity,
            'unit': self.unit,
            'quantity_grams': self.quantity_grams,
            'ingredient_type': self.ingredient_type,
            'preparation_note': self.preparation_note,
            'order_index': self.order_index
        }


class MealScan(db.Model):
    """User scan history - tracks photo uploads and detections"""
    
    __tablename__ = 'meal_scans'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Key
    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id', ondelete='CASCADE'), 
        nullable=False,
        index=True
    )
    
    # Scan Information
    image_path = db.Column(db.String(500), nullable=False)
    image_size_bytes = db.Column(db.Integer, nullable=True)
    
    # Detection Results (stored as JSON)
    detected_ingredients = db.Column(db.JSON, nullable=True)
    # Format: [{"ingredient_id": 1, "confidence": 0.95, "yolo_class": "apple"}, ...]
    
    manual_ingredients = db.Column(db.JSON, nullable=True)
    # Format: [{"ingredient_id": 5, "added_manually": true}, ...]
    
    # Recipe Selection
    selected_recipe_id = db.Column(
        db.Integer, 
        db.ForeignKey('recipes.id', ondelete='SET NULL'), 
        nullable=True
    )
    
    # Processing Status
    processing_status = db.Column(
        db.String(20), 
        nullable=False, 
        default='pending'
    )  # 'pending', 'processing', 'completed', 'failed'
    
    processing_time_ms = db.Column(db.Integer, nullable=True)  # Time taken for detection
    error_message = db.Column(db.Text, nullable=True)
    
    # Soft Delete
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Relationships
    selected_recipe = db.relationship('Recipe', foreign_keys=[selected_recipe_id])
    
    def __repr__(self):
        return f'<MealScan id={self.id} user_id={self.user_id}>'
    
    def soft_delete(self):
        """Soft delete scan"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'image_path': self.image_path,
            'detected_ingredients': self.detected_ingredients,
            'manual_ingredients': self.manual_ingredients,
            'selected_recipe': self.selected_recipe.to_dict(include_ingredients=False, include_macros=False) if self.selected_recipe else None,
            'processing_status': self.processing_status,
            'processing_time_ms': self.processing_time_ms,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_active_query():
        """Query helper to exclude soft-deleted scans"""
        return MealScan.query.filter_by(is_deleted=False)


class MealLog(db.Model):
    """User meal logging - tracks consumed meals"""
    
    __tablename__ = 'meal_logs'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id', ondelete='CASCADE'), 
        nullable=False,
        index=True
    )
    recipe_id = db.Column(
        db.Integer, 
        db.ForeignKey('recipes.id', ondelete='CASCADE'), 
        nullable=False,
        index=True
    )
    scan_id = db.Column(
        db.Integer, 
        db.ForeignKey('meal_scans.id', ondelete='SET NULL'), 
        nullable=True
    )
    
    # Meal Information
    meal_type = db.Column(
        db.String(20), 
        nullable=False,
        index=True
    )  # 'breakfast', 'lunch', 'dinner', 'snack'
    
    servings_consumed = db.Column(db.Float, nullable=False, default=1.0)
    
    # Logged Nutritional Values (snapshot at time of logging)
    calories_logged = db.Column(db.Float, nullable=False)
    protein_logged = db.Column(db.Float, nullable=False)
    carbs_logged = db.Column(db.Float, nullable=False)
    fats_logged = db.Column(db.Float, nullable=False)
    
    # User Notes
    notes = db.Column(db.Text, nullable=True)
    
    # Meal Date/Time
    consumed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    
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
    
    # Relationships
    scan = db.relationship('MealScan', foreign_keys=[scan_id])
    
    def __repr__(self):
        return f'<MealLog id={self.id} user_id={self.user_id} recipe_id={self.recipe_id}>'
    
    def soft_delete(self):
        """Soft delete meal log"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'recipe': self.recipe.to_dict(include_ingredients=False, include_macros=False) if self.recipe else None,
            'meal_type': self.meal_type,
            'servings_consumed': self.servings_consumed,
            'nutritional_info': {
                'calories': self.calories_logged,
                'protein': self.protein_logged,
                'carbs': self.carbs_logged,
                'fats': self.fats_logged
            },
            'notes': self.notes,
            'consumed_at': self.consumed_at.isoformat() if self.consumed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_active_query():
        """Query helper to exclude soft-deleted meal logs"""
        return MealLog.query.filter_by(is_deleted=False)