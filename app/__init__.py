# app/__init__.py
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from redis import Redis
from config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cache = Cache()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri=None
)

# Redis client (for custom operations)
redis_client = None


def create_app(config_name=None):
    """Application factory pattern"""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cache.init_app(app)
    app.config['RATELIMIT_STORAGE_URI'] = app.config['RATELIMIT_STORAGE_URL']
    limiter.init_app(app)
    
    # Initialize CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         methods=app.config['CORS_METHODS'],
         allow_headers=app.config['CORS_ALLOW_HEADERS'],
         supports_credentials=True)
    
    # Initialize Redis client
    global redis_client
    try:
        redis_client = Redis.from_url(
            app.config['REDIS_URL'],
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True
        )
        # Test connection
        redis_client.ping()
        app.logger.info("✓ Redis connected successfully")
    except Exception as e:
        app.logger.warning(f"⚠ Redis connection failed: {e}")
        app.logger.warning("⚠ Running without Redis (caching & rate limiting disabled)")
        redis_client = None
    
    # Create upload directories
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'recipes'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'scans'), exist_ok=True)
    
    # Register blueprints
    with app.app_context():
        # API Blueprints (for mobile app)
        try:
            from app.api import auth as api_auth
            app.register_blueprint(api_auth.bp, url_prefix='/api/auth')
            from app.api import scan as api_scan
            app.register_blueprint(api_scan.bp, url_prefix='/api/scan')
            from app.api import ingredients as api_ingredients
            app.register_blueprint(api_ingredients.bp, url_prefix='/api/ingredients')
            from app.api import recipes as api_recipes
            app.register_blueprint(api_recipes.bp, url_prefix='/api/recipes')
            from app.api import meals as api_meals
            app.register_blueprint(api_meals.bp, url_prefix='/api/meals')
        except Exception as e:
            app.logger.warning(f"Could not register API blueprints for mobile app: {e}")
          
        # Admin Web Panel Blueprints
        try:
            # from app.admin import routes as admin_routes
            # from app.auth import routes as auth_routes

            # app.register_blueprint(auth_routes.bp, url_prefix='/auth')
            # app.register_blueprint(admin_routes.bp, url_prefix='/admin')
            pass  # Placeholder for future implementation
        except Exception as e:
            app.logger.warning(f"Could not register admin blueprints: {e}")
        
        # Register error handlers
        register_error_handlers(app)
        
        # Register CLI commands
        register_commands(app)
    
    @app.route('/health')
    def health_check():
        """Health check endpoint"""
        from sqlalchemy import text
        
        health_status = {
            'status': 'healthy',
            'database': 'unknown',
            'redis': 'unknown'
        }
        
        # Check database
        try:
            db.session.execute(text('SELECT 1'))
            health_status['database'] = 'connected'
        except Exception as e:
            health_status['database'] = f'error: {str(e)}'
            health_status['status'] = 'unhealthy'
        
        # Check Redis
        if redis_client:
            try:
                redis_client.ping()
                health_status['redis'] = 'connected'
            except Exception as e:
                health_status['redis'] = f'error: {str(e)}'
        else:
            health_status['redis'] = 'not configured'
        
        return health_status, 200 if health_status['status'] == 'healthy' else 503
    
    @app.route('/')
    def index():
        """Root endpoint"""
        return {
            'message': 'FitMeal-AI API',
            'version': '1.0.0',
            'endpoints': {
                'api': '/api',
                'admin': '/admin',
                'health': '/health'
            }
        }
    
    return app


def register_error_handlers(app):
    """Register error handlers"""
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return {
            'error': 'Rate limit exceeded',
            'message': str(e.description)
        }, 429


def register_commands(app):
    """Register CLI commands"""
    
    @app.cli.command()
    def init_db():
        """Initialize the database with sample data"""
        from app.models.user import User
        from app.utils.db_init import initialize_database
        
        print("Initializing database...")
        initialize_database()
        print("✓ Database initialized successfully!")
    
    @app.cli.command()
    def clear_cache():
        """Clear all Redis cache"""
        if redis_client:
            redis_client.flushdb()
            print("✓ Cache cleared successfully!")
        else:
            print("⚠ Redis not available")