// mobile/src/screens/onboarding/AllergiesScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnBoardingContext';
import { searchIngredients } from '../../api/ingredients';
import Colors from '../../constants/colors';

const AllergiesScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState(
    onboardingData.food_allergies || []
  );
  const [selectedDetails, setSelectedDetails] = useState({});
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
      const ingredients = results.ingredients || results.results || [];
      setSearchResults(ingredients);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const toggleAllergy = (ingredient) => {
    if (selectedAllergies.includes(ingredient.id)) {
      // Remove
      setSelectedAllergies(selectedAllergies.filter(id => id !== ingredient.id));
      const newDetails = { ...selectedDetails };
      delete newDetails[ingredient.id];
      setSelectedDetails(newDetails);
    } else {
      // Add
      setSelectedAllergies([...selectedAllergies, ingredient.id]);
      setSelectedDetails({
        ...selectedDetails,
        [ingredient.id]: {
          id: ingredient.id,
          name: ingredient.name,
        },
      });
    }
  };

  const removeAllergy = (ingredientId) => {
    setSelectedAllergies(selectedAllergies.filter(id => id !== ingredientId));
    const newDetails = { ...selectedDetails };
    delete newDetails[ingredientId];
    setSelectedDetails(newDetails);
  };

  const handleNext = () => {
    updateOnboardingData('food_allergies', selectedAllergies);
    navigation.navigate('OnboardingMedical');
  };

  const handleSkip = () => {
    updateOnboardingData('food_allergies', []);
    navigation.navigate('OnboardingMedical');
  };

  const renderIngredientItem = ({ item }) => {
    const isSelected = selectedAllergies.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.ingredientItem, isSelected && styles.ingredientItemSelected]}
        onPress={() => toggleAllergy(item)}
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
    const ingredient = selectedDetails[ingredientId];
    if (!ingredient) return null;

    return (
      <View key={ingredientId} style={styles.selectedChip}>
        <Text style={styles.chipText} numberOfLines={1}>
          {ingredient.name}
        </Text>
        <TouchableOpacity
          onPress={() => removeAllergy(ingredientId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="times" size={14} color={Colors.textLight} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '30%' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="chevron-left" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Food allergies</Text>
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <FontAwesome5 name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ingredients..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Selected Allergies */}
          {selectedAllergies.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedTitle}>
                Selected ({selectedAllergies.length})
              </Text>
              <View style={styles.chipsContainer}>
                {selectedAllergies.map(renderSelectedChip)}
              </View>
            </View>
          )}

          {/* Search Results */}
          {searchQuery.length >= 2 && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderIngredientItem}
              style={styles.resultsList}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="search" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery.length < 2
                  ? 'Search for ingredients you are allergic to'
                  : searching
                  ? 'Searching...'
                  : 'No ingredients found'}
              </Text>
            </View>
          )}

          {/* Next Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
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
    backgroundColor: '#F5F5F5',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  skipButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
    padding: 12,
    fontSize: 15,
    color: Colors.text,
  },
  selectedSection: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  ingredientItemSelected: {
    borderColor: Colors.primary,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  textSelected: {
    color: Colors.primary,
  },
  ingredientCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default AllergiesScreen;