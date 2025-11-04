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
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { logMeal } from '../api/meals';
import { getIngredientById, searchIngredients } from '../api/ingredients';
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

  // Modal states for adding ingredients
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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
            
            const ingredientId = ing.ingredient_id || ing.id;
            
            if (!ingredientId) {
              console.warn('No ingredient_id found for ingredient:', ing);
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

            console.log(`Fetching ingredient details for ID: ${ingredientId}`);
            const result = await getIngredientById(ingredientId);
            const ingredientData = result.ingredient;

            return {
              ingredient_id: ingredientId,
              name: ing.name || ingredientData.name,
              quantity: parseFloat(ing.quantity) || 1,
              unit: ing.unit || 'g',
              quantity_grams: parseFloat(ing.quantity_grams) || 100,
              enabled: true,
              currentQuantity: parseFloat(ing.quantity_grams) || 100,
              calories_per_100g: ingredientData.nutritional_info?.calories_per_100g || 0,
              protein_per_100g: ingredientData.nutritional_info?.protein_per_100g || 0,
              carbs_per_100g: ingredientData.nutritional_info?.carbs_per_100g || 0,
              fats_per_100g: ingredientData.nutritional_info?.fats_per_100g || 0,
              isFromRecipe: true, // Mark original recipe ingredients
            };
          } catch (error) {
            console.error(`Error loading ingredient:`, error);
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
              isFromRecipe: true,
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
        const factor = ing.currentQuantity / 100;
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
    
    ingredient.quantity = newDisplayQuantity;
    
    // For recipe ingredients, calculate based on proportion
    if (ingredient.isFromRecipe && recipe.ingredients[index]) {
      const originalQuantity = parseFloat(recipe.ingredients[index].quantity);
      const originalGrams = parseFloat(recipe.ingredients[index].quantity_grams);
      ingredient.currentQuantity = (newDisplayQuantity / originalQuantity) * originalGrams;
    } else {
      // For manually added ingredients, use the value directly as grams
      ingredient.currentQuantity = newDisplayQuantity;
    }
    
    setIngredients(updatedIngredients);
  };

  const removeIngredient = (index) => {
    Alert.alert(
      'Remove Ingredient',
      `Remove ${ingredients[index].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedIngredients = ingredients.filter((_, i) => i !== index);
            setIngredients(updatedIngredients);
          },
        },
      ]
    );
  };

  // Search ingredients
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const result = await searchIngredients(query, 10);
      setSearchResults(result.ingredients || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search ingredients');
    } finally {
      setSearching(false);
    }
  };

  // Add ingredient from search
  const addIngredient = async (ingredientData) => {
    try {
      // Get full ingredient details
      const result = await getIngredientById(ingredientData.id);
      const fullIngredient = result.ingredient;

      const newIngredient = {
        ingredient_id: fullIngredient.id,
        name: fullIngredient.name,
        quantity: 100, // Default 100g
        unit: 'g',
        quantity_grams: 100,
        enabled: true,
        currentQuantity: 100,
        calories_per_100g: fullIngredient.nutritional_info?.calories_per_100g || 0,
        protein_per_100g: fullIngredient.nutritional_info?.protein_per_100g || 0,
        carbs_per_100g: fullIngredient.nutritional_info?.carbs_per_100g || 0,
        fats_per_100g: fullIngredient.nutritional_info?.fats_per_100g || 0,
        isFromRecipe: false, // Mark as manually added
      };

      setIngredients([...ingredients, newIngredient]);
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      
      Alert.alert('Success', `${fullIngredient.name} added!`);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      Alert.alert('Error', 'Failed to add ingredient');
    }
  };

  const handleLogMeal = async () => {
    const hasEnabledIngredients = ingredients.some((ing) => ing.enabled && ing.currentQuantity > 0);
    
    if (!hasEnabledIngredients) {
      Alert.alert('Error', 'Please select at least one ingredient with quantity > 0');
      return;
    }

    setLoading(true);

    try {
      const customIngredients = ingredients
        .filter((ing) => ing.enabled && ing.currentQuantity > 0)
        .map((ing) => ({
          ingredient_id: ing.ingredient_id,
          name: ing.name,
          quantity_grams: ing.currentQuantity,
          calories_per_100g: ing.calories_per_100g,
          protein_per_100g: ing.protein_per_100g,
          carbs_per_100g: ing.carbs_per_100g,
          fats_per_100g: ing.fats_per_100g,
        }));

      console.log('Sending custom ingredients:', customIngredients);
      console.log('Calculated macros to match:', calculatedMacros);

      await logMeal(recipe.id, mealType, 1, '', null, customIngredients);
      
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Adjust Ingredients</Text>
              <Text style={styles.sectionSubtitle}>
                Select and adjust quantities
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <FontAwesome5 name="plus" size={16} color={Colors.textLight} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
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
                  {!ingredient.isFromRecipe && <Text style={styles.addedBadge}> • Added</Text>}
                </Text>
                {!ingredient.isFromRecipe && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeIngredient(index)}
                  >
                    <FontAwesome5 name="trash" size={14} color={Colors.error} />
                  </TouchableOpacity>
                )}
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

      {/* Add Ingredient Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKeyboardAvoid}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Ingredient</Text>
                    <TouchableOpacity onPress={() => {
                      Keyboard.dismiss();
                      setShowAddModal(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}>
                      <FontAwesome5 name="times" size={24} color={Colors.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.searchContainer}>
                    <FontAwesome5 name="search" size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search ingredients..."
                      placeholderTextColor={Colors.textSecondary}
                      value={searchQuery}
                      onChangeText={handleSearch}
                      autoFocus
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}>
                        <FontAwesome5 name="times-circle" size={16} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView 
                    style={styles.searchResults}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {searching ? (
                      <View style={styles.centerContent}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                      </View>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.searchResultItem}
                          onPress={() => {
                            Keyboard.dismiss();
                            addIngredient(item);
                          }}
                        >
                          <View style={styles.searchResultContent}>
                            <Text style={styles.searchResultName}>{item.name}</Text>
                            {item.category && (
                              <Text style={styles.searchResultCategory}>{item.category}</Text>
                            )}
                          </View>
                          <FontAwesome5 name="plus-circle" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                      ))
                    ) : searchQuery.length >= 2 ? (
                      <Text style={styles.noResults}>No ingredients found</Text>
                    ) : (
                      <Text style={styles.searchHint}>Type at least 2 characters to search</Text>
                    )}
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 14,
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
  addedBadge: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'normal',
  },
  removeButton: {
    padding: 8,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoid: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: 0,
  },
  searchResults: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  noResults: {
    textAlign: 'center',
    color: Colors.textSecondary,
    paddingVertical: 40,
    fontSize: 14,
  },
  searchHint: {
    textAlign: 'center',
    color: Colors.textSecondary,
    paddingVertical: 40,
    fontSize: 14,
  },
});

export default LogMealScreen;