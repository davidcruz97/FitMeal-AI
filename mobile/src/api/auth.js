import apiClient from './client';

// Register new user
export const registerUser = async (email, password, fullName) => {
  try {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout (if needed for server-side session cleanup)
export const logoutUser = async () => {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete user account
export const deleteAccount = async () => {
  try {
    const response = await apiClient.delete('/auth/delete-account');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Forgot password - sends temporary password to email
export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Change password - requires authentication
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};