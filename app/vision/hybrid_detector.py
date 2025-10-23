# app/vision/hybrid_detector.py
"""
Hybrid detector: YOLOv8 (primary) + Clarifai (fallback)
Improved with proper logging and flexible ingredient matching
"""
from app.vision.detector import get_detector as get_yolo_detector
from app.vision.clarifai_detector import get_clarifai_detector
from app.vision.ingredient_mapper import process_yolo_detections
from datetime import datetime
from flask import current_app


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
    logger = current_app.logger
    
    results = {
        'detections': [],
        'yolo_detections': [],
        'clarifai_detections': [],
        'strategy_used': 'hybrid',
        'processing_time_ms': 0
    }
    
    try:
        # Step 1: YOLOv8 Detection (Primary)
        logger.info("🎯 Starting YOLOv8 detection...")
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
        
        logger.info(f"✅ YOLOv8: {len(yolo_detections)} objects detected, {len(yolo_matched)} ingredients matched")
        logger.debug(f"YOLO matched ingredients: {[m['ingredient_name'] for m in yolo_matched]}")
        
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
            logger.info(f"🔄 Triggering Clarifai fallback: {fallback_reason}")
            
            try:
                clarifai_detector = get_clarifai_detector()
                clarifai_results = clarifai_detector.detect_food(
                    image_path,
                    min_confidence=0.3
                )
                
                clarifai_detections = clarifai_results.get('detections', [])
                results['clarifai_detections'] = clarifai_detections
                results['fallback_reason'] = fallback_reason
                
                logger.info(f"✅ Clarifai: {len(clarifai_detections)} food items detected")
                logger.debug(f"Clarifai detections: {[d['class_name'] for d in clarifai_detections]}")
                
                # Map Clarifai detections to ingredients
                clarifai_matched = map_clarifai_to_ingredients(clarifai_detections)
                
                logger.info(f"📊 Clarifai mapping: {len(clarifai_matched)} ingredients matched")
                logger.debug(f"Clarifai matched: {[m['ingredient_name'] for m in clarifai_matched]}")
                
            except Exception as e:
                logger.error(f"❌ Clarifai fallback failed: {e}", exc_info=True)
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
        
        logger.info(f"🎉 Detection complete: {len(all_matched)} unique ingredients in {processing_time:.0f}ms")
        logger.debug(f"Final ingredients: {[d['ingredient_name'] for d in all_matched]}")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Hybrid detection error: {e}", exc_info=True)
        return {
            'error': str(e),
            'detections': [],
            'total_detected': 0,
            'processing_time_ms': 0
        }


def map_clarifai_to_ingredients(clarifai_detections):
    """
    Map Clarifai food detections to database ingredients with improved matching
    
    Args:
        clarifai_detections: List of Clarifai detection results
    
    Returns:
        List of matched ingredients
    """
    from app.models.ingredient import Ingredient
    from app import db
    from flask import current_app
    
    logger = current_app.logger
    matched = []
    unmatched = []
    
    # Common plural to singular conversions
    plural_map = {
        'beets': 'beet',
        'carrots': 'carrot',
        'tomatoes': 'tomato',
        'potatoes': 'potato',
        'onions': 'onion',
        'peppers': 'pepper',
        'mushrooms': 'mushroom',
        'apples': 'apple',
        'oranges': 'orange',
        'bananas': 'banana',
        'strawberries': 'strawberry',
        'blueberries': 'blueberry',
        'raspberries': 'raspberry',
    }
    
    for detection in clarifai_detections:
        food_name = detection['class_name'].lower().strip()
        confidence = detection['confidence']
        ingredient = None
        match_strategy = None
        
        logger.debug(f"🔍 Searching for: '{food_name}'")
        
        # Normalize: try singular form if plural
        search_terms = [food_name]
        if food_name in plural_map:
            search_terms.append(plural_map[food_name])
        
        # Try multiple search strategies
        for term in search_terms:
            if ingredient:
                break
                
            # Strategy 1: Exact match
            ingredient = Ingredient.query.filter(
                db.or_(
                    db.func.lower(Ingredient.name) == term,
                    db.func.lower(Ingredient.name_es) == term
                ),
                Ingredient.is_deleted == False
            ).first()
            if ingredient:
                match_strategy = "exact"
                break
            
            # Strategy 2: Starts with
            ingredient = Ingredient.query.filter(
                db.or_(
                    db.func.lower(Ingredient.name).like(f'{term}%'),
                    db.func.lower(Ingredient.name_es).like(f'{term}%')
                ),
                Ingredient.is_deleted == False
            ).first()
            if ingredient:
                match_strategy = "starts_with"
                break
            
            # Strategy 3: Contains
            ingredient = Ingredient.query.filter(
                db.or_(
                    db.func.lower(Ingredient.name).like(f'%{term}%'),
                    db.func.lower(Ingredient.name_es).like(f'%{term}%')
                ),
                Ingredient.is_deleted == False
            ).first()
            if ingredient:
                match_strategy = "contains"
                break
        
        # Strategy 4: Reverse match (ingredient name contains detection)
        if not ingredient:
            for term in search_terms:
                all_ingredients = Ingredient.query.filter_by(is_deleted=False).limit(100).all()
                for ing in all_ingredients:
                    if term in ing.name.lower() or (ing.name_es and term in ing.name_es.lower()):
                        ingredient = ing
                        match_strategy = "reverse_match"
                        break
                if ingredient:
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
            logger.debug(f"  ✓ Matched '{food_name}' → '{ingredient.name}' ({match_strategy})")
        else:
            unmatched.append(food_name)
            logger.warning(f"  ⚠️  No match for '{food_name}'")
    
    if unmatched:
        logger.info(f"⚠️  Unmatched Clarifai detections: {', '.join(unmatched)}")
    
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
    from flask import current_app
    logger = current_app.logger
    
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
            logger.debug(f"  + Added new from Clarifai: {detection['ingredient_name']}")
        else:
            # Ingredient already exists, keep higher confidence
            if detection['confidence'] > merged[ingredient_id]['confidence']:
                old_conf = merged[ingredient_id]['confidence']
                merged[ingredient_id] = detection
                logger.debug(f"  ↑ Updated {detection['ingredient_name']}: {old_conf:.2f} → {detection['confidence']:.2f}")
    
    # Sort by confidence (highest first)
    result = sorted(merged.values(), key=lambda x: x['confidence'], reverse=True)
    
    logger.info(f"🔗 Merge: YOLO({len(yolo_results)}) + Clarifai({len(clarifai_results)}) = {len(result)} unique")
    
    return result