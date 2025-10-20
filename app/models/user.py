# app/models/user.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    """User model with enhanced features"""
    
    __tablename__ = 'users'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Authentication
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile
    full_name = db.Column(db.String(255), nullable=False)
    user_type = db.Column(
        db.String(50), 
        nullable=False, 
        default='user',
        index=True
    )  # 'admin', 'nutritionist', 'user'
    
    # Status & Verification
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verified_at = db.Column(db.DateTime, nullable=True)
    
    # Soft Delete
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps (AUTO-MANAGED)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Last activity tracking
    last_login_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    meal_scans = db.relationship(
        'MealScan', 
        backref='user', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    meal_logs = db.relationship(
        'MealLog', 
        backref='user', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    # Password Methods
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    # Soft Delete Methods
    def soft_delete(self):
        """Soft delete user"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.is_active = False
        db.session.commit()
    
    def restore(self):
        """Restore soft-deleted user"""
        self.is_deleted = False
        self.deleted_at = None
        self.is_active = True
        db.session.commit()
    
    # Utility Methods
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login_at = datetime.utcnow()
        db.session.commit()
    
    def is_admin(self):
        """Check if user is admin"""
        return self.user_type == 'admin'
    
    def is_nutritionist(self):
        """Check if user is nutritionist"""
        return self.user_type in ['admin', 'nutritionist']
    
    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'user_type': self.user_type,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        if include_sensitive:
            data['updated_at'] = self.updated_at.isoformat() if self.updated_at else None
            data['email_verified_at'] = self.email_verified_at.isoformat() if self.email_verified_at else None
        
        return data
    
    @staticmethod
    def get_active_query():
        """Query helper to exclude soft-deleted users"""
        return User.query.filter_by(is_deleted=False)