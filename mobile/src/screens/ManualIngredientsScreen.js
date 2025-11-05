// mobile/src/screens/ManualIngredientsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useScan } from '../context/ScanContext';
import { searchIngredients } from '../api/ingredients';
import { matchRecipes } from '../api/recipes';
import Colors from '../constants/colors';

const ManualIngredientsScreen = () => {
  const navigation = useNavigation();
  const { selectedIngredients, addIngredient, removeIngredient, updateMatchedRecipes } = useScan();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIngredientDetails, setSelectedIngredientDetails] = useState({});

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setError(null);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // console.log(`Searching for: "${query}"`);
      const results = await searchIngredients(query, 20);
      // console.log('Search results:', results);
      
      const ingredients = results.ingredients || results.results || [];
      setSearchResults(ingredients);
      
      if (ingredients.length === 0) {
        setError(`No ingredients found for "${query}". Try a different search term.`);
      }
    } catch (error) {
      // console.error('Search error:', error);
      setError(error.message || 'Failed to search ingredients. Please try again.');
      Alert.alert('Search Error', error.message || 'Failed to search ingredients');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectIngredient = (ingredient) => {
    if (selectedIngredients.includes(ingredient.id)) {
      removeIngredient(ingredient.id);
      // Remove from details
      const newDetails = { ...selectedIngredientDetails };
      delete newDetails[ingredient.id];
      setSelectedIngredientDetails(newDetails);
    } else {
      addIngredient(ingredient.id);
      // Store ingredient details for display
      setSelectedIngredientDetails({
        ...selectedIngredientDetails,
        [ingredient.id]: {
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
        },
      });
    }
    
    // Dismiss keyboard after selection
    Keyboard.dismiss();
  };

  const handleRemoveSelected = (ingredientId) => {
    removeIngredient(ingredientId);
    const newDetails = { ...selectedIngredientDetails };
    delete newDetails[ingredientId];
    setSelectedIngredientDetails(newDetails);
  };

  const handleFindRecipes = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('Error', 'Please select at least one ingredient');
      return;
    }

    Keyboard.dismiss();
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderIngredientItem = ({ item }) => {
    const isSelected = selectedIngredients.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.ingredientItem, isSelected && styles.ingredientItemSelected]}
        onPress={() => handleSelectIngredient(item)}
      >
        <View style={styles.ingredientInfo}>
          <Text style={[styles.ingredientName, isSelected && styles.textSelected]}>
            {item.name}
          </Text>
          {item.category && (
            <Text style={styles.ingredientCategory}>{item.category}</Text>
          )}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <FontAwesome5 name="check" size={12} color={Colors.textLight} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedChip = (ingredientId) => {
    const ingredient = selectedIngredientDetails[ingredientId];
    if (!ingredient) return null;

    return (
      <View key={ingredientId} style={styles.selectedChip}>
        <Text style={styles.chipText} numberOfLines={1}>
          {ingredient.name}
        </Text>
        <TouchableOpacity
          onPress={() => handleRemoveSelected(ingredientId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="times" size={14} color={Colors.textLight} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <FontAwesome5 
                name="search" 
                size={16} 
                color={Colors.textSecondary} 
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ingredients (e.g., chicken, rice, tomato)"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                onSubmitEditing={dismissKeyboard}
              />
            </View>
          </View>

          {/* Selected Ingredients Section */}
          {selectedIngredients.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedTitle}>
                Selected ({selectedIngredients.length})
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedChipsContainer}
              >
                {selectedIngredients.map(renderSelectedChip)}
              </ScrollView>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <FontAwesome5 name="exclamation-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderIngredientItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Platform.OS === 'ios' ? 90 : 70 }
              ]}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="search" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery.length < 2
                  ? 'Start typing to search ingredients'
                  : searching
                  ? 'Searching...'
                  : error
                  ? ''
                  : 'No ingredients found'}
              </Text>
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && !error && (
                <Text style={styles.emptyHint}>
                  Try searching for common ingredients like "chicken", "rice", or "tomato"
                </Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, selectedIngredients.length === 0 && styles.buttonDisabled]}
              onPress={handleFindRecipes}
              disabled={loading || selectedIngredients.length === 0}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Finding Recipes...' : selectedIngredients.length > 0 ? `Find Recipes (${selectedIngredients.length})` : 'Select ingredients first'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  selectedSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  selectedChipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 8,
    maxWidth: 200,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  ingredientItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  textSelected: {
    color: Colors.primary,
  },
  ingredientCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
});

export default ManualIngredientsScreen;