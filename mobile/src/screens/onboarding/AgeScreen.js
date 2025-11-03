// mobile/src/screens/onboarding/AgeScreen.js
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

const AgeScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  
  // Initialize with proper formatting
  const initialAge = onboardingData.age || 25;
  const [age, setAge] = useState(initialAge.toString());

  const handleAgeChange = (text) => {
    // Allow only numbers (no decimals)
    const cleaned = text.replace(/[^0-9]/g, '');
    setAge(cleaned);
  };

  const incrementAge = (amount) => {
    // Parse current value, default to 25 if invalid
    let current = parseInt(age);
    if (isNaN(current)) {
      current = 25;
    }
    
    // Add the amount
    let newAge = current + amount;
    
    // Apply bounds: 15-100 years
    if (newAge < 15) newAge = 15;
    if (newAge > 100) newAge = 100;
    
    // Update state
    setAge(newAge.toString());
  };

  const handleNext = () => {
    // Parse the age
    let userAge = parseInt(age);
    
    // If invalid, use default
    if (isNaN(userAge)) {
      userAge = 25;
    }
    
    // Apply bounds
    if (userAge < 15) userAge = 15;
    if (userAge > 100) userAge = 100;
    
    updateOnboardingData('age', userAge);
    navigation.navigate('OnboardingHeight');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '70%' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>How old are you?</Text>
            <View style={styles.backButton} />
          </View>

          {/* Age Input */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => incrementAge(-5)}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="minus" size={20} color={Colors.primary} />
              </TouchableOpacity>

              <View style={styles.ageInputWrapper}>
                <TextInput
                  style={styles.ageInput}
                  value={age}
                  onChangeText={handleAgeChange}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                />
                <Text style={styles.unitText}>years</Text>
              </View>

              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => incrementAge(5)}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="plus" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Quick adjustment buttons */}
            <View style={styles.quickAdjustContainer}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementAge(-5)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>-5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementAge(-1)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementAge(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => incrementAge(5)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>+5</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.rangeText}>Range: 15-100 years</Text>
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
  ageInputWrapper: {
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
  ageInput: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    padding: 0,
    minWidth: 50,
  },
  unitText: {
    fontSize: 22,
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

export default AgeScreen;