import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getTodayMeals, getNutritionStats } from '../api/meals';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/colors';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [todayMeals, setTodayMeals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mealsData, statsData] = await Promise.all([
        getTodayMeals(),
        getNutritionStats(1), // Today's stats
      ]);

      setTodayMeals(mealsData.meals || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const todayStats = stats?.daily_stats?.[0] || {
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.full_name || 'there'}!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}</Text>
      </View>

      {/* Today's Nutrition Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Nutrition</Text>
        <View style={styles.macrosGrid}>
          <MacroCard
            label="Calories"
            value={todayStats.total_calories}
            unit="kcal"
            color={Colors.calories}
          />
          <MacroCard
            label="Protein"
            value={todayStats.total_protein}
            unit="g"
            color={Colors.protein}
          />
          <MacroCard
            label="Carbs"
            value={todayStats.total_carbs}
            unit="g"
            color={Colors.carbs}
          />
          <MacroCard
            label="Fats"
            value={todayStats.total_fats}
            unit="g"
            color={Colors.fats}
          />
        </View>
      </View>

      {/* Today's Meals */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Meals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {todayMeals.length > 0 ? (
          todayMeals.map((meal, index) => (
            <MealItem key={index} meal={meal} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="utensils" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No meals logged yet today</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <FontAwesome5 name="camera" size={32} color={Colors.primary} solid />
            <Text style={styles.actionLabel}>Scan Ingredients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ManualIngredients')}
          >
            <FontAwesome5 name="search" size={32} color={Colors.primary} />
            <Text style={styles.actionLabel}>Search Recipes</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MacroCard = ({ label, value, unit, color }) => (
  <View style={styles.macroCard}>
    <View style={[styles.macroIndicator, { backgroundColor: color }]} />
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={styles.macroValue}>
      {value.toFixed(0)} <Text style={styles.macroUnit}>{unit}</Text>
    </Text>
  </View>
);

const MealItem = ({ meal }) => (
  <View style={styles.mealItem}>
    <View style={styles.mealInfo}>
      <Text style={styles.mealType}>{meal.meal_type}</Text>
      <Text style={styles.mealName}>{meal.recipe_name}</Text>
      <Text style={styles.mealMacros}>
        {meal.calories_logged.toFixed(0)} kcal
      </Text>
    </View>
    <Text style={styles.mealTime}>
      {new Date(meal.consumed_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.primary,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textLight,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: Colors.textLight,
    opacity: 0.9,
  },
  card: {
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  macroIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  macroUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: Colors.textSecondary,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  mealMacros: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  mealTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});

export default HomeScreen;
