// mobile/src/screens/ReviewIngredientsScreen.js
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
import { getIngredientById } from '../api/ingredients';
import IngredientCard from '../components/IngredientCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Colors from '../constants/colors';

const ReviewIngredientsScreen = () => {
  const navigation = useNavigation();
  const { currentScan, selectedIngredients, toggleIngredient, updateMatchedRecipes } = useScan();
  const [loading, setLoading] = useState(false);
  const [manualIngredients, setManualIngredients] = useState([]);

  const detectedIngredients = currentScan?.detected_ingredients || [];

  // Load manually added ingredients that aren't in detected list
  useEffect(() => {
    const loadManualIngredients = async () => {
      const detectedIds = detectedIngredients.map(ing => ing.ingredient_id);
      const manualIds = selectedIngredients.filter(id => !detectedIds.includes(id));
      
      if (manualIds.length > 0) {
        try {
          const manualIngredientsData = await Promise.all(
            manualIds.map(async (id) => {
              try {
                const result = await getIngredientById(id);
                return {
                  ingredient_id: id,
                  ingredient_name: result.ingredient.name,
                  confidence: 1.0, // Manual selections have 100% confidence
                  source: 'manual',
                  verified: result.ingredient.is_verified
                };
              } catch (error) {
                console.error(`Failed to fetch ingredient ${id}:`, error);
                return null;
              }
            })
          );
          setManualIngredients(manualIngredientsData.filter(ing => ing !== null));
        } catch (error) {
          console.error('Error loading manual ingredients:', error);
        }
      } else {
        setManualIngredients([]);
      }
    };

    loadManualIngredients();
  }, [selectedIngredients]);

  // Combine detected and manual ingredients
  const allIngredients = [...detectedIngredients, ...manualIngredients];

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

  if (allIngredients.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['bottom']}>
        <FontAwesome5 name="search" size={60} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Ingredients</Text>
        <Text style={styles.emptySubtitle}>
          Try taking a photo or add ingredients manually
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
          {selectedIngredients.length} of {allIngredients.length} selected
        </Text>
        {manualIngredients.length > 0 && (
          <Text style={styles.manualNote}>
            {manualIngredients.length} manually added
          </Text>
        )}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* Detected Ingredients */}
        {detectedIngredients.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Detected by AI</Text>
            {detectedIngredients.map((ingredient) => (
              <IngredientCard
                key={`detected-${ingredient.ingredient_id}`}
                ingredient={ingredient}
                selected={selectedIngredients.includes(ingredient.ingredient_id)}
                onToggle={toggleIngredient}
                showConfidence={true}
              />
            ))}
          </>
        )}

        {/* Manual Ingredients */}
        {manualIngredients.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Manually Added</Text>
            {manualIngredients.map((ingredient) => (
              <IngredientCard
                key={`manual-${ingredient.ingredient_id}`}
                ingredient={ingredient}
                selected={selectedIngredients.includes(ingredient.ingredient_id)}
                onToggle={toggleIngredient}
                showConfidence={false}
              />
            ))}
          </>
        )}

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
    // REMOVED paddingBottom - was pushing button up!
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
  manualNote: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Space for footer
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
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