#!/usr/bin/env python3
"""
FitMeal-AI Application Entry Point
"""
import os
from app import create_app, db
from app.models.user import User
from app.models.ingredient import Ingredient
from app.models.recipe import Recipe
from app.models.meal_scan import RecipeIngredient, MealScan, MealLog

# Create Flask app
app = create_app()

# Shell context for Flask CLI
@app.shell_context_processor
def make_shell_context():
    """Make database models available in Flask shell"""
    return {
        'db': db,
        'User': User,
        'Ingredient': Ingredient,
        'Recipe': Recipe,
        'RecipeIngredient': RecipeIngredient,
        'MealScan': MealScan,
        'MealLog': MealLog
    }


if __name__ == '__main__':
    # Get configuration from environment
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8001))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    app.run(host=host, port=port, debug=debug)