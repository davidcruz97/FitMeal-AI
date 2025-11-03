# app/api/auth.py
from flask import Blueprint, request, jsonify, current_app
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
    logger = current_app.logger
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            logger.warning("❌ Registration attempt with no data")
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        
        logger.info(f"📝 Registration attempt for email: {email}")
        
        # Validation
        if not email or not password or not full_name:
            logger.warning(f"❌ Registration failed: Missing required fields for {email}")
            return jsonify({'error': 'Email, password, and full name are required'}), 400
        
        if len(password) < 6:
            logger.warning(f"❌ Registration failed: Weak password for {email}")
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            logger.warning(f"❌ Registration failed: Email already registered: {email}")
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
        
        logger.info(f"✅ User registered successfully: {email} (ID: {user.id})")
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Registration error: {e}", exc_info=True)
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
    logger = current_app.logger
    
    try:
        data = request.get_json()
        
        if not data:
            logger.warning("❌ Login attempt with no data")
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        logger.info(f"🔐 Login attempt for: {email}")
        
        if not email or not password:
            logger.warning(f"❌ Login failed: Missing credentials for {email}")
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user (REMOVED is_deleted filter - using hard delete now)
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            logger.warning(f"❌ Login failed: Invalid credentials for {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            logger.warning(f"🚫 Login failed: Account disabled for {email} (ID: {user.id})")
            return jsonify({'error': 'Account is disabled'}), 403
        
        # Update last login
        user.update_last_login()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        logger.info(
            f"✅ Login successful: {email} (ID: {user.id}) | "
            f"Last login: {user.last_login_at.strftime('%Y-%m-%d %H:%M:%S') if user.last_login_at else 'First time'}"
        )
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Login error: {e}", exc_info=True)
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user info
    
    Headers:
        Authorization: Bearer <access_token>
    """
    logger = current_app.logger
    
    try:
        # Get user ID from JWT token
        user_id = int(get_jwt_identity())
        
        # Find user (REMOVED is_deleted check - using hard delete now)
        user = User.query.get(user_id)
        
        if not user:
            logger.warning(f"⚠️  User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        if not user.is_active:
            logger.warning(f"🚫 Account disabled: {user.email} (ID: {user_id})")
            return jsonify({'error': 'Account is disabled'}), 403
        
        logger.debug(f"👤 Profile retrieved: {user.email} (ID: {user_id})")
        
        return jsonify({
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to get user info: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get user info: {str(e)}'}), 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (client should delete token)
    
    Headers:
        Authorization: Bearer <access_token>
    """
    logger = current_app.logger
    
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if user:
            logger.info(f"👋 Logout: {user.email} (ID: {user_id})")
        else:
            logger.info(f"👋 Logout: User ID {user_id}")
        
        # Note: With JWT, logout is handled client-side by deleting the token
        # For a more secure implementation, you could use a token blacklist with Redis
        
        return jsonify({
            'message': 'Logout successful. Please delete your access token.'
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Logout error: {e}", exc_info=True)
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500


# Admin only endpoint example
@bp.route('/admin/users', methods=['GET'])
@jwt_required()
def list_users():
    """
    List all users (admin only)
    
    Headers:
        Authorization: Bearer <access_token>
    """
    logger = current_app.logger
    
    try:
        user_id = int(get_jwt_identity())
        current_user = User.query.get(user_id)
        
        if not current_user or not current_user.is_admin():
            logger.warning(
                f"🚫 Admin access denied: {current_user.email if current_user else 'Unknown'} "
                f"(ID: {user_id})"
            )
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get all active users (REMOVED get_active_query() - just use regular query)
        users = User.query.filter_by(is_active=True).all()
        
        logger.info(f"📋 Admin retrieved user list: {len(users)} users [Admin: {current_user.email}]")
        
        return jsonify({
            'users': [user.to_dict() for user in users],
            'total': len(users)
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Failed to list users: {e}", exc_info=True)
        return jsonify({'error': f'Failed to list users: {str(e)}'}), 500