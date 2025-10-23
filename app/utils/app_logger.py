# app/utils/logger.py
"""
Centralized logging configuration for FitMeal-AI
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
    """
    
    # Create logs directory
    log_dir = 'logs'
    os.makedirs(log_dir, exist_ok=True)
    
    # Determine log level from environment
    log_level_str = os.getenv('LOG_LEVEL', 'INFO')
    log_level = getattr(logging, log_level_str.upper(), logging.INFO)
    
    # Set Flask app logger level
    app.logger.setLevel(log_level)
    
    # Remove default handlers
    app.logger.handlers.clear()
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s (%(funcName)s:%(lineno)d): %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    simple_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console Handler (for development)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if app.debug else logging.INFO)
    console_handler.setFormatter(simple_formatter)
    app.logger.addHandler(console_handler)
    
    # File Handler - General Application Logs
    app_log_file = os.path.join(log_dir, 'fitmeal_app.log')
    app_file_handler = RotatingFileHandler(
        app_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    app_file_handler.setLevel(logging.INFO)
    app_file_handler.setFormatter(detailed_formatter)
    app.logger.addHandler(app_file_handler)
    
    # File Handler - Error Logs Only
    error_log_file = os.path.join(log_dir, 'fitmeal_errors.log')
    error_file_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(detailed_formatter)
    app.logger.addHandler(error_file_handler)
    
    # File Handler - Vision/Detection Logs (for debugging CV issues)
    vision_log_file = os.path.join(log_dir, 'fitmeal_vision.log')
    vision_file_handler = RotatingFileHandler(
        vision_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=3
    )
    vision_file_handler.setLevel(logging.DEBUG)
    vision_file_handler.setFormatter(detailed_formatter)
    
    # Create vision logger
    vision_logger = logging.getLogger('fitmeal.vision')
    vision_logger.setLevel(logging.DEBUG)
    vision_logger.addHandler(vision_file_handler)
    vision_logger.addHandler(console_handler)  # Also log to console
    
    # Prevent propagation to root logger
    vision_logger.propagate = False
    
    app.logger.info("=" * 80)
    app.logger.info(f"FitMeal-AI Application Started - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    app.logger.info(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    app.logger.info(f"Log Level: {log_level_str}")
    app.logger.info("=" * 80)
    
    return app.logger


def get_vision_logger():
    """Get the vision-specific logger"""
    return logging.getLogger('fitmeal.vision')


# Helper functions for consistent logging
class VisionLogger:
    """Helper class for vision/detection logging"""
    
    def __init__(self):
        self.logger = get_vision_logger()
    
    def log_detection_start(self, image_path, method):
        """Log start of detection"""
        self.logger.info(f"🎯 Starting {method} detection for: {image_path}")
    
    def log_detection_result(self, method, total_detected, processing_time_ms):
        """Log detection results"""
        self.logger.info(
            f"✅ {method} completed: {total_detected} items detected in {processing_time_ms:.0f}ms"
        )
    
    def log_detection_error(self, method, error):
        """Log detection error"""
        self.logger.error(f"❌ {method} failed: {str(error)}", exc_info=True)
    
    def log_mapping_start(self, detections_count, source):
        """Log start of ingredient mapping"""
        self.logger.debug(f"🔄 Mapping {detections_count} {source} detections to ingredients...")
    
    def log_mapping_result(self, matched_count, unmatched_count, source):
        """Log mapping results"""
        self.logger.info(
            f"📊 {source} mapping: {matched_count} matched, {unmatched_count} unmatched"
        )
    
    def log_unmatched_detection(self, detection_name, source):
        """Log unmatched detection for investigation"""
        self.logger.warning(f"⚠️  Unmatched {source} detection: '{detection_name}'")
    
    def log_matched_ingredient(self, detection_name, ingredient_name, confidence):
        """Log successful ingredient match"""
        self.logger.debug(
            f"✓ Matched '{detection_name}' → '{ingredient_name}' (conf: {confidence:.2f})"
        )
    
    def log_merge_result(self, yolo_count, clarifai_count, final_count):
        """Log merge results"""
        self.logger.info(
            f"🔗 Merged results: YOLO({yolo_count}) + Clarifai({clarifai_count}) = {final_count} unique ingredients"
        )


# Singleton instance
_vision_logger = None

def get_vision_logger_instance():
    """Get or create vision logger instance"""
    global _vision_logger
    if _vision_logger is None:
        _vision_logger = VisionLogger()
    return _vision_logger