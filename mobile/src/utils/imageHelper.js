import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Request camera permission
export const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

// Request media library permission
export const requestMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// Take photo with camera
export const takePhoto = async () => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

// Pick image from gallery
export const pickImage = async () => {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      throw new Error('Media library permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

// Compress image
export const compressImage = async (uri, quality = 0.7) => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }], // Resize to max width 1024px
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

// Create form data for image upload
export const createImageFormData = (imageUri, additionalData = {}) => {
  const formData = new FormData();

  // Extract filename from URI
  const uriParts = imageUri.split('/');
  const fileName = uriParts[uriParts.length - 1];

  // Append image
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: fileName || 'photo.jpg',
  });

  // Append additional fields
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  return formData;
};
