// mobile/src/screens/onboarding/WorkoutDaysScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import Colors from '../../constants/colors';
import apiClient from '../../api/client';

const DAYS = [
  { id: 'sunday', label: 'Sunday' },
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
];

const WorkoutDaysScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData, setIsViewingResults } = useOnboarding();
  const [selectedDays, setSelectedDays] = useState(onboardingData.workout_days || []);
  const [loading, setLoading] = useState(false);

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(id => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleComplete = async () => {
    if (selectedDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one workout day');
      return;
    }

    setLoading(true);

    try {
      // Prepare the complete onboarding data
      const completeData = {
        fitness_goals: onboardingData.fitness_goals,
        gender: onboardingData.gender,
        food_allergies: onboardingData.food_allergies,
        medical_conditions: onboardingData.medical_conditions,
        activity_level: onboardingData.activity_level,
        lifting_experience: onboardingData.lifting_experience,
        age: onboardingData.age,
        height: onboardingData.height_cm,
        weight: onboardingData.current_weight_kg,
        workout_days: selectedDays,
      };

      console.log('Submitting onboarding data:', completeData);

      // Submit to backend
      const response = await apiClient.post('/onboarding/complete', completeData);

      console.log('Onboarding response:', response.data);

      // Store the updated user data in onboarding context temporarily
      updateOnboardingData('completedUserData', response.data.user);
      
      // Set flag to indicate we're viewing results (prevents AppNavigator from switching)
      setIsViewingResults(true);

      // Navigate to processing screen
      navigation.navigate('OnboardingProcessing');
      
    } catch (error) {
      console.error('Onboarding submission error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to complete onboarding. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '100%' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Select rest days</Text>
        <View style={styles.backButton} />
      </View>

      <Text style={styles.subtitle}>
        We recommend you lift at least 4 days a week
      </Text>

      {/* Days List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.daysContainer}
        showsVerticalScrollIndicator={false}
      >
        {DAYS.map((day) => {
          const isWorkoutDay = selectedDays.includes(day.id);
          return (
            <View key={day.id} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => toggleDay(day.id)}
              >
                <View
                  style={[
                    styles.toggleTrack,
                    isWorkoutDay && styles.toggleTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      isWorkoutDay && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <Text
                style={[
                  styles.dayStatus,
                  isWorkoutDay && styles.dayStatusActive,
                ]}
              >
                {isWorkoutDay ? 'Workout' : 'Rest Day'}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Workout Count */}
      {selectedDays.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {selectedDays.length} workout {selectedDays.length === 1 ? 'day' : 'days'} per week
          </Text>
        </View>
      )}

      {/* Complete Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            (selectedDays.length === 0 || loading) && styles.completeButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={selectedDays.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.completeButtonText}>Complete</Text>
          )}
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
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  daysContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  toggleContainer: {
    marginHorizontal: 16,
  },
  toggleTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C4C4C4',
    justifyContent: 'center',
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  dayStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 80,
    textAlign: 'right',
  },
  dayStatusActive: {
    color: Colors.primary,
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  countText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  completeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default WorkoutDaysScreen;