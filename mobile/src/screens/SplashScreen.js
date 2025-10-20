import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../constants/colors';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      // Navigation will be handled by App.js based on auth status
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🍎</Text>
      <Text style={styles.title}>FitMeal AI</Text>
      <Text style={styles.subtitle}>
        AI-Powered Meal Planning
      </Text>
      <ActivityIndicator
        size="large"
        color={Colors.textLight}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textLight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    opacity: 0.9,
  },
  loader: {
    marginTop: 40,
  },
});

export default SplashScreen;
