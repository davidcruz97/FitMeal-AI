from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db, limiter
from app.models.meal_scan import MealScan
from app.models.user import User
import os
import uuid
from datetime import datetime
from app.vision.hybrid_detector import detect_ingredients_hybrid
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
    Upload a photo for ingredient detection
    
    Form data:
        image: file (required)
        auto_detect: boolean (default: true) - automatically run detection
    
    Returns scan_id and detected ingredients
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Check if image file is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Use: png, jpg, jpeg, webp'}), 400
        
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        
        # Save file
        upload_folder = 'app/static/uploads/scans'
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        
        # Create scan record
        scan = MealScan(
            user_id=user_id,
            image_path=f'/static/uploads/scans/{filename}',
            image_size_bytes=file_size,
            processing_status='pending'
        )
        
        db.session.add(scan)
        db.session.flush()  # Get scan ID
        
        # Auto-detect ingredients (unless disabled)
        auto_detect = request.form.get('auto_detect', 'true').lower() != 'false'
        
        detected_ingredients = []
        processing_time_ms = 0
        
        if auto_detect:
            try:
                start_time = time.time()
                
                # Run hybrid detection (YOLOv8 + Clarifai)
                detection_results = detect_ingredients_hybrid(filepath)
                current_app.logger.debug(f"Detection results: {detection_results}")
                
                # Get detected ingredients
                detected_ingredients = detection_results.get('detections', [])
                current_app.logger.debug(f"Detected ingredients: {detected_ingredients}")
                
                # Store in scan record
                scan.detected_ingredients = detected_ingredients
                
                processing_time_ms = int((time.time() - start_time) * 1000)
                scan.processing_time_ms = processing_time_ms
                scan.processing_status = 'completed'
                
            except Exception as e:
                scan.processing_status = 'failed'
                scan.error_message = str(e)
                current_app.logger.error(f"Detection error: {e}")
        
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
        
        return jsonify(response), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@bp.route('/<int:scan_id>', methods=['GET'])
@jwt_required()
def get_scan(scan_id):
    """
    Get scan details and detection results
    """
    try:
        user_id = int(get_jwt_identity())
        
        scan = MealScan.query.get(scan_id)
        
        if not scan or scan.is_deleted:
            return jsonify({'error': 'Scan not found'}), 404
        
        # Check ownership
        if scan.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'scan': scan.to_dict()
        }), 200
        
    except Exception as e:
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
    try:
        user_id = int(get_jwt_identity())
        
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        
        # Build query
        query = MealScan.get_active_query().filter_by(user_id=user_id)
        
        # Order by most recent first
        query = query.order_by(MealScan.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
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
        return jsonify({'error': f'Failed to get scan history: {str(e)}'}), 500


@bp.route('/<int:scan_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_ingredients():
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
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        scan = MealScan.query.get(scan_id)
        
        if not scan or scan.is_deleted:
            return jsonify({'error': 'Scan not found'}), 404
        
        # Check ownership
        if scan.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Update scan with confirmed ingredients
        scan.detected_ingredients = data.get('detected_ingredients', [])
        scan.manual_ingredients = data.get('manual_ingredients', [])
        scan.processing_status = 'completed'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ingredients confirmed',
            'scan': scan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to confirm ingredients: {str(e)}'}), 500


@bp.route('/<int:scan_id>', methods=['DELETE'])
@jwt_required()
def delete_scan(scan_id):
    """
    Delete (soft delete) a scan
    """
    try:
        user_id = int(get_jwt_identity())
        
        scan = MealScan.query.get(scan_id)
        
        if not scan or scan.is_deleted:
            return jsonify({'error': 'Scan not found'}), 404
        
        # Check ownership
        if scan.user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Soft delete
        scan.soft_delete()
        
        return jsonify({
            'message': 'Scan deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete scan: {str(e)}'}), 500