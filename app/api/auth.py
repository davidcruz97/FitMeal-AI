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
    
@bp.route('/delete-account', methods=['DELETE'])
@jwt_required()
def delete_account():
    """
    Permanently delete user account and all associated data
    
    Headers:
        Authorization: Bearer <access_token>
    
    This will delete:
    - User profile
    - All meal logs
    - All meal scans
    - All user data
    """
    logger = current_app.logger
    
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            logger.warning(f"⚠️ Delete account failed: User not found (ID: {user_id})")
            return jsonify({'error': 'User not found'}), 404
        
        user_email = user.email  # Store for logging before deletion
        
        logger.info(f"🗑️ Starting account deletion for: {user_email} (ID: {user_id})")
        
        # Import models
        from app.models.meal_scan import MealLog, MealScan
        
        # Delete user's meal logs (hard delete, not soft)
        meal_logs = MealLog.query.filter_by(user_id=user_id).all()
        meal_log_count = len(meal_logs)
        for meal_log in meal_logs:
            db.session.delete(meal_log)
        logger.info(f"  ├─ Deleted {meal_log_count} meal logs")
        
        # Delete user's meal scans (hard delete, not soft)
        scans = MealScan.query.filter_by(user_id=user_id).all()
        scan_count = len(scans)
        for scan in scans:
            db.session.delete(scan)
        logger.info(f"  ├─ Deleted {scan_count} meal scans")
        
        # Delete the user (cascade should handle nutrition_targets and user_profile)
        db.session.delete(user)
        
        # Commit all deletions
        db.session.commit()
        
        logger.info(f"✅ Account permanently deleted: {user_email} (ID: {user_id})")
        
        return jsonify({
            'message': 'Account and all associated data have been permanently deleted'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Account deletion failed: {e}", exc_info=True)
        return jsonify({'error': f'Failed to delete account: {str(e)}'}), 500

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
    
@bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")  # Prevent abuse
def forgot_password():
    """
    Send temporary password to user's email
    
    Request body:
    {
        "email": "user@example.com"
    }
    """
    logger = current_app.logger
    
    try:
        data = request.get_json()
        
        if not data:
            logger.warning("❌ Forgot password attempt with no data")
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        
        if not email:
            logger.warning("❌ Forgot password: Missing email")
            return jsonify({'error': 'Email is required'}), 400
        
        logger.info(f"🔑 Forgot password request for: {email}")
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Don't reveal if email exists (security best practice)
            logger.info(f"⚠️ Forgot password: Email not found: {email}")
            return jsonify({
                'message': 'If this email exists, a temporary password has been sent.'
            }), 200
        
        if not user.is_active:
            logger.warning(f"🚫 Forgot password: Account disabled for {email}")
            return jsonify({'error': 'Account is disabled'}), 403
        
        # Generate temporary password
        from app.utils.email import generate_temporary_password, send_password_reset_email
        
        temporary_password = generate_temporary_password(6)
        
        # Update user's password
        user.set_password(temporary_password)
        db.session.commit()
        
        # Send email with temporary password
        try:
            send_password_reset_email(user, temporary_password)
            logger.info(f"✅ Temporary password sent to: {email}")
        except Exception as e:
            logger.error(f"❌ Failed to send email to {email}: {e}")
            # Rollback password change if email fails
            db.session.rollback()
            return jsonify({'error': 'Failed to send email. Please try again later.'}), 500
        
        return jsonify({
            'message': 'If this email exists, a temporary password has been sent.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Forgot password error: {e}", exc_info=True)
        return jsonify({'error': 'Failed to process request'}), 500


@bp.route('/change-password', methods=['POST'])
@jwt_required()
@limiter.limit("5 per hour")  # Prevent brute force
def change_password():
    """
    Change user's password (requires authentication)
    
    Headers:
        Authorization: Bearer <access_token>
    
    Request body:
    {
        "current_password": "oldpassword123",
        "new_password": "newpassword123"
    }
    """
    logger = current_app.logger
    
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            logger.warning(f"⚠️ Change password: User not found (ID: {user_id})")
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data:
            logger.warning(f"❌ Change password: No data provided for user {user.email}")
            return jsonify({'error': 'No data provided'}), 400
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        logger.info(f"🔑 Password change request for: {user.email} (ID: {user_id})")
        
        # Validation
        if not current_password or not new_password:
            logger.warning(f"❌ Change password: Missing passwords for {user.email}")
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if len(new_password) < 6:
            logger.warning(f"❌ Change password: Weak password for {user.email}")
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Verify current password
        if not user.check_password(current_password):
            logger.warning(f"❌ Change password: Invalid current password for {user.email}")
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Check if new password is same as current
        if current_password == new_password:
            logger.warning(f"❌ Change password: New password same as current for {user.email}")
            return jsonify({'error': 'New password must be different from current password'}), 400
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        logger.info(f"✅ Password changed successfully for: {user.email} (ID: {user_id})")
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Change password error: {e}", exc_info=True)
        return jsonify({'error': 'Failed to change password'}), 500