// mobile/src/screens/onboarding/OnboardingResultsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnBoardingContext';
import { saveUser } from '../../utils/storage';
import Colors from '../../constants/colors';

const OnboardingResultsScreen = ({ navigation }) => {
  const { refreshUser } = useAuth();
  const { onboardingData, resetOnboarding, setIsViewingResults } = useOnboarding();

  // Get the completed user data that was stored in WorkoutDaysScreen
  const completedUserData = onboardingData.completedUserData;

  // Handle missing data in useEffect to avoid setState during render
  React.useEffect(() => {
    if (!completedUserData) {
      // Fallback if data is missing
      setIsViewingResults(false);
      refreshUser();
    }
  }, [completedUserData]);

  if (!completedUserData) {
    // Return early while effect handles cleanup
    return null;
  }

  // Get nutrition targets from completed user data
  const nutritionTargets = completedUserData.nutrition_targets || {};
  const profile = completedUserData.profile || {};
  
  const calories = nutritionTargets.calories || 0;
  const protein = nutritionTargets.protein || 0;
  const carbs = nutritionTargets.carbs || 0;
  const fats = nutritionTargets.fats || 0;
  const water = nutritionTargets.water || 0;
  const weight = profile.weight || 0;
  const workoutDaysPerWeek = profile.workout_days_per_week || 0;

  // Convert water from ml to cups (1 cup = ~240ml)
  const waterCups = (water / 240).toFixed(1);

  // Generate personalized advice based on goals
  const goals = profile.fitness_goals || [];
  let advice = '';

  if (goals.includes('build_muscle') || goals.includes('lean_gains')) {
    advice = 'To maximize muscle building, focus on compound exercises targeting multiple muscle groups and prioritize progressive overload for continuous muscle stimulation. Ensure you consume enough protein to support muscle repair and growth, and allow sufficient rest and recovery for optimal muscle regeneration.';
  } else if (goals.includes('weight_loss') || goals.includes('shred_fat')) {
    advice = 'For effective fat loss, maintain a consistent calorie deficit while prioritizing protein intake to preserve muscle mass. Combine cardiovascular exercise with resistance training to maximize fat burning and maintain metabolic rate. Stay consistent with your nutrition plan and track your progress regularly.';
  } else if (goals.includes('toned_body') || goals.includes('maintain_muscle')) {
    advice = 'To achieve a toned physique, balance your training between strength exercises and moderate cardio. Focus on maintaining your current weight while improving muscle definition through proper nutrition timing and adequate protein intake. Consistency is key for visible results.';
  } else {
    advice = 'Follow a balanced approach to nutrition and exercise, focusing on whole foods and regular physical activity. Listen to your body, stay hydrated, and ensure adequate rest for recovery. Your personalized plan is designed to help you achieve your specific fitness goals safely and effectively.';
  }

  const handleStart = async () => {
    try {
      // Update the user data in storage
      await saveUser(completedUserData);
      
      // Clear the viewing results flag - this allows AppNavigator to switch
      setIsViewingResults(false);
      
      // Reset onboarding data
      resetOnboarding();
      
      // Refresh the user in auth context
      await refreshUser();
      
      console.log('✅ User data updated and ready to navigate to main app');
      
      // The AppNavigator will automatically switch to MainTabs now
      // because user.profile_completed is true and isViewingResults is false
      
    } catch (error) {
      console.error('Error updating user data:', error);
      // Clear flag and refresh anyway
      setIsViewingResults(false);
      await refreshUser();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.congratsTitle}>Congratulations!</Text>
        <Text style={styles.congratsSubtitle}>
          Your <Text style={styles.highlightText}>fitness</Text> journey{'\n'}begins now!
        </Text>

        {/* Calorie Goal Card */}
        <View style={styles.card}>
          <FontAwesome5 name="fire" size={40} color={Colors.primary} />
          <Text style={styles.cardLabel}>YOUR CALORIE GOAL</Text>
          <Text style={styles.cardValue}>{calories.toLocaleString()} kcal</Text>
          <Text style={styles.cardSubtext}>per day</Text>
        </View>

        {/* Macros Card */}
        <View style={styles.macrosCard}>
          <View style={styles.macroItem}>
            <FontAwesome5 name="drumstick-bite" size={28} color={Colors.protein} />
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{protein}g</Text>
            <Text style={styles.macroSubtext}>per day</Text>
          </View>

          <View style={styles.macroItem}>
            <FontAwesome5 name="bread-slice" size={28} color={Colors.carbs} />
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{carbs}g</Text>
            <Text style={styles.macroSubtext}>per day</Text>
          </View>

          <View style={styles.macroItem}>
            <FontAwesome5 name="tint" size={28} color={Colors.fats} />
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>{fats}g</Text>
            <Text style={styles.macroSubtext}>per day</Text>
          </View>
        </View>

        {/* Water Goal Card */}
        <View style={styles.card}>
          <FontAwesome5 name="glass-whiskey" size={40} color={Colors.primary} />
          <Text style={styles.cardLabel}>YOUR WATER GOAL</Text>
          <Text style={styles.cardValue}>{waterCups} cups</Text>
          <Text style={styles.cardSubtext}>per day</Text>
        </View>

        {/* Workout Goal Card */}
        <View style={styles.card}>
          <FontAwesome5 name="dumbbell" size={40} color={Colors.primary} />
          <Text style={styles.cardLabel}>{workoutDaysPerWeek} WORKOUTS</Text>
          <Text style={styles.cardValue}>Weekly goal</Text>
        </View>

        {/* Advice Card */}
        <View style={styles.adviceCard}>
          <FontAwesome5 name="comment" size={32} color={Colors.primary} style={styles.adviceIcon} />
          <Text style={styles.adviceTitle}>FitMeal advice</Text>
          <Text style={styles.adviceText}>{advice}</Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          The information provided is for general reference only and should not substitute professional medical advice.
        </Text>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Let's Start!</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  congratsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  congratsSubtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    lineHeight: 36,
  },
  highlightText: {
    color: Colors.primary,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weightText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  weightTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.primary,
    opacity: 0.3,
  },
  timelineDotEnd: {
    opacity: 0.3,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  cardSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  macrosCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  macroSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  adviceCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adviceIcon: {
    marginBottom: 12,
  },
  adviceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  adviceText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  disclaimer: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default OnboardingResultsScreen;