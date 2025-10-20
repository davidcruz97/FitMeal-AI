# app/vision/clarifai_detector.py
"""
Clarifai Food Detection Integration
"""
import os
from clarifai_grpc.channel.clarifai_channel import ClarifaiChannel
from clarifai_grpc.grpc.api import resources_pb2, service_pb2, service_pb2_grpc
from clarifai_grpc.grpc.api.status import status_code_pb2


class ClarifaiDetector:
    """Clarifai food detection"""
    
    def __init__(self):
        """Initialize Clarifai client"""
        self.pat = os.getenv('CLARIFAI_PAT')
        
        if not self.pat:
            raise ValueError("CLARIFAI_PAT not found in environment variables")
        
        # Setup channel and stub
        channel = ClarifaiChannel.get_grpc_channel()
        self.stub = service_pb2_grpc.V2Stub(channel)
        
        # Clarifai food model
        self.user_id = 'clarifai'
        self.app_id = 'main'
        self.model_id = 'food-item-recognition'
        self.model_version_id = None  
        
        print("✓ Clarifai detector initialized")
    
    def detect_food(self, image_path, min_confidence=0.5):
        """
        Detect food items in image using Clarifai
        
        Args:
            image_path: Path to image file
            min_confidence: Minimum confidence threshold (0-1)
        
        Returns:
            List of detected food items with confidence
        """
        try:
            # Read image bytes
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
            
            # Create metadata
            metadata = (('authorization', f'Key {self.pat}'),)
            
            # Make prediction request
            request = service_pb2.PostModelOutputsRequest(
                user_app_id=resources_pb2.UserAppIDSet(
                    user_id=self.user_id,
                    app_id=self.app_id
                ),
                model_id=self.model_id,
                version_id=self.model_version_id,
                inputs=[
                    resources_pb2.Input(
                        data=resources_pb2.Data(
                            image=resources_pb2.Image(
                                base64=image_bytes
                            )
                        )
                    )
                ]
            )
            
            response = self.stub.PostModelOutputs(request, metadata=metadata)
            
            # Check if successful
            if response.status.code != status_code_pb2.SUCCESS:
                raise Exception(f"Clarifai request failed: {response.status.description}")
            
            # Parse results
            detections = []
            
            for concept in response.outputs[0].data.concepts:
                confidence = concept.value
                
                if confidence >= min_confidence:
                    detections.append({
                        'class_name': concept.name,
                        'confidence': round(confidence, 3),
                        'source': 'clarifai'
                    })
            
            return {
                'detections': detections,
                'total_detected': len(detections),
                'source': 'clarifai'
            }
            
        except Exception as e:
            print(f"Clarifai detection error: {e}")
            return {
                'error': str(e),
                'detections': [],
                'total_detected': 0
            }


# Singleton instance
_clarifai_instance = None

def get_clarifai_detector():
    """Get or create Clarifai detector instance"""
    global _clarifai_instance
    if _clarifai_instance is None:
        _clarifai_instance = ClarifaiDetector()
    return _clarifai_instance