# app/api/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity
)
from app import db, limiter
from app.models.user import User
from datetime import datetime

bp = Blueprint('api_auth', __name__)


@bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour")  # Prevent spam registrations
def register():
    """
    Register a new user
    
    Request body:
    {
        "email": "user@example.com",
        "password": "securepassword",
        "full_name": "John Doe"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        
        # Validation
        if not email or not password or not full_name:
            return jsonify({'error': 'Email, password, and full name are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        user = User(
            email=email,
            full_name=full_name,
            user_type='user',
            is_active=True,
            is_verified=False
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@bp.route('/login', methods=['POST'])
@limiter.limit("10 per hour")  # Prevent brute force
def login():
    """
    Login user and return JWT token
    
    Request body:
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email, is_deleted=False).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403
        
        # Update last login
        user.update_last_login()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user info
    
    Headers:
        Authorization: Bearer <access_token>
    """
    try:
        # Get user ID from JWT token
        user_id = int(get_jwt_identity())
        
        # Find user
        user = User.query.get(user_id)
        
        if not user or user.is_deleted:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403
        
        return jsonify({
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user info: {str(e)}'}), 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (client should delete token)
    
    Headers:
        Authorization: Bearer <access_token>
    """
    # Note: With JWT, logout is handled client-side by deleting the token
    # For a more secure implementation, you could use a token blacklist with Redis
    
    return jsonify({
        'message': 'Logout successful. Please delete your access token.'
    }), 200


# Admin only endpoint example
@bp.route('/admin/users', methods=['GET'])
@jwt_required()
def list_users():
    """
    List all users (admin only)
    
    Headers:
        Authorization: Bearer <access_token>
    """
    try:
        user_id = int(get_jwt_identity())
        current_user = User.query.get(user_id)
        
        if not current_user or not current_user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        users = User.get_active_query().all()
        
        return jsonify({
            'users': [user.to_dict() for user in users],
            'total': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to list users: {str(e)}'}), 500