import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';

const IngredientCard = ({
  ingredient,
  selected = false,
  onToggle,
  showConfidence = false
}) => {
  const handlePress = () => {
    if (onToggle) {
      onToggle(ingredient.ingredient_id);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={[styles.name, selected && styles.textSelected]}>
            {ingredient.ingredient_name || ingredient.name}
          </Text>
          {showConfidence && ingredient.confidence && (
            <Text style={styles.confidence}>
              {(ingredient.confidence * 100).toFixed(0)}% confidence
            </Text>
          )}
          {ingredient.source && (
            <Text style={styles.source}>
              Detected by: {ingredient.source.toUpperCase()}
            </Text>
          )}
        </View>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  textSelected: {
    color: Colors.primary,
  },
  confidence: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  source: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
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
});

export default IngredientCard;
