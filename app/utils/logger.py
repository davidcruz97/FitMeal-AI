# app/utils/logger.py
import logging
import os
import uuid
from logging.handlers import RotatingFileHandler
from datetime import datetime
from flask import request, has_request_context, g


def setup_logger(app):
    """
    Configure application logging with enhanced features
    
    Args:
        app: Flask application instance
    
    Usage:
        - Set LOG_LEVEL=INFO in .env for production (essential info only)
        - Set LOG_LEVEL=DEBUG in .env for development (verbose troubleshooting)
    """
    
    # Check if OUR custom file handler already exists
    for handler in app.logger.handlers:
        if isinstance(handler, RotatingFileHandler):
            return app.logger
    
    # Create logs directory
    log_dir = '/var/log/fitmeal'
    os.makedirs(log_dir, exist_ok=True)
    
    # Determine log level from environment
    log_level_str = os.getenv('LOG_LEVEL', 'INFO')
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)
    
    # Set Flask app logger level
    app.logger.setLevel(log_level)
    
    # Disable propagation to prevent duplicate logs
    app.logger.propagate = False
    
    # Remove any default Flask handlers
    app.logger.handlers.clear()
    
    # Create custom formatter with request context
    formatter = EnhancedFormatter(
        '[%(asctime)s] %(levelname)-8s [%(request_id)s] [%(module)s.%(funcName)s:%(lineno)d] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Single File Handler - All logs in one place
    log_file = os.path.join(log_dir, 'fitmeal.log')
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=10
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    app.logger.addHandler(file_handler)
    
    # Silence noisy loggers
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    
    # Register request hooks for tracking
    register_request_logging(app)
    
    # Startup message
    app.logger.info("=" * 100)
    app.logger.info(f"🚀 FitMeal-AI Worker Started [PID: {os.getpid()}]")
    app.logger.info(f"   Environment: {os.getenv('FLASK_ENV', 'development')}")
    app.logger.info(f"   Log Level: {log_level_str} ({'Verbose' if log_level == logging.DEBUG else 'Essential'} Mode)")
    app.logger.info(f"   Log File: {log_file}")
    app.logger.info("=" * 100)
    
    return app.logger


class EnhancedFormatter(logging.Formatter):
    """Custom formatter that adds request context"""
    
    def format(self, record):
        # Add request ID if available
        if has_request_context():
            if not hasattr(g, 'request_id'):
                g.request_id = str(uuid.uuid4())[:8]
            record.request_id = g.request_id
        else:
            record.request_id = '--------'
        
        # Format the message
        formatted = super().format(record)
        
        return formatted


def register_request_logging(app):
    """Register before/after request handlers for automatic request logging"""
    
    @app.before_request
    def log_request_start():
        """Log incoming request with unique ID"""
        if not hasattr(g, 'request_id'):
            g.request_id = str(uuid.uuid4())[:8]
        
        g.start_time = datetime.now()
        
        # Log incoming request
        app.logger.info("=" * 100)
        app.logger.info(f"📨 Incoming Request: {request.method} {request.path}")
        
        if request.method in ['POST', 'PUT', 'PATCH']:
            # Log request details for mutations
            if request.is_json:
                # Don't log passwords
                data = request.get_json()
                if isinstance(data, dict):
                    safe_data = {k: '***' if 'password' in k.lower() else v 
                                for k, v in data.items()}
                    app.logger.debug(f"   Request Body: {safe_data}")
            elif request.files:
                files = list(request.files.keys())
                app.logger.debug(f"   Files: {files}")
        
        # Log query parameters
        if request.args:
            app.logger.debug(f"   Query Params: {dict(request.args)}")
        
        # Log user info if authenticated
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                app.logger.debug(f"   User ID: {user_id}")
        except:
            pass
    
    @app.after_request
    def log_request_end(response):
        """Log request completion with performance metrics"""
        if hasattr(g, 'start_time'):
            duration = (datetime.now() - g.start_time).total_seconds() * 1000
            
            # Choose emoji based on status code
            if response.status_code < 300:
                emoji = "✅"
                level = logging.INFO
            elif response.status_code < 400:
                emoji = "🔄"
                level = logging.INFO
            elif response.status_code < 500:
                emoji = "⚠️"
                level = logging.WARNING
            else:
                emoji = "❌"
                level = logging.ERROR
            
            app.logger.log(
                level,
                f"{emoji} Response: {response.status_code} | Duration: {duration:.2f}ms | "
                f"Size: {response.content_length or 0} bytes"
            )
            app.logger.info("=" * 100)
        
        return response
    
    @app.errorhandler(Exception)
    def log_exception(e):
        """Log unhandled exceptions with full context"""
        app.logger.error("=" * 100)
        app.logger.error(f"💥 UNHANDLED EXCEPTION: {type(e).__name__}: {str(e)}")
        app.logger.error(f"   Path: {request.method} {request.path}")
        app.logger.error(f"   User Agent: {request.user_agent}")
        app.logger.error(f"   Remote Address: {request.remote_addr}")
        app.logger.exception("   Stack Trace:")
        app.logger.error("=" * 100)
        raise


# Utility functions for structured logging

def log_detection_start(logger, image_path, user_id=None):
    """Log the start of image detection"""
    logger.info("🔍 " + "=" * 96)
    logger.info(f"🔍 Starting Ingredient Detection")
    logger.info(f"   Image: {image_path}")
    if user_id:
        logger.info(f"   User ID: {user_id}")
    logger.info("🔍 " + "=" * 96)


def log_detection_result(logger, detections, processing_time_ms):
    """Log detection results in a structured format"""
    logger.info("🎉 " + "=" * 96)
    logger.info(f"🎉 Detection Complete: {len(detections)} ingredients found in {processing_time_ms:.0f}ms")
    
    if detections:
        logger.info("   Detected Ingredients:")
        for i, det in enumerate(detections, 1):
            confidence_emoji = "🟢" if det['confidence'] > 0.7 else "🟡" if det['confidence'] > 0.4 else "🔴"
            logger.info(
                f"     {i}. {confidence_emoji} {det['ingredient_name']} "
                f"({det['confidence']*100:.1f}% confidence) - Source: {det.get('source', 'unknown')}"
            )
    else:
        logger.warning("   ⚠️  No ingredients detected!")
    
    logger.info("🎉 " + "=" * 96)


def log_performance(logger, operation, duration_ms, success=True):
    """Log performance metrics for operations"""
    emoji = "⚡" if success else "🐌"
    status = "SUCCESS" if success else "FAILED"
    logger.info(f"{emoji} Performance | {operation}: {duration_ms:.2f}ms | {status}")


def log_api_call(logger, service, endpoint, status_code, duration_ms):
    """Log external API calls"""
    emoji = "✅" if status_code < 300 else "❌"
    logger.info(
        f"{emoji} API Call | {service} | {endpoint} | "
        f"Status: {status_code} | Duration: {duration_ms:.2f}ms"
    )