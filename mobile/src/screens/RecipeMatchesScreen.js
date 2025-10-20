import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useScan } from '../context/ScanContext';
import RecipeCard from '../components/RecipeCard';
import Colors from '../constants/colors';

const RecipeMatchesScreen = () => {
  const navigation = useNavigation();
  const { matchedRecipes } = useScan();

  const handleRecipePress = (recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const renderRecipeItem = ({ item }) => (
    <RecipeCard
      recipe={item.recipe}
      matchScore={item.match_score}
      onPress={handleRecipePress}
    />
  );

  if (!matchedRecipes || matchedRecipes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyTitle}>No Recipes Found</Text>
        <Text style={styles.emptySubtitle}>
          Try selecting different ingredients or add more to find matching recipes
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matched Recipes</Text>
        <Text style={styles.subtitle}>
          Found {matchedRecipes.length} recipe{matchedRecipes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={matchedRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item, index) => `${item.recipe.id}-${index}`}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
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
  },
});

export default RecipeMatchesScreen;
