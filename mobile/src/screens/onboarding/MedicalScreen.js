// mobile/src/screens/onboarding/MedicalScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';

const MEDICAL_CONDITIONS = [
  { id: 'hypothyroidism', label: 'Hypothyroidism', icon: 'procedures' },
  { id: 'eating_disorder_anemia', label: 'Anemia', icon: 'heartbeat' },
  { id: 'eating_disorder_anorexia', label: 'Anorexia', icon: 'user-md' },
  { id: 'eating_disorder_bulimia', label: 'Bulimia', icon: 'user-md' },
  { id: 'eating_disorder_compulsive', label: 'Compulsive eating', icon: 'utensils' },
  { id: 'special_medications', label: 'Special medications', icon: 'pills' },
  { id: 'pregnancy_intention', label: 'Pregnancy intention', icon: 'baby', femaleOnly: true },
  { id: 'polycystic_ovary', label: 'Polycystic ovary syndrome', icon: 'venus', femaleOnly: true },
  { id: 'infertility', label: 'Infertility', icon: 'heart-broken' },
  { id: 'acne', label: 'Acne', icon: 'spa' },
  { id: 'insulin_resistance', label: 'Insulin resistance', icon: 'syringe' },
  { id: 'diabetes', label: 'Diabetes', icon: 'notes-medical' },
];

const MedicalScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedConditions, setSelectedConditions] = useState(
    onboardingData.medical_conditions || []
  );

  const userGender = onboardingData.gender;

  // Filter out female-only conditions if user is male
  const availableConditions = MEDICAL_CONDITIONS.filter(condition => {
    if (condition.femaleOnly && userGender !== 'female') {
      return false;
    }
    return true;
  });

  const toggleCondition = (conditionId) => {
    if (selectedConditions.includes(conditionId)) {
      setSelectedConditions(selectedConditions.filter(id => id !== conditionId));
    } else {
      setSelectedConditions([...selectedConditions, conditionId]);
    }
  };

  const handleNext = () => {
    updateOnboardingData('medical_conditions', selectedConditions);
    navigation.navigate('OnboardingActivity');
  };

  const handleSkip = () => {
    updateOnboardingData('medical_conditions', []);
    navigation.navigate('OnboardingActivity');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '40%' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Medical conditions</Text>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Select any that apply (optional)
      </Text>

      {/* Conditions List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.conditionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {availableConditions.map((condition) => {
          const isSelected = selectedConditions.includes(condition.id);
          return (
            <TouchableOpacity
              key={condition.id}
              style={[
                styles.conditionCard,
                isSelected && styles.conditionCardSelected,
              ]}
              onPress={() => toggleCondition(condition.id)}
            >
              <View style={styles.conditionContent}>
                <FontAwesome5
                  name={condition.icon}
                  size={20}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                  style={styles.conditionIcon}
                />
                <Text
                  style={[
                    styles.conditionLabel,
                    isSelected && styles.conditionLabelSelected,
                  ]}
                >
                  {condition.label}
                </Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && (
                  <FontAwesome5 name="check" size={12} color={Colors.textLight} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
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
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  skipButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  conditionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  conditionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF',
  },
  conditionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conditionIcon: {
    marginRight: 12,
    width: 24,
  },
  conditionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  conditionLabelSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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

export default MedicalScreen;