import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logMeal } from '../api/meals';
import MacroDisplay from '../components/MacroDisplay';
import Colors from '../constants/colors';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { id: 'lunch', label: 'Lunch', icon: '🌞' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'snack', label: 'Snack', icon: '🍎' },
];

const LogMealScreen = ({ route }) => {
  const navigation = useNavigation();
  const { recipe, servings: initialServings = 1 } = route.params;

  const [mealType, setMealType] = useState('lunch');
  const [servings, setServings] = useState(initialServings);
  const [loading, setLoading] = useState(false);

  const handleLogMeal = async () => {
    setLoading(true);

    try {
      await logMeal(recipe.id, mealType, servings);
      Alert.alert(
        'Success',
        'Meal logged successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to log meal');
    } finally {
      setLoading(false);
    }
  };

  const increaseServings = () => {
    setServings(prev => Math.min(prev + 1, 10));
  };

  const decreaseServings = () => {
    setServings(prev => Math.max(prev - 1, 1));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>Log Meal</Text>
          <Text style={styles.recipeName}>{recipe.name}</Text>
        </View>

        {/* Meal Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Type</Text>
          <View style={styles.mealTypesGrid}>
            {MEAL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.mealTypeButton,
                  mealType === type.id && styles.mealTypeButtonActive,
                ]}
                onPress={() => setMealType(type.id)}
              >
                <Text style={styles.mealTypeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.mealTypeLabel,
                    mealType === type.id && styles.mealTypeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Servings Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servings</Text>
          <View style={styles.servingsControl}>
            <TouchableOpacity
              style={styles.servingsButton}
              onPress={decreaseServings}
              disabled={servings <= 1}
            >
              <Text style={styles.servingsButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.servingsValue}>{servings}</Text>
            <TouchableOpacity
              style={styles.servingsButton}
              onPress={increaseServings}
              disabled={servings >= 10}
            >
              <Text style={styles.servingsButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutritional Summary */}
        {recipe.nutritional_info && (
          <View style={styles.section}>
            <MacroDisplay
              nutritionalInfo={recipe.nutritional_info}
              servings={servings}
              showTitle={true}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.logButton, loading && styles.logButtonDisabled]}
          onPress={handleLogMeal}
          disabled={loading}
        >
          <Text style={styles.logButtonText}>
            {loading ? 'Logging...' : 'Confirm & Log Meal'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  mealTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  mealTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  mealTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  mealTypeLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  servingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsButtonText: {
    fontSize: 24,
    color: Colors.textLight,
    fontWeight: 'bold',
  },
  servingsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 40,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogMealScreen;
