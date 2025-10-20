# app/vision/hybrid_detector.py
"""
Hybrid detector: YOLOv8 (primary) + Clarifai (fallback)
"""
from app.vision.detector import get_detector as get_yolo_detector
from app.vision.clarifai_detector import get_clarifai_detector
from app.vision.ingredient_mapper import process_yolo_detections
from datetime import datetime


def detect_ingredients_hybrid(image_path, conf_threshold=0.25):
    """
    Hybrid detection strategy:
    1. Try YOLOv8 first (fast, local)
    2. If low confidence or few detections, use Clarifai (accurate, cloud)
    3. Merge and deduplicate results
    
    Args:
        image_path: Path to image file
        conf_threshold: Confidence threshold for YOLOv8
    
    Returns:
        Combined detection results with metadata
    """
    start_time = datetime.now()
    
    results = {
        'detections': [],
        'yolo_detections': [],
        'clarifai_detections': [],
        'strategy_used': 'hybrid',
        'processing_time_ms': 0
    }
    
    try:
        # Step 1: YOLOv8 Detection (Primary)
        print("Running YOLOv8 detection...")
        yolo_detector = get_yolo_detector()
        yolo_results = yolo_detector.detect_ingredients(
            image_path, 
            conf_threshold=conf_threshold
        )
        
        yolo_detections = yolo_results.get('detections', [])
        results['yolo_detections'] = yolo_detections
        results['yolo_processing_time_ms'] = yolo_results.get('processing_time_ms', 0)
        
        # Map YOLOv8 detections to ingredients
        yolo_mapped = process_yolo_detections(yolo_detections)
        yolo_matched = yolo_mapped.get('matched', [])
        
        print(f"YOLOv8 detected: {len(yolo_detections)} objects, matched: {len(yolo_matched)} ingredients")
        
        # Step 2: Decide if we need Clarifai fallback
        use_clarifai = False
        fallback_reason = None
        
        # Trigger Clarifai if:
        # - Less than 2 ingredients detected by YOLO
        # - Or average confidence is low (< 40%)
        if len(yolo_matched) < 2:
            use_clarifai = True
            fallback_reason = f"Only {len(yolo_matched)} ingredient(s) detected by YOLOv8"
        elif yolo_detections:
            avg_confidence = sum(d['confidence'] for d in yolo_detections) / len(yolo_detections)
            if avg_confidence < 0.4:
                use_clarifai = True
                fallback_reason = f"Low average confidence ({avg_confidence:.2f})"
        
        # Step 3: Clarifai Detection (if needed)
        clarifai_matched = []
        if use_clarifai:
            print(f"Triggering Clarifai fallback: {fallback_reason}")
            
            try:
                clarifai_detector = get_clarifai_detector()
                clarifai_results = clarifai_detector.detect_food(
                    image_path,
                    min_confidence=0.3  # Higher threshold for Clarifai
                )
                
                clarifai_detections = clarifai_results.get('detections', [])
                results['clarifai_detections'] = clarifai_detections
                results['fallback_reason'] = fallback_reason
                
                print(f"Clarifai detected: {len(clarifai_detections)} food items")
                print(f"Clarifai raw detections: {clarifai_detections}")
                
                # Map Clarifai detections to ingredients
                clarifai_mapped = map_clarifai_to_ingredients(clarifai_detections)
                print(f"Clarifai mapped: {len(clarifai_mapped)} ingredients")
                print(f"Mapped ingredients: {clarifai_mapped}")
                clarifai_matched = clarifai_mapped
                
            except Exception as e:
                print(f"Clarifai fallback failed: {e}")
                results['clarifai_error'] = str(e)
        
        # Step 4: Merge and deduplicate results
        all_matched = merge_detections(yolo_matched, clarifai_matched)
        results['detections'] = all_matched
        results['total_detected'] = len(all_matched)
        
        # Calculate total processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        results['processing_time_ms'] = round(processing_time, 2)
        
        # Add strategy info
        if use_clarifai:
            results['strategy_used'] = 'hybrid (yolo + clarifai)'
        else:
            results['strategy_used'] = 'yolo only'
        
        print(f"Final result: {len(all_matched)} ingredients detected in {processing_time:.0f}ms")
        
        return results
        
    except Exception as e:
        print(f"Hybrid detection error: {e}")
        return {
            'error': str(e),
            'detections': [],
            'total_detected': 0,
            'processing_time_ms': 0
        }


def map_clarifai_to_ingredients(clarifai_detections):
    """
    Map Clarifai food detections to database ingredients
    
    Args:
        clarifai_detections: List of Clarifai detection results
    
    Returns:
        List of matched ingredients
    """
    from app.models.ingredient import Ingredient
    from app import db
    
    matched = []
    
    for detection in clarifai_detections:
        food_name = detection['class_name'].lower().strip()
        confidence = detection['confidence']
        
        # Try multiple search strategies
        ingredient = None
        
        # Strategy 1: Exact word match
        ingredient = Ingredient.query.filter(
            db.or_(
                Ingredient.name.ilike(food_name),
                Ingredient.name_es.ilike(food_name)
            ),
            Ingredient.is_deleted == False
        ).first()
        
        # Strategy 2: Partial match (contains)
        if not ingredient:
            ingredient = Ingredient.query.filter(
                db.or_(
                    Ingredient.name.ilike(f'%{food_name}%'),
                    Ingredient.name_es.ilike(f'%{food_name}%')
                ),
                Ingredient.is_deleted == False
            ).first()
        
        # Strategy 3: Reverse match (ingredient name contains detection)
        if not ingredient:
            all_ingredients = Ingredient.query.filter_by(is_deleted=False).all()
            for ing in all_ingredients:
                if food_name in ing.name.lower() or food_name in (ing.name_es or '').lower():
                    ingredient = ing
                    break
        
        if ingredient:
            matched.append({
                'ingredient_id': ingredient.id,
                'ingredient_name': ingredient.name,
                'detected_as': food_name,
                'confidence': confidence,
                'source': 'clarifai',
                'verified': ingredient.is_verified
            })
    
    return matched


def merge_detections(yolo_results, clarifai_results):
    """
    Merge and deduplicate detections from both sources
    Priority: Keep higher confidence detections
    
    Args:
        yolo_results: List of YOLOv8 matched ingredients
        clarifai_results: List of Clarifai matched ingredients
    
    Returns:
        Deduplicated list of ingredients
    """
    # Use dict to deduplicate by ingredient_id
    merged = {}
    
    # Add YOLOv8 results
    for detection in yolo_results:
        ingredient_id = detection['ingredient_id']
        merged[ingredient_id] = detection
    
    # Add Clarifai results (only if better confidence or new ingredient)
    for detection in clarifai_results:
        ingredient_id = detection['ingredient_id']
        
        if ingredient_id not in merged:
            # New ingredient, add it
            merged[ingredient_id] = detection
        else:
            # Ingredient already exists, keep higher confidence
            if detection['confidence'] > merged[ingredient_id]['confidence']:
                merged[ingredient_id] = detection
    
    # Sort by confidence (highest first)
    result = sorted(merged.values(), key=lambda x: x['confidence'], reverse=True)
    
    return result