# app/vision/claude_detector.py
import os
import base64
import json
from anthropic import Anthropic
import logging

logger = logging.getLogger(__name__)


class ClaudeVisionDetector:
    """Claude-powered ingredient detection using vision API"""
    
    def __init__(self):
        """Initialize Claude client"""
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"  # Latest Sonnet 4.5
        
        logger.info("✓ Claude Vision detector initialized")
    
    def detect_ingredients(self, image_path, min_confidence=0.5):
        """
        Detect food ingredients using Claude Vision
        
        Args:
            image_path: Path to image file
            min_confidence: Minimum confidence threshold (0-1)
        
        Returns:
            Dictionary with detection results
        """
        try:
            # Read and encode image
            with open(image_path, 'rb') as f:
                image_data = base64.standard_b64encode(f.read()).decode('utf-8')
            
            # Determine media type
            ext = image_path.lower().split('.')[-1]
            if ext == 'jpg':
                ext = 'jpeg'
            media_type = f"image/{ext}"
            
            # Create detection prompt
            prompt = self._create_detection_prompt()
            
            # Call Claude Vision API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_data,
                                },
                            },
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ],
                    }
                ],
            )
            
            # Parse response
            response_text = message.content[0].text.strip()
            logger.debug(f"Claude raw response: {response_text}")
            
            # Extract JSON from response
            detections_data = self._extract_json(response_text)
            
            # Process detections
            all_detections = []
            filtered_detections = []
            
            for item in detections_data:
                detection = {
                    'class_name': item['name'].lower().strip(),
                    'confidence': float(item['confidence']),
                    'source': 'claude',
                    'quantity_estimate': item.get('quantity', 'unknown')
                }
                
                all_detections.append(detection)
                
                if detection['confidence'] >= min_confidence:
                    filtered_detections.append(detection)
            
            # Log results
            logger.info(f"🤖 Claude detected {len(all_detections)} items total:")
            for i, det in enumerate(all_detections[:10], 1):
                logger.info(f"   {i}. {det['class_name']}: {det['confidence']:.3f}")
            
            return {
                'detections': filtered_detections,
                'all_detections': all_detections,
                'total_detected': len(filtered_detections),
                'source': 'claude',
                'model': self.model
            }
            
        except Exception as e:
            logger.error(f"❌ Claude detection error: {e}", exc_info=True)
            return {
                'error': str(e),
                'detections': [],
                'total_detected': 0,
                'source': 'claude'
            }
    
    def _create_detection_prompt(self):
        """Create optimized prompt for ingredient detection"""
        return """Analyze this image and identify ALL food ingredients you can see.

For each ingredient, provide:
1. **name**: The specific ingredient name (e.g., "broccoli", "strawberry", "chicken breast")
2. **confidence**: Your confidence level from 0.0 to 1.0
3. **quantity**: Rough estimate like "1 piece", "2 cups", "handful", etc.

IMPORTANT RULES:
- Only identify actual FOOD INGREDIENTS (not plates, utensils, tables, or background objects)
- Use common ingredient names, not prepared dish names
- For fruits/vegetables, use singular form: "strawberry" not "strawberries"
- Be specific: "bell pepper" not just "pepper", "chicken breast" not just "chicken"
- Include ALL visible ingredients, even if small or partially visible
- Be conservative with confidence: only high confidence (>0.8) for clearly visible items
- For items you're less sure about, still include them but with lower confidence (0.3-0.7)

Return ONLY a JSON array, no other text:
[
    {"name": "broccoli", "confidence": 0.95, "quantity": "1 crown"},
    {"name": "strawberry", "confidence": 0.85, "quantity": "2 pieces"},
    {"name": "blueberry", "confidence": 0.90, "quantity": "15-20 pieces"}
]"""
    
    def _extract_json(self, text):
        """
        Extract JSON array from Claude's response
        Handles cases where Claude adds explanation text
        """
        # Try to parse as-is first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Look for JSON array in response
        import re
        
        # Find content between [ and ]
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        
        # If still can't parse, try to find JSON code block
        match = re.search(r'```json\s*(\[.*?\])\s*```', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Last resort: return empty array
        logger.error(f"Failed to parse JSON from Claude response: {text}")
        return []


# Singleton instance
_claude_detector = None

def get_claude_detector():
    """Get or create Claude detector instance"""
    global _claude_detector
    if _claude_detector is None:
        _claude_detector = ClaudeVisionDetector()
    return _claude_detector