# app/ai/llm_manager.py
"""
Centralized LLM Management
Handles shared Ollama instance for all AI services across multiple users
"""
from langchain_ollama import OllamaLLM
import logging
import threading

logger = logging.getLogger(__name__)


class LLMManager:
    """
    Singleton LLM manager with warmup capability
    Thread-safe for handling multiple concurrent users
    """
    
    def __init__(self):
        """Initialize shared LLM instance"""
        self._lock = threading.Lock()
        self._is_warmed_up = False
        
        # Shared LLM instance - handles multiple users via Ollama's built-in queuing
        self.llm = OllamaLLM(
            model="llama3.2:3b",
            base_url="http://localhost:11434",
            keep_alive="30m",  # Keep model loaded for 30 minutes
            temperature=0.5  # Default temperature (can be overridden per request)
        )
        logger.info("✓ LLM Manager initialized with model: llama3.2:3b")
    
    def warmup(self):
        """
        Warm up the model by running a simple inference
        Thread-safe for multiple simultaneous warmup calls
        
        Returns:
            bool: True if warmup successful or already warm
        """
        with self._lock:
            if self._is_warmed_up:
                logger.debug("⚡ LLM already warmed up, skipping")
                return True
            
            try:
                logger.info("🔥 Warming up LLM (loading model into RAM)...")
                start_time = __import__('time').time()
                
                # Simple prompt to load model into RAM
                self.llm.invoke("Hi")
                
                elapsed = round(__import__('time').time() - start_time, 2)
                self._is_warmed_up = True
                
                logger.info(f"✅ LLM warmed up successfully in {elapsed}s")
                return True
                
            except Exception as e:
                logger.error(f"❌ LLM warmup failed: {e}", exc_info=True)
                return False
    
    def get_llm(self, temperature=None):
        """
        Get LLM instance with optional temperature override
        
        Args:
            temperature: Override default temperature (0.0 - 1.0)
                        0.0 = Very factual/deterministic
                        0.3 = Factual with slight variation
                        0.5 = Balanced
                        0.7 = More creative
                        1.0 = Very creative
        
        Returns:
            OllamaLLM instance configured for the request
        """
        if temperature is not None and temperature != 0.5:
            logger.debug(f"🌡️ Creating LLM instance with temperature={temperature}")
            # Create instance with custom temperature
            # Note: This doesn't reload the model, just changes generation params
            return OllamaLLM(
                model="llama3.2:3b",
                base_url="http://localhost:11434",
                keep_alive="30m",
                temperature=temperature
            )
        
        # Return default LLM instance
        return self.llm
    
    def is_ready(self):
        """
        Check if model is warmed up and ready
        
        Returns:
            bool: True if model is loaded in RAM
        """
        return self._is_warmed_up
    
    def get_status(self):
        """
        Get current LLM manager status
        
        Returns:
            dict: Status information
        """
        return {
            "model": "llama3.2:3b",
            "warmed_up": self._is_warmed_up,
            "base_url": "http://localhost:11434",
            "keep_alive": "30m"
        }


# ============================================
# Singleton Instance
# ============================================

_llm_manager = None
_manager_lock = threading.Lock()


def get_llm_manager():
    """
    Get or create LLM manager singleton instance
    Thread-safe initialization
    
    Returns:
        LLMManager: Shared LLM manager instance
    """
    global _llm_manager
    
    if _llm_manager is None:
        with _manager_lock:
            # Double-check locking pattern
            if _llm_manager is None:
                logger.info("🚀 Initializing LLM Manager singleton...")
                _llm_manager = LLMManager()
    
    return _llm_manager