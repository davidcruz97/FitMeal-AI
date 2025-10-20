# app/vision/detector.py
import os
import torch
from ultralytics import YOLO
from PIL import Image
import cv2
import numpy as np
from datetime import datetime

class IngredientDetector:
    """YOLOv8-based ingredient detector"""
    
    def __init__(self, model_path='app/vision/models/yolov8n.pt'):
        """Initialize the detector with YOLOv8 model"""
        self.model_path = model_path
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load YOLOv8 model"""
        try:
            # We trust the official YOLOv8 model from Ultralytics; downloaded direct from their official repo
            import torch
            
            # Monkey-patch torch.load to use weights_only=False
            original_load = torch.load
            def patched_load(f, *args, **kwargs):
                kwargs['weights_only'] = False
                return original_load(f, *args, **kwargs)
            torch.load = patched_load
            
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model not found at {self.model_path}")
            
            self.model = YOLO(self.model_path)
            
            # Restore original torch.load
            torch.load = original_load
            
            print(f"✓ YOLOv8 model loaded from {self.model_path}")
            
        except Exception as e:
            print(f"✗ Failed to load YOLOv8 model: {e}")
            raise
    
    def detect_ingredients(self, image_path, conf_threshold=0.25, max_det=10):
        """
        Detect ingredients in an image
        
        Args:
            image_path: Path to the image file
            conf_threshold: Confidence threshold (0-1)
            max_det: Maximum number of detections
        
        Returns:
            List of detected objects with labels and confidence scores
        """
        try:
            start_time = datetime.now()
            
            # Run detection
            results = self.model(
                image_path,
                conf=conf_threshold,
                max_det=max_det,
                verbose=False
            )
            
            # Process results
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    class_name = result.names[class_id]
                    
                    detections.append({
                        'class_id': class_id,
                        'class_name': class_name,
                        'confidence': round(confidence, 3),
                        'bbox': box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    })
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                'detections': detections,
                'total_detected': len(detections),
                'processing_time_ms': round(processing_time, 2),
                'model': 'yolov8n',
                'confidence_threshold': conf_threshold
            }
            
        except Exception as e:
            return {
                'error': f'Detection failed: {str(e)}',
                'detections': [],
                'total_detected': 0
            }
    
    def get_supported_classes(self):
        """Get list of classes the model can detect"""
        if self.model:
            return self.model.names
        return {}


# Singleton instance
_detector_instance = None

def get_detector():
    """Get or create detector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = IngredientDetector()
    return _detector_instance
