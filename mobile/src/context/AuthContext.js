import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser } from '../api/auth';
import { saveToken, getToken, saveUser, getUser, clearStorage } from '../utils/storage';
import { getMealHistory, getNutritionStats } from '../api/meals';

const AuthContext = createContext({});

// Minimum splash screen display time (milliseconds)
const MINIMUM_SPLASH_TIME = 2000; // 2 seconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const startTime = Date.now();
    
    try {
      const token = await getToken();
      const userData = await getUser();

      if (token && userData) {
        setUser(userData);
        setIsAuthenticated(true);
        
        // Preload dashboard data while splash screen is showing
        await preloadDashboardData();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      // Ensure splash screen shows for minimum time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_TIME - elapsedTime);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    }
  };

  const preloadDashboardData = async () => {
    try {
      console.log('Preloading dashboard data during splash screen...');
      const [mealsData, statsData] = await Promise.all([
        getMealHistory(1), // Today's meals
        getNutritionStats(1), // Today's stats
      ]);

      setInitialData({
        todayMeals: mealsData.meals || [],
        todayStats: statsData,
        loadedAt: Date.now(),
      });
      
      console.log('Dashboard data preloaded successfully');
    } catch (error) {
      console.error('Error preloading dashboard data:', error);
      // Don't block the app if preloading fails
      setInitialData(null);
    }
  };

  const clearInitialData = () => {
    setInitialData(null);
  };

  const login = async (email, password) => {
    const startTime = Date.now();
    
    try {
      // Show splash screen while logging in
      setIsLoading(true);
      
      const response = await loginUser(email, password);

      // Save token and user data
      await saveToken(response.access_token);
      await saveUser(response.user);

      setUser(response.user);

      // Preload dashboard data for logged in user
      await preloadDashboardData();
      
      // Ensure minimum splash time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_TIME - elapsedTime);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      // Now set authenticated and hide splash
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false); // Hide splash on error
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
  };

  const register = async (email, password, fullName) => {
    const startTime = Date.now();
    
    try {
      // Show splash screen while registering
      setIsLoading(true);
      
      const response = await registerUser(email, password, fullName);

      // Save token and user data
      await saveToken(response.access_token);
      await saveUser(response.user);

      setUser(response.user);

      // Preload dashboard data for new user
      await preloadDashboardData();
      
      // Ensure minimum splash time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_TIME - elapsedTime);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      // Now set authenticated and hide splash
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false); // Hide splash on error
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      };
    }
  };

  const refreshUser = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await apiClient.get('/auth/me');
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const logout = async () => {
    try {
      await clearStorage();
      setUser(null);
      setIsAuthenticated(false);
      setInitialData(null);
      // Note: isLoading stays false, so auth screen shows immediately
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    initialData,
    clearInitialData,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;