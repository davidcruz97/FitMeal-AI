import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { getMealHistory, getNutritionStats } from '../api/meals';
import Colors from '../constants/colors';

const HistoryScreen = () => {
  const [days, setDays] = useState(7);
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

  const averageStats = stats?.average_daily || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  };

  const totalStats = stats?.total || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    meal_count: 0,
  };

  // Group meals by date
  const groupedMeals = history.reduce((groups, meal) => {
    const date = new Date(meal.consumed_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {});

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {[7, 14, 30].map((period) => (
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
              {period} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Average Daily Intake</Text>
        <View style={styles.statsRow}>
          <StatItem
            label="Calories"
            value={averageStats.calories}
            unit="kcal"
            color={Colors.calories}
          />
          <StatItem
            label="Protein"
            value={averageStats.protein}
            unit="g"
            color={Colors.protein}
          />
          <StatItem
            label="Carbs"
            value={averageStats.carbs}
            unit="g"
            color={Colors.carbs}
          />
          <StatItem
            label="Fats"
            value={averageStats.fats}
            unit="g"
            color={Colors.fats}
          />
        </View>
      </View>

      {/* Total Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total ({days} days)</Text>
        <View style={styles.totalStats}>
          <Text style={styles.totalItem}>
            🍽️ {totalStats.meal_count} meals logged
          </Text>
          <Text style={styles.totalItem}>
            🔥 {totalStats.calories.toFixed(0)} total calories
          </Text>
        </View>
      </View>

      {/* Meal History */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meal History</Text>

        {Object.keys(groupedMeals).length > 0 ? (
          Object.entries(groupedMeals).map(([date, meals]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {meals.map((meal, index) => (
                <MealHistoryItem key={index} meal={meal} />
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No meal history yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const StatItem = ({ label, value, unit, color }) => (
  <View style={styles.statItem}>
    <View style={[styles.statIndicator, { backgroundColor: color }]} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>
      {value.toFixed(0)}
      <Text style={styles.statUnit}> {unit}</Text>
    </Text>
  </View>
);

const MealHistoryItem = ({ meal }) => (
  <View style={styles.historyItem}>
    <View style={styles.historyInfo}>
      <Text style={styles.historyType}>{meal.meal_type}</Text>
      <Text style={styles.historyName}>{meal.recipe_name}</Text>
      <Text style={styles.historyMacros}>
        {meal.calories_logged.toFixed(0)} kcal
        {meal.servings && meal.servings > 1 && ` • ${meal.servings} servings`}
      </Text>
    </View>
    <Text style={styles.historyTime}>
      {new Date(meal.consumed_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 4,
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
  historyTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default HistoryScreen;
