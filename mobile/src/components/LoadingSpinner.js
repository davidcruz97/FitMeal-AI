import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'large',
  branded = false // New prop for showing branded splash screen style
}) => {
  if (branded) {
    // Branded splash screen style (purple background with logo)
    return (
      <View style={styles.brandedContainer}>
        <FontAwesome5 name="utensils" size={80} color={Colors.textLight} style={styles.logo} />
        <Text style={styles.brandedTitle}>FitMeal AI</Text>
        <Text style={styles.brandedSubtitle}>AI-Powered Meal Planning</Text>
        <ActivityIndicator
          size="large"
          color={Colors.textLight}
          style={styles.brandedLoader}
        />
        {message && message !== 'Loading...' && (
          <Text style={styles.brandedMessage}>{message}</Text>
        )}
      </View>
    );
  }

  // Standard loading spinner
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  // Branded splash screen styles
  brandedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  logo: {
    marginBottom: 20,
  },
  brandedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textLight,
    marginBottom: 8,
  },
  brandedSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    opacity: 0.9,
  },
  brandedLoader: {
    marginTop: 40,
  },
  brandedMessage: {
    marginTop: 20,
    fontSize: 14,
    color: Colors.textLight,
    opacity: 0.8,
  },
});

export default LoadingSpinner;