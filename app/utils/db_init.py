"""
Database Initialization Utility
This script creates initial data for the database including admin user and sample ingredients
"""
from datetime import datetime
from app import db
from app.models.user import User
from app.models.ingredient import Ingredient
import logging
logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize database with essential data"""
    
    print("Creating database tables...")
    logger.info("Creating database tables...")
    db.create_all()
    
    # Check if admin already exists
    admin = User.query.filter_by(email='admin@fitmeal.com').first()
    if not admin:
        print("Creating admin user...")
        admin = User(
            email='admin@fitmeal.com',
            full_name='FitMeal Administrator',
            user_type='admin',
            is_active=True,
            is_verified=True,
            email_verified_at=datetime.utcnow()
        )
        admin.set_password('admin123')  # Change this in production!
        db.session.add(admin)
        db.session.commit()
        print(f"✓ Admin user created: admin@fitmeal.com / admin123")
    else:
        print("✓ Admin user already exists")
    
    # Create sample ingredients (common ones that YOLOv8 can detect)
    sample_ingredients = [
        # Fruits
        {
            'name': 'Apple',
            'name_es': 'Manzana',
            'category': 'fruits',
            'calories_per_100g': 52,
            'protein_per_100g': 0.3,
            'carbs_per_100g': 14,
            'fats_per_100g': 0.2,
            'fiber_per_100g': 2.4,
            'yolo_detectable': True,
            'yolo_class_name': 'apple',
            'is_verified': True
        },
        {
            'name': 'Banana',
            'name_es': 'Plátano',
            'category': 'fruits',
            'calories_per_100g': 89,
            'protein_per_100g': 1.1,
            'carbs_per_100g': 23,
            'fats_per_100g': 0.3,
            'fiber_per_100g': 2.6,
            'yolo_detectable': True,
            'yolo_class_name': 'banana',
            'is_verified': True
        },
        {
            'name': 'Orange',
            'name_es': 'Naranja',
            'category': 'fruits',
            'calories_per_100g': 47,
            'protein_per_100g': 0.9,
            'carbs_per_100g': 12,
            'fats_per_100g': 0.1,
            'fiber_per_100g': 2.4,
            'yolo_detectable': True,
            'yolo_class_name': 'orange',
            'is_verified': True
        },
        # Vegetables
        {
            'name': 'Broccoli',
            'name_es': 'Brócoli',
            'category': 'vegetables',
            'calories_per_100g': 34,
            'protein_per_100g': 2.8,
            'carbs_per_100g': 7,
            'fats_per_100g': 0.4,
            'fiber_per_100g': 2.6,
            'yolo_detectable': True,
            'yolo_class_name': 'broccoli',
            'is_verified': True
        },
        {
            'name': 'Carrot',
            'name_es': 'Zanahoria',
            'category': 'vegetables',
            'calories_per_100g': 41,
            'protein_per_100g': 0.9,
            'carbs_per_100g': 10,
            'fats_per_100g': 0.2,
            'fiber_per_100g': 2.8,
            'yolo_detectable': True,
            'yolo_class_name': 'carrot',
            'is_verified': True
        },
        # Proteins
        {
            'name': 'Chicken Breast',
            'name_es': 'Pechuga de Pollo',
            'category': 'proteins',
            'calories_per_100g': 165,
            'protein_per_100g': 31,
            'carbs_per_100g': 0,
            'fats_per_100g': 3.6,
            'fiber_per_100g': 0,
            'yolo_detectable': False,
            'is_verified': True
        },
        {
            'name': 'Eggs',
            'name_es': 'Huevos',
            'category': 'proteins',
            'calories_per_100g': 155,
            'protein_per_100g': 13,
            'carbs_per_100g': 1.1,
            'fats_per_100g': 11,
            'fiber_per_100g': 0,
            'yolo_detectable': False,
            'is_verified': True
        },
        # Grains
        {
            'name': 'Brown Rice',
            'name_es': 'Arroz Integral',
            'category': 'grains',
            'calories_per_100g': 111,
            'protein_per_100g': 2.6,
            'carbs_per_100g': 23,
            'fats_per_100g': 0.9,
            'fiber_per_100g': 1.8,
            'yolo_detectable': False,
            'is_verified': True
        },
        # Dairy
        {
            'name': 'Greek Yogurt',
            'name_es': 'Yogur Griego',
            'category': 'dairy',
            'calories_per_100g': 59,
            'protein_per_100g': 10,
            'carbs_per_100g': 3.6,
            'fats_per_100g': 0.4,
            'fiber_per_100g': 0,
            'yolo_detectable': False,
            'is_verified': True
        },
        # Oils
        {
            'name': 'Olive Oil',
            'name_es': 'Aceite de Oliva',
            'category': 'oils',
            'calories_per_100g': 884,
            'protein_per_100g': 0,
            'carbs_per_100g': 0,
            'fats_per_100g': 100,
            'fiber_per_100g': 0,
            'yolo_detectable': False,
            'is_verified': True
        }
    ]
    
    # Check if ingredients already exist
    existing_count = Ingredient.query.count()
    if existing_count == 0:
        print("Creating sample ingredients...")
        for ing_data in sample_ingredients:
            ingredient = Ingredient(**ing_data)
            ingredient.verified_by_id = admin.id
            ingredient.verified_at = datetime.utcnow()
            db.session.add(ingredient)
        
        db.session.commit()
        print(f"✓ Created {len(sample_ingredients)} sample ingredients")
    else:
        print(f"✓ Ingredients already exist ({existing_count} found)")
    
    print("\n" + "="*50)
    print("DATABASE INITIALIZATION COMPLETE")
    print("="*50)
    print(f"\nAdmin Login:")
    print(f"  Email: admin@fitmeal.com")
    print(f"  Password: admin123")
    print(f"\nIngredients: {Ingredient.query.count()}")
    print(f"Users: {User.query.count()}")
    print("\n⚠️  IMPORTANT: Change admin password in production!")
    print("="*50)


def clear_database():
    """Clear all data from database (use with caution!)"""
    print("⚠️  WARNING: This will delete ALL data!")
    confirm = input("Type 'YES' to confirm: ")
    
    if confirm == 'YES':
        db.drop_all()
        print("✓ All tables dropped")
        db.create_all()
        print("✓ Fresh tables created")
    else:
        print("✗ Cancelled")


if __name__ == '__main__':
    from app import create_app
    
    app = create_app()
    with app.app_context():
        initialize_database()