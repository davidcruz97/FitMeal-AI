import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/config';
import { getToken, removeToken } from '../utils/storage';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        await removeToken();
        // You can dispatch a logout action here if using Redux
        // or trigger a navigation to login screen
      }

      // Attach user-friendly error message
      error.message = data?.message || data?.error || 'An error occurred';
    } else if (error.request) {
      // Request made but no response received
      error.message = 'Network error. Please check your internet connection.';
    } else {
      // Something else happened
      error.message = 'An unexpected error occurred';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
