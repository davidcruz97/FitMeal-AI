// mobile/src/screens/onboarding/GoalsScreen.js
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

const GOAL_OPTIONS = [
  { id: 'improve_fitness', label: 'Improve fitness' },
  { id: 'build_muscle', label: 'Build muscle' },
  { id: 'shred_fat', label: 'Shred fat' },
  { id: 'toned_body', label: 'Toned Body' },
  { id: 'weight_loss', label: 'Weight loss' },
  { id: 'improve_mental_health', label: 'Improve mental health' },
  { id: 'balance', label: 'Balance' },
  { id: 'maintain_muscle', label: 'Maintain muscle' },
  { id: 'core_strength', label: 'Core Strength' },
  { id: 'optimize_workouts', label: 'Optimize workouts' },
  { id: 'lean_gains', label: 'Lean gains' },
  { id: 'hormones_regulation', label: 'Hormones regulation' },
];

const GoalsScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedGoals, setSelectedGoals] = useState(onboardingData.fitness_goals || []);

  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleNext = () => {
    updateOnboardingData('fitness_goals', selectedGoals);
    navigation.navigate('OnboardingGender');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '10%' }]} />
        </View> 
        {/* Header with Back Button and Title */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose your goals</Text>
          <View style={styles.backButton} />
        </View> 
        {/* Goal Options */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalPill,
                  isSelected && styles.goalPillSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
              >
                <Text
                  style={[
                    styles.goalText,
                    isSelected && styles.goalTextSelected,
                  ]}
                >
                  {goal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>   
        {/* Next Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              selectedGoals.length === 0 && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={selectedGoals.length === 0}
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
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  goalPill: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    margin: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  goalPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  goalText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  goalTextSelected: {
    color: '#FFF',
    fontWeight: '600',
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

export default GoalsScreen;