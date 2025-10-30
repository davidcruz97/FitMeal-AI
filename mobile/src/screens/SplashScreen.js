import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/colors';

const SplashScreen = () => {
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
});

export default SplashScreen;