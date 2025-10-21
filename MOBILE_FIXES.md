# Mobile App Fixes Required

## Issues Identified:

### 1. Emojis Still Present
Screens with emojis that need FontAwesome icons:
- ✅ AuthScreen - DONE (utensils icon)
- ✅ CameraScreen - DONE (camera icons)
- ❌ SplashScreen - has 🍎
- ❌ HomeScreen - has 🍽️ 📸 🔍
- ❌ HistoryScreen - has 📊
- ❌ ReviewIngredientsScreen - has 🔍
- ❌ RecipeMatchesScreen - has 🍽️
- ❌ LogMealScreen - has 🌅 🌞 🌙 🍎
- ❌ RecipeDetailScreen - has 📁 ⏱️ 🍽️ •
- ❌ ManualIngredientsScreen - has 🔍
- ❌ ProfileScreen - may have emojis

### 2. iPhone Layout (SafeAreaView needed)
Screens that need SafeAreaView to prevent button cut-off:
- ✅ AuthScreen - DONE
- ✅ CameraScreen - DONE
- ❌ HomeScreen - ScrollView needs SafeAreaView wrapper
- ❌ HistoryScreen - ScrollView needs SafeAreaView wrapper
- ❌ ReviewIngredientsScreen - Has footer with buttons
- ❌ RecipeMatchesScreen - FlatList needs SafeAreaView
- ❌ RecipeDetailScreen - ScrollView + footer buttons
- ❌ LogMealScreen - ScrollView + footer buttons
- ❌ ManualIngredientsScreen - Has footer with buttons
- ❌ ProfileScreen - ScrollView needs SafeAreaView

### 3. Clarifai Detection Mapping Issue (BACKEND)
**Problem:** Clarifai detected "nut", "almond", "artichoke" but these ingredients don't exist in database.

**Solution Options:**
A. Add more ingredients to database (recommended)
B. Show unmapped detections to user with "Add to database" option
C. Improve fuzzy matching (almond vs almonds)

**Backend file to fix:** `app/vision/ingredient_mapper.py`

### 4. Ingredient Search Issues
**Problems:**
- Search returns no results (likely no data in database)
- No "empty state" message when search finds nothing
- No way to proceed when no ingredients found
- Missing "Find Recipes" button even with 0 ingredients

**Files to fix:**
- `mobile/src/screens/ManualIngredientsScreen.js` - Better empty states
- Backend needs more ingredient data

## Priority Order:
1. Fix iPhone layout (SafeAreaView) - HIGH (breaks UX)
2. Replace remaining emojis - HIGH (consistency)
3. Fix ingredient search UX - MEDIUM
4. Backend: Add more ingredients - MEDIUM
5. Backend: Improve Clarifai mapping - LOW (can do later)
