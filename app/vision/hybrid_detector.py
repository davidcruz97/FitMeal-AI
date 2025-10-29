# app/vision/hybrid_detector.py
"""
Hybrid Detector: ALWAYS run both YOLOv8 + Clarifai
Smart ingredient mapping without needing yolo_detectable column
"""
from app.vision.detector import get_detector as get_yolo_detector
from app.vision.clarifai_detector import get_clarifai_detector
from app.vision.ingredient_mapper import map_detection_to_ingredient
from datetime import datetime
from flask import current_app
import time


def detect_ingredients_hybrid(image_path, conf_threshold=0.25):
    """
    Improved hybrid detection strategy:
    1. ALWAYS run both YOLOv8 AND Clarifai in parallel
    2. Map all detections to ingredients using smart matching
    3. Merge results and deduplicate
    4. If both fail, return empty (user can add manually)
    
    Args:
        image_path: Path to image file
        conf_threshold: Confidence threshold for YOLOv8
    
    Returns:
        Combined detection results with metadata
    """
    start_time = time.time()
    logger = current_app.logger
    
    results = {
        'detections': [],
        'yolo_detections': [],
        'clarifai_detections': [],
        'strategy_used': 'both (yolo + clarifai)',
        'processing_time_ms': 0
    }
    
    yolo_matched = []
    clarifai_matched = []
    
    try:
        # Step 1: YOLOv8 Detection (ALWAYS RUN)
        logger.info("🎯 Starting YOLOv8 detection...")
        try:
            yolo_detector = get_yolo_detector()
            yolo_results = yolo_detector.detect_ingredients(
                image_path, 
                conf_threshold=conf_threshold
            )
            
            yolo_detections = yolo_results.get('detections', [])
            results['yolo_detections'] = yolo_detections
            results['yolo_processing_time_ms'] = yolo_results.get('processing_time_ms', 0)
            
            # Map YOLOv8 detections to ingredients (NO yolo_detectable filter!)
            yolo_mapped = map_yolo_to_ingredients(yolo_detections)
            yolo_matched = yolo_mapped.get('matched', [])
            
            logger.info(f"✅ YOLOv8: {len(yolo_detections)} objects detected, {len(yolo_matched)} ingredients matched")
            if yolo_matched:
                logger.debug(f"   YOLO matched: {[m['ingredient_name'] for m in yolo_matched]}")
            
        except Exception as e:
            logger.error(f"❌ YOLOv8 detection failed: {e}", exc_info=True)
            results['yolo_error'] = str(e)
        
        # Step 2: Clarifai Detection (ALWAYS RUN)
        logger.info("☁️ Starting Clarifai detection...")
        try:
            clarifai_detector = get_clarifai_detector()
            clarifai_results = clarifai_detector.detect_food(
                image_path,
                min_confidence=0.3
            )
            
            clarifai_detections = clarifai_results.get('detections', [])
            results['clarifai_detections'] = clarifai_detections
            results['clarifai_processing_time_ms'] = clarifai_results.get('processing_time_ms', 0)
            
            logger.info(f"✅ Clarifai: {len(clarifai_detections)} food items detected")
            if clarifai_detections:
                logger.debug(f"   Clarifai detected: {[d['class_name'] for d in clarifai_detections]}")
            
            # Map Clarifai detections to ingredients
            clarifai_matched = map_clarifai_to_ingredients(clarifai_detections)
            
            logger.info(f"📊 Clarifai mapping: {len(clarifai_matched)} ingredients matched")
            if clarifai_matched:
                logger.debug(f"   Clarifai matched: {[m['ingredient_name'] for m in clarifai_matched]}")
            
        except Exception as e:
            logger.error(f"❌ Clarifai detection failed: {e}", exc_info=True)
            results['clarifai_error'] = str(e)
        
        # Step 3: Merge and deduplicate results
        all_matched = merge_detections(yolo_matched, clarifai_matched)
        results['detections'] = all_matched
        results['total_detected'] = len(all_matched)
        
        # Calculate total processing time
        processing_time = (time.time() - start_time) * 1000
        results['processing_time_ms'] = round(processing_time, 2)
        
        # Log summary
        if all_matched:
            logger.info(f"🎉 Detection complete: {len(all_matched)} unique ingredients in {processing_time:.0f}ms")
            logger.debug(f"   Final ingredients: {[d['ingredient_name'] for d in all_matched]}")
        else:
            logger.warning(f"⚠️ No ingredients detected by either detector (fallback to manual entry)")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Hybrid detection error: {e}", exc_info=True)
        processing_time = (time.time() - start_time) * 1000
        return {
            'error': str(e),
            'detections': [],
            'total_detected': 0,
            'processing_time_ms': round(processing_time, 2)
        }


