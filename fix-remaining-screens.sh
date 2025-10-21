#!/bin/bash
# Batch fix for remaining mobile screens
# This script adds SafeAreaView and replaces emojis with FontAwesome icons

cd /home/user/FitMeal-AI/mobile/src/screens

echo "This script requires manual file edits. Please update the following screens:"
echo ""
echo "CRITICAL (button cut-off):"
echo "1. LogMealScreen.js - Add SafeAreaView, replace meal type emojis (🌅🌞🌙🍎)"
echo "2. ReviewIngredientsScreen.js - Add SafeAreaView, replace 🔍"
echo "3. RecipeDetailScreen.js - Add SafeAreaView, replace 📁⏱️🍽️"
echo ""
echo "MEDIUM (emojis only):"
echo "4. HomeScreen.js - Replace 🍽️📸🔍"
echo "5. RecipeMatchesScreen.js - Replace 🍽️"
echo "6. HistoryScreen.js - Replace 🍽️📊"
echo "7. SplashScreen.js - Replace 🍎"
echo ""
echo "Use FontAwesome5 icons from @expo/vector-icons"
echo "Add: import { SafeAreaView } from 'react-native-safe-area-context';"
echo "Add: import { FontAwesome5 } from '@expo/vector-icons';"
