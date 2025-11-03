// mobile/src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';
import { useOnboarding } from '../context/OnBoardingContext';

// Screens
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import ReviewIngredientsScreen from '../screens/ReviewIngredientsScreen';
import ManualIngredientsScreen from '../screens/ManualIngredientsScreen';
import RecipeMatchesScreen from '../screens/RecipeMatchesScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import LogMealScreen from '../screens/LogMealScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Onboarding Screens
import GoalsScreen from '../screens/onboarding/GoalsScreen';
import GenderScreen from '../screens/onboarding/GenderScreen';
import AllergiesScreen from '../screens/onboarding/AllergiesScreen';
import MedicalScreen from '../screens/onboarding/MedicalScreen';
import ActivityScreen from '../screens/onboarding/ActivityScreen';
import LiftingScreen from '../screens/onboarding/LiftingScreen';
import AgeScreen from '../screens/onboarding/AgeScreen';
import HeightScreen from '../screens/onboarding/HeightScreen';
import WeightScreen from '../screens/onboarding/WeightScreen';
import WorkoutDaysScreen from '../screens/onboarding/WorkoutDaysScreen';
import OnboardingProcessingScreen from '../screens/onboarding/OnboardingProcessingScreen';
import OnboardingResultsScreen from '../screens/onboarding/OnboardingResultsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 95 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.textLight,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={20} color={color} />
          ),
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="camera" size={20} color={color} solid />
          ),
          title: 'Scan Ingredients',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="chart-bar" size={20} color={color} />
          ),
          title: 'Meal History',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={20} color={color} solid />
          ),
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isViewingResults } = useOnboarding();

  if (isLoading) {
    return <SplashScreen />;
  }

  // Check if user needs to complete onboarding
  // If isViewingResults is true, keep them in onboarding flow even if profile is completed
  const needsOnboarding = isAuthenticated && user && (!user.profile_completed || isViewingResults);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack - Not logged in
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : needsOnboarding ? (
          // Onboarding Stack - Logged in but profile incomplete
          <>
            <Stack.Screen 
              name="OnboardingGoals" 
              component={GoalsScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false, // Prevent swipe back
              }}
            />
            <Stack.Screen 
              name="OnboardingGender" 
              component={GenderScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingAllergies" 
              component={AllergiesScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingMedical" 
              component={MedicalScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingActivity" 
              component={ActivityScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingLifting" 
              component={LiftingScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingAge" 
              component={AgeScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingHeight" 
              component={HeightScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingWeight" 
              component={WeightScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingWorkoutDays" 
              component={WorkoutDaysScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingProcessing" 
              component={OnboardingProcessingScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen 
              name="OnboardingResults" 
              component={OnboardingResultsScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }}
            />
          </>
        ) : (
          // Main App Stack - Logged in and profile complete
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ReviewIngredients"
              component={ReviewIngredientsScreen}
              options={{ title: 'Review Ingredients' }}
            />
            <Stack.Screen
              name="ManualIngredients"
              component={ManualIngredientsScreen}
              options={{ title: 'Add Ingredients' }}
            />
            <Stack.Screen
              name="RecipeMatches"
              component={RecipeMatchesScreen}
              options={{ title: 'Recipe Matches' }}
            />
            <Stack.Screen
              name="RecipeDetail"
              component={RecipeDetailScreen}
              options={{ title: 'Recipe Details' }}
            />
            <Stack.Screen
              name="LogMeal"
              component={LogMealScreen}
              options={{ title: 'Log Meal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;