// mobile/src/api/ai.js
import client from './client';

/**
 * Warm up the AI model
 * Call this when user opens AI features for faster responses
 */
export const warmupAI = async () => {
  try {
    const response = await client.post('/ai/warmup');
    return response.data;
  } catch (error) {
    console.error('Warmup AI error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get AI system status
 */
export const getAIStatus = async () => {
  try {
    const response = await client.get('/ai/status');
    return response.data;
  } catch (error) {
    console.error('Get AI status error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get meal recommendations from AI
 * 
 * @param {Object} params
 * @param {string[]} params.available_ingredients - Optional list of ingredient names
 * @param {string} params.meal_type - Optional: 'breakfast', 'lunch', 'dinner', 'snack'
 */
export const getMealRecommendations = async (params = {}) => {
  try {
    const response = await client.post('/ai/recommend-meals', params);
    return response.data;
  } catch (error) {
    console.error('Get meal recommendations error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Ask a nutrition question and get personalized advice
 * 
 * @param {string} question - The nutrition question to ask
 */
export const askNutritionQuestion = async (question) => {
  try {
    const response = await client.post('/ai/ask-nutrition', { question });
    return response.data;
  } catch (error) {
    console.error('Ask nutrition question error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get meal timing suggestions based on workout schedule
 */
export const getMealTiming = async () => {
  try {
    const response = await client.get('/ai/meal-timing');
    return response.data;
  } catch (error) {
    console.error('Get meal timing error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get explanation of a macronutrient
 * 
 * @param {string} macroName - 'protein', 'carbs', 'fats', 'calories', 'fiber', 'hydration'
 */
export const explainMacro = async (macroName) => {
  try {
    const response = await client.get(`/ai/explain/${macroName}`);
    return response.data;
  } catch (error) {
    console.error('Explain macro error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Generate recipe for specific macro targets
 * 
 * @param {Object} targets
 * @param {number} targets.target_calories
 * @param {number} targets.target_protein
 * @param {number} targets.target_carbs
 * @param {number} targets.target_fats
 * @param {string} targets.meal_type - Optional
 * @param {string[]} targets.dietary_restrictions - Optional
 */
export const generateRecipeForMacros = async (targets) => {
  try {
    const response = await client.post('/ai/recipe-for-macros', targets);
    return response.data;
  } catch (error) {
    console.error('Generate recipe error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Modify a recipe to better fit user's goals
 * 
 * @param {Object} params
 * @param {string} params.recipe_name
 * @param {string[]} params.recipe_ingredients
 */
export const modifyRecipe = async (params) => {
  try {
    const response = await client.post('/ai/modify-recipe', params);
    return response.data;
  } catch (error) {
    console.error('Modify recipe error:', error.response?.data || error.message);
    throw error;
  }
};