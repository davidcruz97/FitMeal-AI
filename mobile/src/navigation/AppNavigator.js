import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';

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
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
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
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon emoji="📸" color={color} />,
          title: 'Scan Ingredients',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
          title: 'Meal History',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Simple emoji-based tab icon
const TabIcon = ({ emoji, color }) => (
  <Text style={{ fontSize: 24, color: color }}>
    {emoji}
  </Text>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

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
          // Auth Stack
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Main App Stack
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
