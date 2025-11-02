# app/api/scan.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db, limiter
from app.models.meal_scan import MealScan
from app.models.user import User
from app.utils.logger import log_detection_start, log_detection_result
from app.vision.claude_detector import get_claude_detector
from app.vision.ingredient_mapper import map_detection_to_ingredient
import os
import uuid
from datetime import datetime
import time

bp = Blueprint('api_scan', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("20 per hour")  # Limit photo uploads
def upload_scan():
    """
    Upload a photo for ingredient detection using Claude Vision
    
    Form data:
        image: file (required)
        auto_detect: boolean (default: true) - automatically run detection
    
    Returns scan_id and detected ingredients
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        # Check if image file is in request
        if 'image' not in request.files:
            logger.warning(f"❌ Upload failed: No image file provided [User: {user_id}]")
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            logger.warning(f"❌ Upload failed: No file selected [User: {user_id}]")
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            logger.warning(
                f"❌ Upload failed: Invalid file type '{file.filename}' [User: {user_id}]"
            )
            return jsonify({'error': 'File type not allowed. Use: png, jpg, jpeg, webp'}), 400
        
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        
        # Save file
        upload_folder = 'app/static/uploads/scans'
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, filename)
        
        save_start = time.time()
        file.save(filepath)
        save_time = (time.time() - save_start) * 1000
        
        # Get file size
        file_size = os.path.getsize(filepath)
        file_size_mb = file_size / (1024 * 1024)
        
        logger.info(
            f"📁 Image uploaded: {filename} | Size: {file_size_mb:.2f}MB | "
            f"Save time: {save_time:.0f}ms [User: {user_id}]"
        )
        
        # Create scan record
        scan = MealScan(
            user_id=user_id,
            image_path=f'/static/uploads/scans/{filename}',
            image_size_bytes=file_size,
            processing_status='pending'
        )
        
        db.session.add(scan)
        db.session.flush()  # Get scan ID
        
        scan_id = scan.id
        logger.info(f"💾 Scan record created: ID={scan_id} [User: {user_id}]")
        
        # Auto-detect ingredients (unless disabled)
        auto_detect = request.form.get('auto_detect', 'true').lower() != 'false'
        
        detected_ingredients = []
        processing_time_ms = 0
        
        if auto_detect:
            try:
                # Log detection start
                log_detection_start(logger, filepath, user_id)
                
                start_time = time.time()
                
                # Run Claude Vision detection
                logger.debug("🤖 Starting Claude Vision detection...")
                claude_detector = get_claude_detector()
                detection_results = claude_detector.detect_ingredients(
                    filepath,
                    min_confidence=0.5  # 50% confidence threshold
                )
                
                # Check for errors
                if 'error' in detection_results:
                    raise Exception(detection_results['error'])
                
                # Get detected ingredients
                claude_detections = detection_results.get('detections', [])
                
                logger.debug(
                    f"✅ Claude detected {len(claude_detections)} ingredients "
                    f"(filtered from {len(detection_results.get('all_detections', []))} total)"
                )
                
                # Map detections to database ingredients
                matched_ingredients = []
                unmatched_detections = []
                
                for detection in claude_detections:
                    food_name = detection['class_name']
                    confidence = detection['confidence']
                    
                    logger.debug(f"🔍 Mapping Claude detection '{food_name}'...")
                    
                    # Map to ingredient
                    ingredient = map_detection_to_ingredient(food_name)
                    
                    if ingredient:
                        matched_ingredients.append({
                            'ingredient_id': ingredient['id'],
                            'ingredient_name': ingredient['name'],
                            'detected_as': food_name,
                            'confidence': confidence,
                            'source': 'claude',
                        })
                        logger.debug(f"   ✓ Matched '{food_name}' → '{ingredient['name']}'")
                    else:
                        unmatched_detections.append(food_name)
                        logger.debug(f"   ✗ No match for '{food_name}'")
                
                if unmatched_detections:
                    logger.info(
                        f"⚠️ Unmatched detections: {', '.join(unmatched_detections)}"
                    )
                
                detected_ingredients = matched_ingredients
                processing_time_ms = int((time.time() - start_time) * 1000)
                
                # Log detection results
                log_detection_result(logger, detected_ingredients, processing_time_ms)
                
                # Store in scan record
                scan.detected_ingredients = detected_ingredients
                scan.processing_time_ms = processing_time_ms
                scan.processing_status = 'completed'
                
                logger.info(
                    f"✅ Detection completed for scan {scan_id}: "
                    f"{len(detected_ingredients)} ingredients found "
                    f"({len(claude_detections)} detected, {len(matched_ingredients)} mapped)"
                )
                
            except Exception as e:
                scan.processing_status = 'failed'
                scan.error_message = str(e)
                processing_time_ms = int((time.time() - start_time) * 1000)
                
                logger.error(
                    f"❌ Detection failed for scan {scan_id} after {processing_time_ms}ms: {e}",
                    exc_info=True
                )
        else:
            logger.info(f"⏭️ Auto-detection skipped for scan {scan_id} [User: {user_id}]")
        
        db.session.commit()
        
        response = {
            'message': 'Image uploaded successfully',
            'scan_id': scan.id,
            'image_url': f'https://fitmeal.cinturillas247.com{scan.image_path}',
            'status': scan.processing_status,
            'processing_time_ms': processing_time_ms
        }
        
        if detected_ingredients:
            response['detected_ingredients'] = detected_ingredients
            response['total_detected'] = len(detected_ingredients)
        
        logger.info(f"✅ Upload complete: Scan {scan_id} | Status: {scan.processing_status}")
        
        return jsonify(response), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Upload failed for user {user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@bp.route('/<int:scan_id>', methods=['GET'])
@jwt_required()
def get_scan(scan_id):
    """Get scan details and detection results"""
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        scan = MealScan.query.get(scan_id)
        
        if not scan:
            logger.warning(f"⚠️ Scan not found: {scan_id} [User: {user_id}]")
            return jsonify({'error': 'Scan not found'}), 404
        
        # Check ownership
        if scan.user_id != user_id:
            logger.warning(
                f"🚫 Access denied: User {user_id} attempted to access scan {scan_id} "
                f"owned by user {scan.user_id}"
            )
            return jsonify({'error': 'Access denied'}), 403
        
        logger.debug(f"📊 Retrieved scan {scan_id} [User: {user_id}]")
        
        return jsonify({
            'scan': scan.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get scan {scan_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get scan: {str(e)}'}), 500


@bp.route('/history', methods=['GET'])
@jwt_required()
@limiter.limit("100 per minute")
def get_scan_history():
    """
    Get user's scan history
    
    Query params:
        page: page number (default: 1)
        per_page: items per page (default: 20, max: 100)
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        
        # Build query
        query = MealScan.query.filter_by(user_id=user_id)
        
        # Order by most recent first
        query = query.order_by(MealScan.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        logger.debug(
            f"📜 Retrieved scan history: Page {page}/{pagination.pages}, "
            f"Total: {pagination.total} [User: {user_id}]"
        )
        
        return jsonify({
            'scans': [scan.to_dict() for scan in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get scan history for user {user_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get scan history: {str(e)}'}), 500


@bp.route('/<int:scan_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_ingredients(scan_id):
    """
    Confirm detected ingredients and add manual ones
    
    Request body:
    {
        "detected_ingredients": [
            {"ingredient_id": 1, "confidence": 0.95}
        ],
        "manual_ingredients": [
            {"ingredient_id": 5}
        ]
    }
    """
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        data = request.get_json()
        
        scan = MealScan.query.get(scan_id)
        
        if not scan:
            logger.warning(f"⚠️ Scan not found: {scan_id} [User: {user_id}]")
            return jsonify({'error': 'Scan not found'}), 404
        
        # Check ownership
        if scan.user_id != user_id:
            logger.warning(
                f"🚫 Access denied: User {user_id} attempted to modify scan {scan_id}"
            )
            return jsonify({'error': 'Access denied'}), 403
        
        detected = data.get('detected_ingredients', [])
        manual = data.get('manual_ingredients', [])
        
        # Update scan with confirmed ingredients
        scan.detected_ingredients = detected
        scan.manual_ingredients = manual
        scan.processing_status = 'confirmed'
        
        db.session.commit()
        
        logger.info(
            f"✅ Ingredients confirmed for scan {scan_id}: "
            f"{len(detected)} detected + {len(manual)} manual = {len(detected) + len(manual)} total "
            f"[User: {user_id}]"
        )
        
        return jsonify({
            'message': 'Ingredients confirmed',
            'scan': scan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to confirm ingredients for scan {scan_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to confirm ingredients: {str(e)}'}), 500


@bp.route('/<int:scan_id>', methods=['DELETE'])
@jwt_required()
def delete_scan(scan_id):
    """Delete a scan (hard delete)"""
    logger = current_app.logger
    user_id = int(get_jwt_identity())
    
    try:
        scan = MealScan.query.get(scan_id)
        
        if not scan:
            logger.warning(f"⚠️ Scan not found: {scan_id} [User: {user_id}]")
            return jsonify({'error': 'Scan not found'}), 404
        
        # Check ownership
        if scan.user_id != user_id:
            logger.warning(
                f"🚫 Access denied: User {user_id} attempted to delete scan {scan_id}"
            )
            return jsonify({'error': 'Access denied'}), 403
        
        # Hard delete
        db.session.delete(scan)
        db.session.commit()
        
        logger.info(f"🗑️ Scan deleted: {scan_id} [User: {user_id}]")
        
        return jsonify({
            'message': 'Scan deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Failed to delete scan {scan_id}: {e}", exc_info=True)
        return jsonify({'error': f'Failed to delete scan: {str(e)}'}), 500