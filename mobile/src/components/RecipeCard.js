// mobile/src/components/RecipeCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '../constants/colors';

const RecipeCard = ({ recipe, matchScore, onPress }) => {
  const macros = recipe.nutritional_info?.per_serving;

  // Construct full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `https://fitmeal.cinturillas247.com${imageUrl}`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(recipe)}
      activeOpacity={0.7}
    >
      {recipe.image_url && (
        <Image
          source={{ uri: getImageUrl(recipe.image_url) }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {recipe.name}
          </Text>
          {matchScore !== undefined && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchScore}>{matchScore.toFixed(0)}%</Text>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.category}>{recipe.category || 'General'}</Text>
          {recipe.prep_time_minutes && (
            <Text style={styles.time}> • {recipe.prep_time_minutes} min</Text>
          )}
          {recipe.servings && (
            <Text style={styles.servings}> • {recipe.servings} servings</Text>
          )}
        </View>

        {macros && (
          <View style={styles.macros}>
            <MacroChip
              label="Cal"
              value={macros.calories}
              unit=""
              color={Colors.calories}
            />
            <MacroChip
              label="P"
              value={macros.protein}
              color={Colors.protein}
            />
            <MacroChip
              label="C"
              value={macros.carbs}
              color={Colors.carbs}
            />
            <MacroChip
              label="F"
              value={macros.fats}
              color={Colors.fats}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const MacroChip = ({ label, value, unit = 'g', color }) => (
  <View style={styles.macroChip}>
    <View style={[styles.macroIndicator, { backgroundColor: color }]} />
    <Text style={styles.macroText}>
      {label} {value.toFixed(0)}{unit}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.border,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  matchBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchScore: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  servings: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  macros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  macroIndicator: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginRight: 4,
  },
  macroText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default RecipeCard;