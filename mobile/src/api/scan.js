import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/config';
import { getToken } from '../utils/storage';

// Upload image for ingredient detection
export const uploadImageForDetection = async (imageUri, autoDetect = true) => {
  try {
    const token = await getToken();

    const formData = new FormData();

    // Extract filename from URI
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1];

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName || 'photo.jpg',
    });
    formData.append('auto_detect', autoDetect.toString());

    const response = await axios.post(
      `${API_BASE_URL}/scan`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: REQUEST_TIMEOUT,
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Upload failed');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
};

// Get scan history
export const getScanHistory = async (limit = 20) => {
  try {
    const token = await getToken();
    const response = await axios.get(
      `${API_BASE_URL}/scan/history?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get scan by ID
export const getScanById = async (scanId) => {
  try {
    const token = await getToken();
    const response = await axios.get(
      `${API_BASE_URL}/scan/${scanId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
