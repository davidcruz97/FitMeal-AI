import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Colors from '../constants/colors';

const GuestHomeScreen = () => {
  const navigation = useNavigation();

  const promptSignUp = (feature) => {
    Alert.alert(
      'Sign Up Required',
      `To access ${feature}, please create a free account. Your data will be saved and you can track your progress!`,
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Sign Up', onPress: () => navigation.navigate('Profile') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView style={styles.container}>
        {/* Welcome Card */}
        <View style={styles.card}>
          <FontAwesome5 name="user-circle" size={48} color={Colors.primary} />
          <Text style={styles.welcomeTitle}>Welcome! 👋</Text>
          <Text style={styles.welcomeText}>
            You're exploring FitMeal AI in guest mode. Create a free account to unlock all features!
          </Text>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.signUpButtonText}>Create Free Account</Text>
            <FontAwesome5 name="arrow-right" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Explore Features</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AI')}
          >
            <FontAwesome5 name="robot" size={32} color={Colors.primary} solid />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>AI Nutrition Assistant</Text>
              <Text style={styles.actionDescription}>Get instant nutrition advice</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ManualIngredients')}
          >
            <FontAwesome5 name="search" size={32} color={Colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>Browse Recipes</Text>
              <Text style={styles.actionDescription}>Explore meal ideas</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.lockedAction]}
            onPress={() => promptSignUp('meal tracking')}
          >
            <FontAwesome5 name="lock" size={32} color={Colors.textSecondary} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionLabel, styles.lockedText]}>Track Meals</Text>
              <Text style={styles.actionDescription}>Sign up to log meals</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.lockedAction]}
            onPress={() => promptSignUp('nutrition history')}
          >
            <FontAwesome5 name="lock" size={32} color={Colors.textSecondary} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionLabel, styles.lockedText]}>View History</Text>
              <Text style={styles.actionDescription}>Sign up to track progress</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.lockedAction]}
            onPress={() => promptSignUp('nutrition history')}
          >
            <FontAwesome5 name="lock" size={32} color={Colors.textSecondary} />
            <View style={styles.actionContent}>
              <Text style={[styles.actionLabel, styles.lockedText]}>AI Ingredient Scanning</Text>
              <Text style={styles.actionDescription}>Sign up for more advanced AI functions</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Data Sources Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Our Data Sources</Text>
            <FontAwesome5 name="book-medical" size={18} color={Colors.primary} />
          </View>

          <Text style={styles.sourcesDescription}>
            All nutrition information is based on trusted scientific sources:
          </Text>

          <View style={styles.sourceItem}>
            <View style={styles.sourceIconContainer}>
              <FontAwesome5 name="leaf" size={16} color="#4CAF50" solid />
            </View>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>USDA Dietary Guidelines</Text>
              <Text style={styles.sourceUrl}>dietaryguidelines.gov</Text>
            </View>
          </View>
          
          <View style={styles.sourceItem}>
            <View style={styles.sourceIconContainer}>
              <FontAwesome5 name="globe" size={16} color="#2196F3" solid />
            </View>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>WHO Nutrition</Text>
              <Text style={styles.sourceUrl}>who.int/nutrition</Text>
            </View>
          </View>
          
          <View style={styles.sourceItem}>
            <View style={styles.sourceIconContainer}>
              <FontAwesome5 name="user-md" size={16} color="#9C27B0" solid />
            </View>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>Academy of Nutrition</Text>
              <Text style={styles.sourceUrl}>eatright.org</Text>
            </View>
          </View>
          
          <View style={styles.sourceItem}>
            <View style={styles.sourceIconContainer}>
              <FontAwesome5 name="database" size={16} color="#795548" solid />
            </View>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>USDA Food Database</Text>
              <Text style={styles.sourceUrl}>fdc.nal.usda.gov</Text>
            </View>
          </View>
        </View>
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
    paddingTop: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  signUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  actionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  freeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lockedAction: {
    opacity: 0.6,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  sourcesDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
    alignSelf: 'flex-start',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginBottom: 8,
    width: '100%',
  },
  sourceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default GuestHomeScreen;