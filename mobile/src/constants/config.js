// API Configuration
// For local development, use your computer's IP address instead of localhost
// To find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)

// Development - Use this when running on a physical device or emulator
export const API_BASE_URL = 'http://192.168.1.100:8001/api'; // Replace with your computer's IP

// Production - Uncomment when deploying
// export const API_BASE_URL = 'https://fitmeal.cinturillas247.com/api';

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds (for image uploads)

// Image upload settings
export const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
export const IMAGE_QUALITY = 0.7;
