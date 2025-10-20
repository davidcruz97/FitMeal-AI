import apiClient from './client';

// Match recipes based on ingredients
export const matchRecipes = async (ingredientIds, maxResults = 10) => {
  try {
    const response = await apiClient.post('/recipes/match', {
      ingredient_ids: ingredientIds,
      max_results: maxResults,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all recipes
export const getAllRecipes = async (category = null, limit = 50) => {
  try {
    const params = { limit };
    if (category) {
      params.category = category;
    }
    const response = await apiClient.get('/recipes', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get recipe by ID
export const getRecipeById = async (id) => {
  try {
    const response = await apiClient.get(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Search recipes by name
export const searchRecipes = async (query, limit = 20) => {
  try {
    const response = await apiClient.get('/recipes/search', {
      params: { q: query, limit },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
