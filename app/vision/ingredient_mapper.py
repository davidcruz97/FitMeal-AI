# app/vision/ingredient_mapper.py
"""
Smart ingredient mapping without dependency on yolo_detectable or yolo_class_name
Uses fuzzy matching and multiple strategies to find ingredients
"""

from app.models.ingredient import Ingredient
from app import db


# Common plural to singular conversions
PLURAL_TO_SINGULAR = {
    'apples': 'apple',
    'oranges': 'orange',
    'bananas': 'banana',
    'carrots': 'carrot',
    'tomatoes': 'tomato',
    'potatoes': 'potato',
    'onions': 'onion',
    'peppers': 'pepper',
    'mushrooms': 'mushroom',
    'strawberries': 'strawberry',
    'blueberries': 'blueberry',
    'raspberries': 'raspberry',
    'cherries': 'cherry',
    'peaches': 'peach',
    'pears': 'pear',
    'grapes': 'grape',
    'cucumbers': 'cucumber',
    'zucchinis': 'zucchini',
    'eggplants': 'eggplant',
    'avocados': 'avocado',
    'mangos': 'mango',
    'mangoes': 'mango',
    'lemons': 'lemon',
    'limes': 'lime',
    'beets': 'beet',
    'beans': 'bean',
    'peas': 'pea',
    'nuts': 'nut',
    'almonds': 'almond',
    'walnuts': 'walnut',
}

# Common ingredient name variations/aliases
INGREDIENT_ALIASES = {
    'red bell pepper': 'bell pepper',
    'green bell pepper': 'bell pepper',
    'yellow bell pepper': 'bell pepper',
    'red pepper': 'bell pepper',
    'sweet pepper': 'bell pepper',
    'bell peppers': 'bell pepper',
    'red onion': 'onion',
    'white onion': 'onion',
    'yellow onion': 'onion',
    'green onion': 'onion',
    'scallion': 'onion',
    'shallot': 'onion',
    'roma tomato': 'tomato',
    'cherry tomato': 'tomato',
    'grape tomato': 'tomato',
    'whole egg': 'egg',
    'chicken egg': 'egg',
    'whole wheat bread': 'bread',
    'white bread': 'bread',
    'wheat bread': 'bread',
    'olive oil': 'oil',
    'vegetable oil': 'oil',
    'canola oil': 'oil',
}


def normalize_detection_name(name):
    """
    Normalize detection name for better matching
    
    Args:
        name: Raw detection name (e.g., "apples", "red bell pepper")
    
    Returns:
        Normalized name (e.g., "apple", "bell pepper")
    """
    name = name.lower().strip()
    
    # Check for direct alias
    if name in INGREDIENT_ALIASES:
        name = INGREDIENT_ALIASES[name]
    
    # Convert plural to singular
    if name in PLURAL_TO_SINGULAR:
        name = PLURAL_TO_SINGULAR[name]
    
    # Remove common modifiers
    name = name.replace('fresh ', '')
    name = name.replace('raw ', '')
    name = name.replace('cooked ', '')
    name = name.replace('organic ', '')
    
    return name


def map_detection_to_ingredient(detected_name):
    """
    Map a detected food name to an ingredient in the database
    Uses multiple strategies for smart matching
    
    Args:
        detected_name: Name detected by YOLO or Clarifai (e.g., 'apple', 'red pepper')
    
    Returns:
        Dict with ingredient info or None
    """
    # Normalize the detection name
    search_term = normalize_detection_name(detected_name)
    
    # Generate search variations
    search_terms = [search_term]
    
    # Add original if different from normalized
    if detected_name.lower() != search_term:
        search_terms.insert(0, detected_name.lower())
    
    # Try multiple matching strategies
    for term in search_terms:
        # Strategy 1: Exact match
        ingredient = Ingredient.query.filter(
            db.func.lower(Ingredient.name) == term
        ).first()
        
        if ingredient:
            return ingredient_to_dict(ingredient)
        
        # Strategy 2: Starts with (e.g., "apple" matches "Apple" or "Apple Juice")
        ingredient = Ingredient.query.filter(
            db.func.lower(Ingredient.name).like(f'{term}%')
        ).order_by(
            # Prefer shorter names (more likely to be the base ingredient)
            db.func.length(Ingredient.name)
        ).first()
        
        if ingredient:
            return ingredient_to_dict(ingredient)
        
        # Strategy 3: Contains (e.g., "pepper" matches "Bell Pepper")
        ingredient = Ingredient.query.filter(
            db.func.lower(Ingredient.name).like(f'%{term}%')
        ).order_by(
            db.func.length(Ingredient.name)
        ).first()
        
        if ingredient:
            return ingredient_to_dict(ingredient)
    
    # No match found
    return None


def ingredient_to_dict(ingredient):
    """Convert ingredient model to dict for detection results"""
    return {
        'id': ingredient.id,
        'name': ingredient.name,
        'category': ingredient.category
    }


def process_yolo_detections(detections):
    """
    Process YOLO detections and map to ingredients
    (Kept for backwards compatibility, but now uses smart matching)
    
    Args:
        detections: List of YOLO detections
    
    Returns:
        List of matched ingredients with metadata
    """
    matched_ingredients = []
    unmatched_detections = []
    
    for detection in detections:
        yolo_class = detection.get('class_name')
        confidence = detection.get('confidence')
        
        # Try to map to ingredient
        ingredient = map_detection_to_ingredient(yolo_class)
        
        if ingredient:
            matched_ingredients.append({
                'ingredient_id': ingredient['id'],
                'ingredient_name': ingredient['name'],
                'detected_as': yolo_class,
                'confidence': confidence,
                'source': 'yolo'
            })
        else:
            unmatched_detections.append({
                'yolo_class': yolo_class,
                'confidence': confidence,
                'reason': 'No ingredient mapping found'
            })
    
    return {
        'matched': matched_ingredients,
        'unmatched': unmatched_detections,
        'total_detected': len(detections),
        'total_matched': len(matched_ingredients)
    }