import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../api/auth';
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
  const [isGuest, setIsGuest] = useState(false);

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
        // Try to fetch fresh user data from API to check profile_completed status
        try {
          const response = await getCurrentUser();
          const freshUserData = response.user;
          
          // Update storage with fresh data
          await saveUser(freshUserData);
          setUser(freshUserData);
          
          // console.log('✅ Loaded fresh user data from API');
          // console.log('   Profile completed:', freshUserData.profile_completed);
        } catch (apiError) {
          // If API fails, use cached data
          // console.log('⚠️  API refresh failed, using cached data:', apiError.message);
          setUser(userData);
        }
        
        setIsAuthenticated(true);
        
        // Preload dashboard data while splash screen is showing (only if profile is complete)
        if (userData.profile_completed) {
          await preloadDashboardData();
        }
      }
    } catch (error) {
      // console.error('Error checking auth status:', error);
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
      // console.log('Preloading dashboard data during splash screen...');
      const [mealsData, statsData] = await Promise.all([
        getMealHistory(1), // Today's meals
        getNutritionStats(1), // Today's stats
      ]);

      setInitialData({
        todayMeals: mealsData.meals || [],
        todayStats: statsData,
        loadedAt: Date.now(),
      });
      
      // console.log('Dashboard data preloaded successfully');
    } catch (error) {
      // console.error('Error preloading dashboard data:', error);
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

      // Preload dashboard data for logged in user (only if profile complete)
      if (response.user.profile_completed) {
        await preloadDashboardData();
      }
      
      // Ensure minimum splash time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_TIME - elapsedTime);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      // Now set authenticated and hide splash
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      // console.error('Login error:', error);
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
      
      // Ensure minimum splash time
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_SPLASH_TIME - elapsedTime);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime));
      
      // Now set authenticated and hide splash
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      // console.error('Registration error:', error);
      setIsLoading(false); // Hide splash on error
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      };
    }
  };

  // Add guest login function after the register function
  const loginAsGuest = async () => {
    try {
      // Create a temporary guest user object
      const guestUser = {
        id: 'guest',
        email: 'guest@fitmeal.app',
        full_name: 'Guest User',
        profile_completed: true,
        is_guest: true,
      };

      setUser(guestUser);
      setIsGuest(true);
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      console.error('Guest login error:', error);
      return {
        success: false,
        message: 'Failed to continue as guest',
      };
    }
  };

  const refreshUser = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Try to fetch from API first
        try {
          const response = await getCurrentUser();
          const updatedUser = response.user;
          
          // Save to storage
          await saveUser(updatedUser);
          
          // Update state
          setUser(updatedUser);
          
          // console.log('User refreshed successfully from API');
          // console.log('   Profile completed:', updatedUser.profile_completed);
        } catch (apiError) {
          // If API call fails, load from storage instead
          // console.log('API refresh failed, loading from storage:', apiError.message);
          const userData = await getUser();
          if (userData) {
            setUser(userData);
            // console.log('User loaded from storage');
          }
        }
      }
    } catch (error) {
      // console.error('Failed to refresh user:', error);
    }
  };

  const logout = async () => {
    try {
      await clearStorage();
      setUser(null);
      setIsAuthenticated(false);
      setIsGuest(false);
      setInitialData(null);
      // Note: isLoading stays false, so auth screen shows immediately
    } catch (error) {
      // console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isGuest,
    initialData,
    clearInitialData,
    login,
    register,
    loginAsGuest,
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