// mobile/src/screens/LogMealScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { logMeal } from '../api/meals';
import { getIngredientById } from '../api/ingredients';
import Colors from '../constants/colors';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sun' },
  { id: 'lunch', label: 'Lunch', icon: 'sun' },
  { id: 'dinner', label: 'Dinner', icon: 'moon' },
  { id: 'snack', label: 'Snack', icon: 'apple-alt' },
];

const LogMealScreen = ({ route }) => {
  const navigation = useNavigation();
  const { recipe } = route.params;

  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [calculatedMacros, setCalculatedMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  // Load ingredient details with nutritional info
  useEffect(() => {
    loadIngredientDetails();
  }, [recipe]);

  const loadIngredientDetails = async () => {
    console.log('Recipe data:', JSON.stringify(recipe, null, 2));
    
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      console.log('No ingredients found in recipe');
      setLoadingIngredients(false);
      return;
    }

    try {
      const detailedIngredients = await Promise.all(
        recipe.ingredients.map(async (ing) => {
          try {
            console.log('Processing ingredient:', JSON.stringify(ing, null, 2));
            
            // Try to get ingredient_id from different possible fields
            const ingredientId = ing.ingredient_id || ing.id;
            
            if (!ingredientId) {
              console.warn('No ingredient_id found for ingredient:', ing);
              // Use recipe ingredient data as-is
              return {
                name: ing.name || 'Unknown',
                quantity: parseFloat(ing.quantity) || 100,
                unit: ing.unit || 'g',
                enabled: true,
                currentQuantity: parseFloat(ing.quantity) || 100,
                // Use nutritional data if available in ingredient object
                calories_per_100g: ing.calories_per_100g || 0,
                protein_per_100g: ing.protein_per_100g || 0,
                carbs_per_100g: ing.carbs_per_100g || 0,
                fats_per_100g: ing.fats_per_100g || 0,
              };
            }

            // Fetch full ingredient details including nutritional info
            console.log(`Fetching ingredient details for ID: ${ingredientId}`);
            const result = await getIngredientById(ingredientId);
            const ingredientData = result.ingredient;

            return {
              ingredient_id: ingredientId,
              name: ing.name || ingredientData.name,
              quantity: parseFloat(ing.quantity) || 1,  // Display quantity
              unit: ing.unit || 'g',  // Display unit
              quantity_grams: parseFloat(ing.quantity_grams) || 100,  // For calculations
              enabled: true,
              currentQuantity: parseFloat(ing.quantity_grams) || 100,  // Use grams for calculation
              // Nutritional data per 100g
              calories_per_100g: ingredientData.nutritional_info?.calories_per_100g || 0,
              protein_per_100g: ingredientData.nutritional_info?.protein_per_100g || 0,
              carbs_per_100g: ingredientData.nutritional_info?.carbs_per_100g || 0,
              fats_per_100g: ingredientData.nutritional_info?.fats_per_100g || 0,
            };
          } catch (error) {
            console.error(`Error loading ingredient:`, error);
            // Return ingredient with available data
            return {
              name: ing.name || 'Unknown',
              quantity: parseFloat(ing.quantity) || 100,
              unit: ing.unit || 'g',
              enabled: true,
              currentQuantity: parseFloat(ing.quantity) || 100,
              calories_per_100g: ing.calories_per_100g || 0,
              protein_per_100g: ing.protein_per_100g || 0,
              carbs_per_100g: ing.carbs_per_100g || 0,
              fats_per_100g: ing.fats_per_100g || 0,
            };
          }
        })
      );

      console.log('Detailed ingredients loaded:', detailedIngredients);
      setIngredients(detailedIngredients);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      Alert.alert('Error', 'Failed to load ingredient details');
    } finally {
      setLoadingIngredients(false);
    }
  };

  // Calculate macros whenever ingredients change
  useEffect(() => {
    if (ingredients.length > 0) {
      calculateMacros();
    }
  }, [ingredients]);

  const calculateMacros = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    ingredients.forEach((ing) => {
      if (ing.enabled && ing.currentQuantity > 0) {
        const factor = ing.currentQuantity / 100; // Nutritional info is per 100g
        totalCalories += (ing.calories_per_100g || 0) * factor;
        totalProtein += (ing.protein_per_100g || 0) * factor;
        totalCarbs += (ing.carbs_per_100g || 0) * factor;
        totalFats += (ing.fats_per_100g || 0) * factor;
      }
    });

    console.log('Calculated macros:', {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
    });

    setCalculatedMacros({
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFats,
    });
  };

  const toggleIngredient = (index) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index].enabled = !updatedIngredients[index].enabled;
    setIngredients(updatedIngredients);
  };

  const updateQuantity = (index, value) => {
    const newDisplayQuantity = parseFloat(value) || 0;
    const updatedIngredients = [...ingredients];
    const ingredient = updatedIngredients[index];
    
    // Update display quantity
    ingredient.quantity = newDisplayQuantity;
    
    // Calculate new quantity_grams based on proportion
    const originalQuantity = parseFloat(recipe.ingredients[index].quantity);
    const originalGrams = parseFloat(recipe.ingredients[index].quantity_grams);
    ingredient.currentQuantity = (newDisplayQuantity / originalQuantity) * originalGrams;
    
    setIngredients(updatedIngredients);
  };

  const handleLogMeal = async () => {
    // Check if at least one ingredient is selected
    const hasEnabledIngredients = ingredients.some((ing) => ing.enabled && ing.currentQuantity > 0);
    
    if (!hasEnabledIngredients) {
      Alert.alert('Error', 'Please select at least one ingredient with quantity > 0');
      return;
    }

    setLoading(true);

    try {
      // For now, we'll use servings = 1 since we're tracking by ingredients
      await logMeal(recipe.id, mealType, 1);
      
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

  if (loadingIngredients) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading ingredient details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
                <FontAwesome5
                  name={type.icon}
                  size={28}
                  color={mealType === type.id ? Colors.primary : Colors.textSecondary}
                  solid={type.id === 'lunch'}
                />
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

        {/* Ingredients Selection */}
        {ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adjust Ingredients</Text>
            <Text style={styles.sectionSubtitle}>
              Select and adjust quantities of ingredients you used
            </Text>
            
            {ingredients.map((ingredient, index) => (
              <View
                key={index}
                style={[
                  styles.ingredientCard,
                  !ingredient.enabled && styles.ingredientCardDisabled,
                ]}
              >
                <TouchableOpacity
                  style={styles.ingredientHeader}
                  onPress={() => toggleIngredient(index)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, ingredient.enabled && styles.checkboxActive]}>
                    {ingredient.enabled && (
                      <FontAwesome5 name="check" size={12} color={Colors.textLight} />
                    )}
                  </View>
                  <Text style={[styles.ingredientName, !ingredient.enabled && styles.textDisabled]}>
                    {ingredient.name}
                  </Text>
                </TouchableOpacity>
                
                {ingredient.enabled && (
                  <View style={styles.quantityControl}>
                    <TextInput
                      style={styles.quantityInput}
                      value={ingredient.quantity.toString()}
                      onChangeText={(value) => updateQuantity(index, value)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <Text style={styles.quantityUnit}>{ingredient.unit}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Calculated Nutritional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutritional Summary</Text>
          <View style={styles.macrosCard}>
            <View style={styles.macrosGrid}>
              <MacroItem
                label="Calories"
                value={calculatedMacros.calories}
                unit="kcal"
                color={Colors.calories}
              />
              <MacroItem
                label="Protein"
                value={calculatedMacros.protein}
                unit="g"
                color={Colors.protein}
              />
              <MacroItem
                label="Carbs"
                value={calculatedMacros.carbs}
                unit="g"
                color={Colors.carbs}
              />
              <MacroItem
                label="Fats"
                value={calculatedMacros.fats}
                unit="g"
                color={Colors.fats}
              />
            </View>
          </View>
        </View>
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
    </SafeAreaView>
  );
};

const MacroItem = ({ label, value, unit, color }) => (
  <View style={styles.macroItem}>
    <View style={[styles.macroIndicator, { backgroundColor: color }]} />
    <View style={styles.macroContent}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value.toFixed(1)}
        <Text style={styles.macroUnit}> {unit}</Text>
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    gap: 8,
  },
  mealTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
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
  ingredientCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  ingredientCardDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.background,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  textDisabled: {
    color: Colors.textSecondary,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginLeft: 36,
    gap: 8,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityUnit: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    minWidth: 30,
  },
  macrosCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  macroIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  macroContent: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  macroUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: Colors.textSecondary,
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