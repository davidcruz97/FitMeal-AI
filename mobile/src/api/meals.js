// mobile/src/api/meals.js
import apiClient from './client';

// Log a consumed meal
export const logMeal = async (recipeId, mealType, servings = 1, notes = '', scanId = null) => {
  // Get local time in ISO format with timezone offset
  const now = new Date();
  const localISOTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);
  const timezoneOffset = -now.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const consumed_at = `${localISOTime}${offsetSign}${offsetHours}:${offsetMinutes}`;
  
  console.log('Logging meal with the following details:',
    'Recipe ID', recipeId,
    'Meal Type', mealType,
    'Consumed at', consumed_at
  );
  
  try {
    const response = await apiClient.post('/meals/log', {
      recipe_id: recipeId,
      meal_type: mealType,
      servings_consumed: servings,
      notes: notes,
      scan_id: scanId,
      consumed_at: consumed_at,
    });
    return response.data;
  } catch (error) {
    console.error('Log meal error:', error.response?.data || error.message);
    throw error;
  }
};

// Get meal history
export const getMealHistory = async (days = 7) => {
  try {
    const response = await apiClient.get('/meals/history', {
      params: { days },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get nutrition statistics
export const getNutritionStats = async (days = 7) => {
  try {
    const response = await apiClient.get('/meals/stats', {
      params: { days },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get today's meals
export const getTodayMeals = async () => {
  try {
    const response = await apiClient.get('/meals/today');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete meal log
export const deleteMealLog = async (mealLogId) => {
  try {
    const response = await apiClient.delete(`/meals/${mealLogId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};