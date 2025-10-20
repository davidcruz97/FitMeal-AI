# app/vision/ingredient_mapper.py
"""
Map YOLOv8 detected classes to ingredients in database
"""

from app.models.ingredient import Ingredient
from app import db

# Mapping of YOLOv8 class names to common ingredient search terms
YOLO_TO_INGREDIENT_MAP = {
    'apple': ['apple', 'manzana'],
    'banana': ['banana', 'plátano', 'platano'],
    'orange': ['orange', 'naranja'],
    'broccoli': ['broccoli', 'brócoli', 'brocoli'],
    'carrot': ['carrot', 'zanahoria'],
    'hot dog': ['hot dog', 'salchicha'],
    'pizza': ['pizza'],
    'donut': ['donut', 'dona'],
    'cake': ['cake', 'pastel'],
    'sandwich': ['sandwich'],
    'bowl': [],  # Container, not food
    'cup': [],   # Container, not food
}


def map_yolo_detection_to_ingredient(yolo_class_name, confidence):
    """
    Map a YOLO detection to an ingredient in the database
    
    Args:
        yolo_class_name: Name of detected class (e.g., 'apple')
        confidence: Detection confidence (0-1)
    
    Returns:
        dict with ingredient info or None
    """
    # Check if we have a mapping for this class
    if yolo_class_name not in YOLO_TO_INGREDIENT_MAP:
        return None
    
    search_terms = YOLO_TO_INGREDIENT_MAP[yolo_class_name]
    
    if not search_terms:
        return None  # It's a container, not food
    
    # Search for matching ingredient in database
    for term in search_terms:
        ingredient = Ingredient.query.filter(
            db.or_(
                Ingredient.name.ilike(f'%{term}%'),
                Ingredient.name_es.ilike(f'%{term}%')
            ),
            Ingredient.is_deleted == False,
            Ingredient.yolo_detectable == True
        ).first()
        
        if ingredient:
            return {
                'ingredient_id': ingredient.id,
                'ingredient_name': ingredient.name,
                'yolo_class': yolo_class_name,
                'confidence': confidence,
                'verified': ingredient.is_verified
            }
    
    return None


def process_yolo_detections(detections):
    """
    Process YOLO detections and map to ingredients
    
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
        ingredient_match = map_yolo_detection_to_ingredient(yolo_class, confidence)
        
        if ingredient_match:
            matched_ingredients.append(ingredient_match)
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