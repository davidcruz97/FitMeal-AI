import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useScan } from '../context/ScanContext';
import { matchRecipes } from '../api/recipes';
import IngredientCard from '../components/IngredientCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Colors from '../constants/colors';

const ReviewIngredientsScreen = () => {
  const navigation = useNavigation();
  const { currentScan, selectedIngredients, toggleIngredient, updateMatchedRecipes } = useScan();
  const [loading, setLoading] = useState(false);

  const detectedIngredients = currentScan?.detected_ingredients || [];

  const handleFindRecipes = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('Error', 'Please select at least one ingredient');
      return;
    }

    setLoading(true);

    try {
      const result = await matchRecipes(selectedIngredients, 20);
      updateMatchedRecipes(result.matches || []);
      navigation.navigate('RecipeMatches');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to find recipes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Finding matching recipes..." />;
  }

  if (detectedIngredients.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['bottom']}>
        <FontAwesome5 name="search" size={60} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Ingredients Detected</Text>
        <Text style={styles.emptySubtitle}>
          Try taking another photo or add ingredients manually
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ManualIngredients')}
        >
          <Text style={styles.buttonText}>Add Manually</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Ingredients</Text>
        <Text style={styles.subtitle}>
          {selectedIngredients.length} of {detectedIngredients.length} selected
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {detectedIngredients.map((ingredient) => (
          <IngredientCard
            key={ingredient.ingredient_id}
            ingredient={ingredient}
            selected={selectedIngredients.includes(ingredient.ingredient_id)}
            onToggle={toggleIngredient}
            showConfidence={true}
          />
        ))}

        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() => navigation.navigate('ManualIngredients')}
        >
          <Text style={styles.addMoreText}>+ Add more ingredients</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selectedIngredients.length === 0 && styles.buttonDisabled]}
          onPress={handleFindRecipes}
          disabled={selectedIngredients.length === 0}
        >
          <Text style={styles.buttonText}>
            Find Recipes ({selectedIngredients.length})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: Platform.OS === 'ios' ? 90 : 70,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  addMoreButton: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  addMoreText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
    gap: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default ReviewIngredientsScreen;
