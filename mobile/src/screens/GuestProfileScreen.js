import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';

const GuestProfileScreen = () => {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container}>
        {/* Guest Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <FontAwesome5 name="user-circle" size={80} color={Colors.textSecondary} />
          </View>
          <Text style={styles.guestName}>Guest User</Text>
          <Text style={styles.guestSubtitle}>Exploring FitMeal AI</Text>
        </View>

        {/* Sign Up Prompt */}
        <View style={styles.signUpCard}>
          <FontAwesome5 name="star" size={32} color={Colors.primary} />
          <Text style={styles.signUpTitle}>Create Your Free Account</Text>
          <Text style={styles.signUpDescription}>
            Sign up to unlock all features:
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <FontAwesome5 name="check-circle" size={16} color={Colors.primary} solid />
              <Text style={styles.featureText}>Track your meals and nutrition</Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome5 name="check-circle" size={16} color={Colors.primary} solid />
              <Text style={styles.featureText}>Get personalized recommendations</Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome5 name="check-circle" size={16} color={Colors.primary} solid />
              <Text style={styles.featureText}>View your progress history</Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome5 name="check-circle" size={16} color={Colors.primary} solid />
              <Text style={styles.featureText}>Save your favorite recipes</Text>
            </View>
            <View style={styles.featureItem}>
              <FontAwesome5 name="check-circle" size={16} color={Colors.primary} solid />
              <Text style={styles.featureText}>Sync across devices</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={logout}
          >
            <Text style={styles.signUpButtonText}>Create Free Account</Text>
            <FontAwesome5 name="arrow-right" size={16} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={logout}
          >
            <Text style={styles.signInButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About FitMeal AI</Text>
          <Text style={styles.infoText}>
            FitMeal AI helps you make better nutrition choices using AI-powered recommendations based on trusted scientific sources.
          </Text>
        </View>

        {/* Exit Guest Mode */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={logout}
        >
          <FontAwesome5 name="sign-out-alt" size={16} color={Colors.error} />
          <Text style={styles.exitButtonText}>Exit Guest Mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  guestName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  guestSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  signUpCard: {
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signUpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  signUpDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  featureList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  signInButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  exitButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GuestProfileScreen;