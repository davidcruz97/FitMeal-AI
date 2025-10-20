import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { takePhoto, pickImage } from '../utils/imageHelper';
import { uploadImageForDetection } from '../api/scan';
import { useScan } from '../context/ScanContext';
import Colors from '../constants/colors';
import LoadingSpinner from '../components/LoadingSpinner';

const CameraScreen = () => {
  const navigation = useNavigation();
  const { updateScan } = useScan();
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleTakePhoto = async () => {
    try {
      const photo = await takePhoto();
      if (photo) {
        setSelectedImage(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    try {
      const image = await pickImage();
      if (image) {
        setSelectedImage(image.uri);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setUploading(true);

    try {
      const result = await uploadImageForDetection(selectedImage, true);

      // Update scan context
      updateScan(result);

      // Navigate to review screen
      navigation.navigate('ReviewIngredients');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
  };

  if (uploading) {
    return <LoadingSpinner message="Detecting ingredients..." />;
  }

  return (
    <View style={styles.container}>
      {selectedImage ? (
        <>
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.preview} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleRetake}
            >
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpload}
            >
              <Text style={styles.primaryButtonText}>
                Detect Ingredients
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>Take a Photo</Text>
            <Text style={styles.emptySubtitle}>
              Capture your ingredients and let AI detect them
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePickImage}
            >
              <Text style={styles.actionIcon}>🖼️</Text>
              <Text style={styles.actionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => navigation.navigate('ManualIngredients')}
          >
            <Text style={styles.manualButtonText}>
              Or add ingredients manually
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualButton: {
    padding: 20,
    alignItems: 'center',
  },
  manualButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CameraScreen;
