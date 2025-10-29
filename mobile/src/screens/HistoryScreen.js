// mobile/src/screens/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { getMealHistory, getNutritionStats, deleteMealLog } from '../api/meals';
import Colors from '../constants/colors';

const HistoryScreen = () => {
  const [days, setDays] = useState(1);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        getMealHistory(days),
        getNutritionStats(days),
      ]);

      setHistory(historyData.meals || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteMeal = (mealId, recipeName) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${recipeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMealLog(mealId);
              loadData();
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
      ]
    );
  };

  const statsData = stats?.stats || {};
  
  const averageStats = {
    calories: statsData.avg_calories_per_day || 0,
    protein: statsData.avg_protein_per_day || 0,
    carbs: statsData.avg_carbs_per_day || 0,
    fats: statsData.avg_fats_per_day || 0,
  };

  const totalStats = {
    calories: statsData.total_calories || 0,
    protein: statsData.total_protein || 0,
    carbs: statsData.total_carbs || 0,
    fats: statsData.total_fats || 0,
    meal_count: statsData.total_meals || 0,
  };

  const groupedMeals = history.reduce((groups, meal) => {
    const date = new Date(meal.consumed_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {});

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.periodSelector}>
        {[1, 7, 30].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              days === period && styles.periodButtonActive,
            ]}
            onPress={() => setDays(period)}
          >
            <Text
              style={[
                styles.periodText,
                days === period && styles.periodTextActive,
              ]}
            >
              {period === 1 ? 'today' : `${period} days`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Average Daily Intake</Text>
        <View style={styles.statsRow}>
          <StatItem
            label="Calories"
            value={averageStats.calories || 0}
            unit="kcal"
            color={Colors.calories}
          />
          <StatItem
            label="Protein"
            value={averageStats.protein || 0}
            unit="g"
            color={Colors.protein}
          />
          <StatItem
            label="Carbs"
            value={averageStats.carbs || 0}
            unit="g"
            color={Colors.carbs}
          />
          <StatItem
            label="Fats"
            value={averageStats.fats || 0}
            unit="g"
            color={Colors.fats}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total ({days === 1 ? 'today' : `${days} days`})</Text>
        <View style={styles.totalStats}>
          <View style={styles.totalItem}>
            <FontAwesome5 name="utensils" size={14} color={Colors.text} />
            <Text style={styles.totalItemText}>
              {totalStats.meal_count || 0} meals logged
            </Text>
          </View>
          <View style={styles.totalItem}>
            <FontAwesome5 name="fire" size={14} color={Colors.text} />
            <Text style={styles.totalItemText}>
              {(totalStats.calories || 0).toFixed(0)} total calories
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meal History</Text>

        {Object.keys(groupedMeals).length > 0 ? (
          Object.entries(groupedMeals).map(([date, meals]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {meals.map((meal, index) => (
                <MealHistoryItem 
                  key={index} 
                  meal={meal} 
                  onDelete={() => handleDeleteMeal(meal.id, meal.recipe?.name || 'Unknown Recipe')}
                />
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="chart-bar" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No meal history yet</Text>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem = ({ label, value, unit, color }) => (
  <View style={styles.statItem}>
    <View style={[styles.statIndicator, { backgroundColor: color }]} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>
      {(value || 0).toFixed(0)}
      <Text style={styles.statUnit}> {unit}</Text>
    </Text>
  </View>
);

const MealHistoryItem = ({ meal, onDelete }) => {
  const calories = meal.nutritional_info?.calories || 0;
  const servings = meal.servings_consumed || meal.servings || 1;
  const recipeName = meal.recipe?.name || meal.recipe_name || 'Unknown Recipe';
  const mealType = meal.meal_type || 'meal';

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyType}>{mealType}</Text>
        <Text style={styles.historyName}>{recipeName}</Text>
        <Text style={styles.historyMacros}>
          {calories.toFixed(0)} kcal
          {servings > 1 && ` • ${servings} servings`}
        </Text>
      </View>
      <View style={styles.historyActions}>
        <Text style={styles.historyTime}>
          {new Date(meal.consumed_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <FontAwesome5 name="trash" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 90 : 70,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  periodTextActive: {
    color: Colors.textLight,
  },
  card: {
    backgroundColor: Colors.surface,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  statIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: Colors.textSecondary,
  },
  totalStats: {
    gap: 8,
  },
  totalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  totalItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  historyMacros: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  historyActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  historyTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
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
});

export default HistoryScreen;