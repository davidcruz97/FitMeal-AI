# app/utils/logger.py
"""
Centralized logging configuration for FitMeal-AI
Single log file with INFO/DEBUG levels
"""
import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime


def setup_logger(app):
    """
    Configure application logging
    
    Args:
        app: Flask application instance
    
    Usage:
        - Set LOG_LEVEL=INFO in .env for production (essential info only)
        - Set LOG_LEVEL=DEBUG in .env for development (verbose troubleshooting)
    """
    
    # This prevents duplicate setup in multi-worker environments
    for handler in app.logger.handlers:
        if isinstance(handler, RotatingFileHandler):
            # Already configured with our file handler
            return app.logger
    
    # Create logs directory
    log_dir = '/var/log/fitmeal'
    os.makedirs(log_dir, exist_ok=True)
    
    # Determine log level from environment
    log_level_str = os.getenv('LOG_LEVEL', 'INFO')
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)
    
    # Set Flask app logger level
    app.logger.setLevel(log_level)
    
    # CRITICAL: Disable propagation to prevent duplicate logs
    app.logger.propagate = False
    
    # Remove any default Flask handlers
    app.logger.handlers.clear()
    
    # Create formatters based on log level
    if log_level == logging.DEBUG:
        # DEBUG: Verbose with module, function, and line numbers
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s [%(module)s.%(funcName)s:%(lineno)d]: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        # INFO: Clean and essential only
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    # Single File Handler - All logs in one place
    log_file = os.path.join(log_dir, 'fitmeal.log')
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=20 * 1024 * 1024,  # 20MB
        backupCount=5
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    app.logger.addHandler(file_handler)
    
    # Silence SQLAlchemy echo in production
    if os.getenv('FLASK_ENV') == 'production':
        logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    
    # Startup message (only once per worker)
    app.logger.info("=" * 80)
    app.logger.info(f"🚀 FitMeal-AI Started - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    app.logger.info(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    app.logger.info(f"Log Level: {log_level_str} ({'Verbose Mode' if log_level == logging.DEBUG else 'Essential Mode'})")
    app.logger.info(f"Worker PID: {os.getpid()}")
    app.logger.info("=" * 80)
    
    return app.logger