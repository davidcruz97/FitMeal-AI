// mobile/src/screens/onboarding/HeightScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';

const HeightScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  
  // Initialize with proper formatting
  const initialHeight = onboardingData.height_cm || 170;
  const [heightCm, setHeightCm] = useState(initialHeight.toFixed(1));

  const handleHeightChange = (text) => {
    // Replace commas with dots
    let cleaned = text.replace(/,/g, '.');
    
    // Allow only numbers and one decimal point
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    // Limit decimal places to 1
    if (parts.length === 2) {
      if (parts[1].length > 1) return;
    }
    
    setHeightCm(cleaned);
  };

  const incrementHeight = (amount) => {
    // Parse current value, default to 170 if invalid
    let current = parseFloat(heightCm);
    if (isNaN(current)) {
      current = 170;
    }
    
    // Add the amount
    let newHeight = current + amount;
    
    // Apply bounds: 120-250 cm
    if (newHeight < 120) newHeight = 120;
    if (newHeight > 250) newHeight = 250;
    
    // Round to nearest 0.5
    newHeight = Math.round(newHeight * 2) / 2;
    
    // Update state with proper formatting
    setHeightCm(newHeight.toFixed(1));
  };

  const handleNext = () => {
    // Parse the height
    let height = parseFloat(heightCm);
    
    // If invalid, use default
    if (isNaN(height)) {
      height = 170;
    }
    
    // Apply bounds
    if (height < 120) height = 120;
    if (height > 250) height = 250;
    
    // Round to nearest 0.5
    height = Math.round(height * 2) / 2;
    
    updateOnboardingData('height_cm', height);
    navigation.navigate('OnboardingWeight');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '80%' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>How tall are you?</Text>
            <View style={styles.backButton} />
          </View>

          {/* Height Input */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => incrementHeight(-5)}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="minus" size={20} color={Colors.primary} />
              </TouchableOpacity>

              <View style={styles.heightInputWrapper}>
                <TextInput
                  style={styles.heightInput}
                  value={heightCm}
                  onChangeText={handleHeightChange}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  selectTextOnFocus
                />
                <Text style={styles.unitText}>cm</Text>
              </View>

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => incrementHeight(5)}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="plus" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Quick adjustment buttons */}
            <View style={styles.quickAdjustContainer}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementHeight(-1)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementHeight(-0.5)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>-0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementHeight(0.5)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>+0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementHeight(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>+1</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.rangeText}>Range: 120-250 cm (rounded to 0.5)</Text>
          </View>

          {/* Next Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  inputSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  heightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 210,
  },
  heightInput: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    padding: 0,
    minWidth: 50,
  },
  unitText: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  quickAdjustContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  rangeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default HeightScreen;