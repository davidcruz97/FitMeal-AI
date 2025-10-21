import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
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

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchIngredients(query, 20);
      setSearchResults(results.ingredients || []);
    } catch (error) {
      console.error('Search error:', error);
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
          <Text style={styles.ingredientCategory}>{item.category}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search ingredients..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {selectedIngredients.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedIngredients.length} selected
          </Text>
        )}
      </View>

      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderIngredientItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <FontAwesome5 name="search" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery.length < 2
              ? 'Start typing to search ingredients'
              : searching
              ? 'Searching...'
              : 'No ingredients found'}
          </Text>
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
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
            {loading ? 'Finding Recipes...' : selectedIngredients.length > 0 ? `Find Recipes (${selectedIngredients.length})` : 'Select ingredients to find recipes'}
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
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCount: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
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
});

export default ManualIngredientsScreen;
