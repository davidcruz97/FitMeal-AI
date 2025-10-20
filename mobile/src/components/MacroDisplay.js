import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const MacroDisplay = ({ nutritionalInfo, servings = 1, showTitle = true }) => {
  if (!nutritionalInfo || !nutritionalInfo.per_serving) {
    return null;
  }

  const macros = nutritionalInfo.per_serving;
  const multiplier = servings;

  const MacroItem = ({ label, value, color, unit = 'g' }) => (
    <View style={styles.macroItem}>
      <View style={[styles.macroIndicator, { backgroundColor: color }]} />
      <View style={styles.macroContent}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {(value * multiplier).toFixed(1)}
          {unit}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>Nutritional Info</Text>}
      <View style={styles.macrosGrid}>
        <MacroItem
          label="Calories"
          value={macros.calories}
          color={Colors.calories}
          unit=" kcal"
        />
        <MacroItem
          label="Protein"
          value={macros.protein}
          color={Colors.protein}
        />
        <MacroItem
          label="Carbs"
          value={macros.carbs}
          color={Colors.carbs}
        />
        <MacroItem
          label="Fats"
          value={macros.fats}
          color={Colors.fats}
        />
      </View>
      {servings > 1 && (
        <Text style={styles.servingsNote}>
          × {servings} serving{servings > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
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
  servingsNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default MacroDisplay;
