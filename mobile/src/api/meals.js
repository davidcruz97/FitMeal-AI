import apiClient from './client';

// Log a consumed meal
export const logMeal = async (recipeId, mealType, servings = 1) => {
  try {
    const response = await apiClient.post('/meals/log', {
      recipe_id: recipeId,
      meal_type: mealType,
      servings,
    });
    return response.data;
  } catch (error) {
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
    const response = await apiClient.delete(`/meals/log/${mealLogId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
