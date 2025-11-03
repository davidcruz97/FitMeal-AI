// mobile/src/screens/onboarding/WeightScreen.js
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

const WeightScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  
  // Initialize with proper formatting
  const initialWeight = onboardingData.current_weight_kg || 70;
  const [weightKg, setWeightKg] = useState(initialWeight.toFixed(1));

  const roundToHalf = (value) => {
    return (Math.round(value * 2) / 2).toFixed(1);
  };

  const handleWeightChange = (text) => {
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
    
    setWeightKg(cleaned);
  };

  const incrementWeight = (amount) => {
    // Parse current value, default to 70 if invalid
    let current = parseFloat(weightKg);
    if (isNaN(current)) {
      current = 70;
    }
    
    // Add the amount
    let newWeight = current + amount;
    
    // Apply bounds: 30-200 kg
    if (newWeight < 30) newWeight = 30;
    if (newWeight > 200) newWeight = 200;
    
    // Round to nearest 0.5
    newWeight = Math.round(newWeight * 2) / 2;
    
    // Update state with proper formatting
    setWeightKg(newWeight.toFixed(1));
  };

  const handleNext = () => {
    // Parse the weight
    let weight = parseFloat(weightKg);
    
    // If invalid, use default
    if (isNaN(weight)) {
      weight = 70;
    }
    
    // Apply bounds
    if (weight < 30) weight = 30;
    if (weight > 200) weight = 200;
    
    // Round to nearest 0.5
    weight = Math.round(weight * 2) / 2;
    
    updateOnboardingData('current_weight_kg', weight);
    navigation.navigate('OnboardingWorkoutDays');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '90%' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>What is your current weight?</Text>
            <View style={styles.backButton} />
          </View>

          {/* Weight Input */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => incrementWeight(-5)}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="minus" size={20} color={Colors.primary} />
              </TouchableOpacity>

              <View style={styles.weightInputWrapper}>
                <TextInput
                  style={styles.weightInput}
                  value={weightKg}
                  onChangeText={handleWeightChange}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  selectTextOnFocus
                />
                <Text style={styles.unitText}>kg</Text>
              </View>

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => incrementWeight(5)}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="plus" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Quick adjustment buttons */}
            <View style={styles.quickAdjustContainer}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementWeight(-1)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementWeight(-0.5)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>-0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementWeight(0.5)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>+0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementWeight(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>+1</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.rangeText}>Range: 30-200 kg (rounded to 0.5)</Text>
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
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 200,
  },
  weightInput: {
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

export default WeightScreen;