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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setError(null);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      console.log(`Searching for: "${query}"`);
      const results = await searchIngredients(query, 20);
      console.log('Search results:', results);
      
      // Handle both 'ingredients' and 'results' keys for compatibility
      const ingredients = results.ingredients || results.results || [];
      setSearchResults(ingredients);
      
      if (ingredients.length === 0) {
        setError(`No ingredients found for "${query}". Try a different search term.`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Failed to search ingredients. Please try again.');
      Alert.alert('Search Error', error.message || 'Failed to search ingredients');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectIngredient = (ingredient) => {
    if (selectedIngredients.includes(ingredient.id)) {
      removeIngredient(ingredient.id);
    } else {
      addIngredient(ingredient.id);
    }
  };

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
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
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
          />
        </View>
        {selectedIngredients.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedIngredients.length} selected
          </Text>
        )}
      </View>

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
  selectedCount: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.primary,
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
  checkmark: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
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