def map_yolo_to_ingredients(yolo_detections):
    """
    Map YOLOv8 detections to ingredients using smart name matching
    NO dependency on yolo_detectable or yolo_class_name columns!
    
    Args:
        yolo_detections: List of YOLO detection results
    
    Returns:
        Dict with matched and unmatched ingredients
    """
    from flask import current_app
    
    logger = current_app.logger
    matched = []
    unmatched = []
    
    for detection in yolo_detections:
        yolo_class = detection['class_name'].lower().strip()
        confidence = detection['confidence']
        
        logger.debug(f"🔍 Mapping YOLO '{yolo_class}'...")
        
        # Use smart matching (no yolo_detectable filter!)
        ingredient = map_detection_to_ingredient(yolo_class)
        
        if ingredient:
            matched.append({
                'ingredient_id': ingredient['id'],
                'ingredient_name': ingredient['name'],
                'detected_as': yolo_class,
                'confidence': confidence,
                'source': 'yolo',
                
            })
            logger.debug(f"   ✓ Matched '{yolo_class}' → '{ingredient['name']}'")
        else:
            unmatched.append({
                'detected_as': yolo_class,
                'confidence': confidence,
                'reason': 'No ingredient match found'
            })
            logger.debug(f"   ✗ No match for '{yolo_class}'")
    
    if unmatched:
        logger.info(f"⚠️ Unmatched YOLO detections: {', '.join([u['detected_as'] for u in unmatched])}")
    
    return {
        'matched': matched,
        'unmatched': unmatched
    }


def map_clarifai_to_ingredients(clarifai_detections):
    """
    Map Clarifai food detections to database ingredients using smart matching
    
    Args:
        clarifai_detections: List of Clarifai detection results
    
    Returns:
        List of matched ingredients
    """
    from flask import current_app
    
    logger = current_app.logger
    matched = []
    unmatched = []
    
    for detection in clarifai_detections:
        food_name = detection['class_name'].lower().strip()
        confidence = detection['confidence']
        
        logger.debug(f"🔍 Mapping Clarifai '{food_name}'...")
        
        # Use smart matching
        ingredient = map_detection_to_ingredient(food_name)
        
        if ingredient:
            matched.append({
                'ingredient_id': ingredient['id'],
                'ingredient_name': ingredient['name'],
                'detected_as': food_name,
                'confidence': confidence,
                'source': 'clarifai',
                
            })
            logger.debug(f"   ✓ Matched '{food_name}' → '{ingredient['name']}'")
        else:
            unmatched.append(food_name)
            logger.debug(f"   ✗ No match for '{food_name}'")
    
    if unmatched:
        logger.info(f"⚠️ Unmatched Clarifai detections: {', '.join(unmatched)}")
    
    return matched


def merge_detections(yolo_results, clarifai_results):
    """
    Merge and deduplicate detections from both sources
    Priority: Keep higher confidence detections
    
    Args:
        yolo_results: List of YOLOv8 matched ingredients
        clarifai_results: List of Clarifai matched ingredients
    
    Returns:
        Deduplicated list of ingredients sorted by confidence
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
                old_source = merged[ingredient_id]['source']
                merged[ingredient_id] = detection
                logger.debug(
                    f"  ↑ Updated {detection['ingredient_name']}: "
                    f"{old_source}({old_conf:.2f}) → clarifai({detection['confidence']:.2f})"
                )
    
    # Sort by confidence (highest first)
    result = sorted(merged.values(), key=lambda x: x['confidence'], reverse=True)
    
    logger.info(f"🔗 Merge: YOLO({len(yolo_results)}) + Clarifai({len(clarifai_results)}) = {len(result)} unique")
    
    return result