# Remaining Mobile App Fixes Needed

## ✅ Completed Fixes:
1. **ManualIngredientsScreen** - SafeAreaView + emoji → icon + button always shows

## ❌ Remaining Screens to Fix:

### CRITICAL (Button Cut-Off Issues):

#### 1. LogMealScreen.js
**Changes needed:**
```javascript
// Add imports:
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

// Update MEAL_TYPES (lines 15-20):
const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sun' }, // was 🌅
  { id: 'lunch', label: 'Lunch', icon: 'sun' }, // was 🌞
  { id: 'dinner', label: 'Dinner', icon: 'moon' }, // was 🌙
  { id: 'snack', label: 'Snack', icon: 'apple-alt' }, // was 🍎
];

// Update meal type button icon rendering (line 81):
<FontAwesome5 name={type.icon} size={28} color={mealType === type.id ? Colors.primary : Colors.textSecondary} />

// Wrap return with SafeAreaView (line 60-61):
return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    <ScrollView style={styles.content}>
      ...
    </ScrollView>
    <View style={styles.footer}>
      ...
    </View>
  </SafeAreaView>
);

// Update footer style (add paddingBottom: 10)
```

#### 2. ReviewIngredientsScreen.js
**Changes needed:**
```javascript
// Add imports:
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

// Replace emoji (line 50-51):
// OLD: <Text style={styles.emptyIcon}>🔍</Text>
// NEW: <FontAwesome5 name="search" size={60} color={Colors.textSecondary} />

// Wrap with SafeAreaView:
return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    ...
  </SafeAreaView>
);

// Update footer paddingBottom: 10
```

#### 3. RecipeDetailScreen.js
**Changes needed:**
```javascript
// Add imports:
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

// Replace meta emojis (lines 47, 51, 55):
// OLD: 📁 {recipe.category}
// NEW: <FontAwesome5 name="folder" size={14} color={Colors.textSecondary} /> {recipe.category}

// OLD: ⏱️ {recipe.prep_time_minutes} min
// NEW: <FontAwesome5 name="clock" size={14} color={Colors.textSecondary} /> {recipe.prep_time_minutes} min

// OLD: 🍽️ {recipe.servings} servings
// NEW: <FontAwesome5 name="utensils" size={14} color={Colors.textSecondary} /> {recipe.servings} servings

// Wrap with SafeAreaView:
return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    <ScrollView style={styles.content}>
      ...
    </ScrollView>
    <View style={styles.footer}>
      ...
    </View>
  </SafeAreaView>
);

// Update footer paddingBottom: 10
```

### MEDIUM Priority (Emoji Replacements Only):

#### 4. HomeScreen.js
```javascript
// Add imports
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

// Line 119: <Text style={styles.emptyIcon}>🍽️</Text>
// Replace with: <FontAwesome5 name="utensils" size={48} color={Colors.textSecondary} />

// Line 133: <Text style={styles.actionIcon}>📸</Text>
// Replace with: <FontAwesome5 name="camera" size={32} color={Colors.primary} solid />

// Line 141: <Text style={styles.actionIcon}>🔍</Text>
// Replace with: <FontAwesome5 name="search" size={32} color={Colors.primary} />

// Remove emptyIcon style, actionIcon style from styles
// Wrap ScrollView with SafeAreaView edges={['bottom']}
```

#### 5. RecipeMatchesScreen.js
```javascript
// Add imports
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

// Line 32: <Text style={styles.emptyIcon}>🍽️</Text>
// Replace with: <FontAwesome5 name="utensils" size={60} color={Colors.textSecondary} />

// Wrap with SafeAreaView edges={['bottom']}
```

#### 6. HistoryScreen.js
```javascript
// Add imports
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

// Line 137: 🍽️ {totalStats.meal_count} meals logged
// Replace with: <FontAwesome5 name="utensils" size={14} color={Colors.text} /> {totalStats.meal_count} meals logged

// Line 160: <Text style={styles.emptyIcon}>📊</Text>
// Replace with: <FontAwesome5 name="chart-bar" size={48} color={Colors.textSecondary} />

// Wrap ScrollView with SafeAreaView edges={['bottom']}
```

#### 7. SplashScreen.js
```javascript
// Add import
import { FontAwesome5 } from '@expo/vector-icons';

// Line 17: <Text style={styles.logo}>🍎</Text>
// Replace with: <FontAwesome5 name="apple-alt" size={60} color={Colors.textLight} />

// Remove logo style (fontSize: 60)
```

## Backend Fixes Needed:

### Issue #3: Clarifai Detection Not Mapping
**File:** `app/vision/ingredient_mapper.py`

**Problem:** Clarifai detected "nut", "almond", "artichoke" but database queries found no matches.

**Solutions:**
1. **Add more ingredients to database** (recommended for competition)
   - Add common ingredients: nuts, almonds, artichokes, etc.
   - Run: `flask init-db` or add via web admin panel

2. **Improve fuzzy matching** in ingredient_mapper.py:
   ```python
   # Current logic does ILIKE '%name%' but ingredients might have different names
   # E.g., "almond" vs "almonds", "nut" vs "mixed nuts"

   # Improve by:
   - Try singular/plural variations
   - Try synonyms (nut → peanut, walnut, almond)
   - Lower confidence threshold for partial matches
   ```

3. **Show unmapped detections to user:**
   - Instead of silently dropping Clarifai detections
   - Show: "Detected but not in database: nut, almond, artichoke"
   - Give option to continue without them

**Priority:** MEDIUM - Can add ingredients manually for competition demo

## Testing Checklist:

After applying fixes:
- [ ] Test on iPhone - buttons should not be cut off
- [ ] All emojis replaced with FontAwesome icons
- [ ] Ingredient search works and always shows button
- [ ] Meal logging works from RecipeDetail
- [ ] All screens properly handle SafeAreaView

## Quick Stats:
- ✅ Completed: 1 screen (ManualIngredientsScreen)
- ❌ Remaining: 6 screens need fixes
- 🔧 Backend: 1 issue to address (Clarifai mapping)
