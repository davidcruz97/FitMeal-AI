import apiClient from './client';

// Search ingredients (autocomplete)
export const searchIngredients = async (query, limit = 20) => {
  try {
    const response = await apiClient.get('/ingredients/search', {
      params: { q: query, limit },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all ingredients
export const getAllIngredients = async () => {
  try {
    const response = await apiClient.get('/ingredients');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get ingredient by ID
export const getIngredientById = async (id) => {
  try {
    const response = await apiClient.get(`/ingredients/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get ingredients by category
export const getIngredientsByCategory = async (category) => {
  try {
    const response = await apiClient.get('/ingredients/category', {
      params: { category },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
