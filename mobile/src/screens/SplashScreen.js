// mobile/src/screens/SplashScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';

const SplashScreen = () => {
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    // Progress through loading messages
    const timer1 = setTimeout(() => setLoadingStep(1), 600);
    const timer2 = setTimeout(() => setLoadingStep(2), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 0:
        return 'Welcome back...';
      case 1:
        return 'Loading your data...';
      case 2:
        return 'Almost ready...';
      default:
        return 'Loading...';
    }
  };

  return (
    <View style={styles.container}>
      <FontAwesome5 name="utensils" size={80} color={Colors.textLight} style={styles.logo} />
      <Text style={styles.title}>FitMeal AI</Text>
      <Text style={styles.subtitle}>
        AI-Powered Meal Planning
      </Text>
      <ActivityIndicator
        size="large"
        color={Colors.textLight}
        style={styles.loader}
      />
      <Text style={styles.loadingText}>{getLoadingMessage()}</Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textLight,
    opacity: 0.8,
  },
});

export default SplashScreen;