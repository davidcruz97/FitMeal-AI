// mobile/src/api/meals.js
import apiClient from './client';

// Log a consumed meal with custom ingredients
export const logMeal = async (recipeId, mealType, servings = 1, notes = '', scanId = null, customIngredients = null) => {
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
    'Consumed at', consumed_at,
    'Custom Ingredients', customIngredients
  );
  
  try {
    const payload = {
      recipe_id: recipeId,
      meal_type: mealType,
      servings_consumed: servings,
      notes: notes,
      scan_id: scanId,
      consumed_at: consumed_at,
    };

    // Add custom ingredients if provided
    if (customIngredients) {
      payload.custom_ingredients = customIngredients;
    }

    const response = await apiClient.post('/meals/log', payload);
    return response.data;
  } catch (error) {
    console.error('Log meal error:', error.response?.data || error.message);
    throw error;
  }
};

// Keep other functions unchanged
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

export const getTodayMeals = async () => {
  try {
    const response = await apiClient.get('/meals/today');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMealLog = async (mealLogId) => {
  try {
    const response = await apiClient.delete(`/meals/${mealLogId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};