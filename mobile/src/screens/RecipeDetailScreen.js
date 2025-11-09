// mobile/src/screens/RecipeDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MacroDisplay from '../components/MacroDisplay';
import Colors from '../constants/colors';

const RecipeDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const { recipe } = route.params;

  // Construct full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `https://fitmeal.cinturillas247.com${imageUrl}`;
  };

  const handleLogMeal = () => {
    navigation.navigate('LogMeal', { recipe, servings: 1 });
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.content}>
        {recipe.image_url && (
          <Image
            source={{ uri: getImageUrl(recipe.image_url) }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.section}>
          <Text style={styles.title}>{recipe.name}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <FontAwesome5 name="folder" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.category || 'General'}</Text>
            </View>
            {recipe.prep_time_minutes && (
              <View style={styles.metaItem}>
                <FontAwesome5 name="clock" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{recipe.prep_time_minutes} min</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <FontAwesome5 name="utensils" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
          </View>
        </View>

        {/* Nutritional Information */}
        {recipe.nutritional_info && (
          <View style={styles.section}>
            <MacroDisplay
              nutritionalInfo={recipe.nutritional_info}
              servings={1}
              showTitle={true}
            />

            {/* Nutrition Data Source Citation */}
            <View style={styles.nutritionCitation}>
              <FontAwesome5 name="database" size={12} color={Colors.textSecondary} />
              <Text style={styles.nutritionCitationText}>
                Data calculated using USDA FoodData Central Database
              </Text>
            </View>
          </View>
        )}

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientBullet}>•</Text>
                <Text style={styles.ingredientText}>
                  {ingredient.quantity} {ingredient.unit} {ingredient.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.instructionsText}>{recipe.instructions}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logButton} onPress={handleLogMeal}>
          <Text style={styles.logButtonText}>Log This Meal</Text>
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
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.border,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ingredientBullet: {
    fontSize: 16,
    color: Colors.primary,
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
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
  logButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutritionCitation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nutritionCitationText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default RecipeDetailScreen;