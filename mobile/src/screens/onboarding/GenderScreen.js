// mobile/src/screens/onboarding/GenderScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';

const GENDER_OPTIONS = [
  { id: 'female', label: 'Female', icon: 'venus' },
  { id: 'male', label: 'Male', icon: 'mars' },
];

const GenderScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedGender, setSelectedGender] = useState(onboardingData.gender || null);

  const handleNext = () => {
    if (selectedGender) {
      updateOnboardingData('gender', selectedGender);
      navigation.navigate('OnboardingAllergies');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '20%' }]} />
        </View> 
        {/* Header with Back Button and Title */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose your gender</Text>
          <View style={styles.backButton} />
        </View>

        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option) => {
            const isSelected = selectedGender === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.genderCard,
                  isSelected && styles.genderCardSelected,
                ]}
                onPress={() => setSelectedGender(option.id)}
              >
                <Text
                  style={[
                    styles.genderLabel,
                    isSelected && styles.genderLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <FontAwesome5
                  name={option.icon}
                  size={32}
                  color={isSelected ? '#FFF' : '#000'}
                />
              </TouchableOpacity>
            );
          })}
        </View> 
        {/* Next Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedGender && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedGender}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
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
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  genderCard: {
    backgroundColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  genderCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderLabel: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  genderLabelSelected: {
    color: '#FFF',
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
  nextButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default GenderScreen;