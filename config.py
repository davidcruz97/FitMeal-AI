import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration"""
    
    # Flask Core
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://localhost/fitmeal_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 604800)))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_IDENTITY_CLAIM = 'sub'
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Redis Configuration
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Flask-Caching Configuration (for autocomplete, recipes, etc.)
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.getenv('CACHE_REDIS_URL', 'redis://localhost:6379/1')
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes default
    CACHE_KEY_PREFIX = 'fitmeal:'
    
    # Rate Limiting Configuration
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'redis://localhost:6379/2')
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '200 per day;50 per hour')
    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_SWALLOW_ERRORS = True  # Don't crash if Redis is down
    
    # Upload Configuration
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 5 * 1024 * 1024))  # 5MB
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'app/static/uploads')
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'jpg,jpeg,png,webp').split(','))
    
    # YOLOv8 Configuration
    YOLO_MODEL_PATH = os.getenv('YOLO_MODEL_PATH', 'app/vision/models/yolov8n.pt')
    YOLO_CONF_THRESHOLD = float(os.getenv('YOLO_CONF_THRESHOLD', 0.25))
    YOLO_MAX_DET = int(os.getenv('YOLO_MAX_DET', 10))
    YOLO_IMG_SIZE = 640  # Max image size for processing
    
    # USDA API Configuration
    USDA_API_KEY = os.getenv('USDA_API_KEY', '')
    USDA_API_URL = os.getenv('USDA_API_URL', 'https://api.nal.usda.gov/fdc/v1')
    
    # CORS Configuration (for mobile app)
    CORS_ORIGINS = ['*']  # In production, specify your mobile app domains
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    
    # Pagination
    ITEMS_PER_PAGE = 20
    MAX_ITEMS_PER_PAGE = 100


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True  # Log SQL queries


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    
    # Stricter rate limits in production
    RATELIMIT_DEFAULT = '100 per day;20 per hour'
    
    # Specific CORS origins in production
    CORS_ORIGINS = [
        'https://fitmeal.cinturillas247.com',
        'https://api.fitmeal.cinturillas247.com'
    ]


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://localhost/fitmeal_test_db'
    
    # Disable rate limiting in tests
    RATELIMIT_ENABLED = False
    
    # Use simple cache for testing
    CACHE_TYPE = 'simple'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}