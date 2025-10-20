# FitMeal AI - Mobile App

React Native + Expo mobile application for FitMeal AI.

## Features

- **Authentication**: Login and register with JWT tokens
- **Camera Integration**: Take photos or select from gallery
- **AI Ingredient Detection**: Upload photos for automatic ingredient detection
- **Manual Ingredient Search**: Search and select ingredients manually
- **Recipe Matching**: Find recipes based on selected ingredients
- **Meal Logging**: Log consumed meals with nutrition tracking
- **Dashboard**: View daily nutrition stats and meal history
- **History**: Track nutrition over time (7, 14, or 30 days)

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app on physical device)

## Installation

1. **Install dependencies**:
```bash
cd mobile
npm install
```

2. **Configure API endpoint**:
Edit `src/constants/config.js` and update `API_BASE_URL` with your backend URL:
```javascript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8001/api';
```

**Important**: When running on a physical device or emulator, use your computer's local IP address instead of `localhost`.

To find your IP:
- **macOS/Linux**: Run `ifconfig` and look for `inet` under your network interface
- **Windows**: Run `ipconfig` and look for `IPv4 Address`

3. **Start the development server**:
```bash
npm start
```

4. **Run on device/simulator**:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
mobile/
├── App.js                      # Main app component
├── app.json                    # Expo configuration
├── package.json
├── src/
│   ├── api/                    # API client and endpoints
│   │   ├── client.js           # Axios instance with JWT
│   │   ├── auth.js
│   │   ├── scan.js
│   │   ├── recipes.js
│   │   ├── ingredients.js
│   │   └── meals.js
│   ├── components/             # Reusable components
│   │   ├── LoadingSpinner.js
│   │   ├── MacroDisplay.js
│   │   ├── IngredientCard.js
│   │   └── RecipeCard.js
│   ├── screens/                # App screens
│   │   ├── AuthScreen.js
│   │   ├── SplashScreen.js
│   │   ├── HomeScreen.js
│   │   ├── CameraScreen.js
│   │   ├── ReviewIngredientsScreen.js
│   │   ├── ManualIngredientsScreen.js
│   │   ├── RecipeMatchesScreen.js
│   │   ├── RecipeDetailScreen.js
│   │   ├── LogMealScreen.js
│   │   ├── HistoryScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/
│   │   └── AppNavigator.js     # React Navigation setup
│   ├── context/
│   │   ├── AuthContext.js      # Authentication state
│   │   └── ScanContext.js      # Scan state
│   ├── utils/
│   │   ├── storage.js          # AsyncStorage helpers
│   │   └── imageHelper.js      # Image compression
│   └── constants/
│       ├── colors.js
│       └── config.js
└── assets/
    └── images/
```

## User Flow

1. **Login/Register** → User authenticates
2. **Home Screen** → Dashboard with today's nutrition
3. **Camera Screen** → Take photo or select from gallery
4. **Review Ingredients** → Confirm AI-detected ingredients
5. **Add Manual Ingredients** → Search and select additional ingredients
6. **Recipe Matches** → View matched recipes sorted by score
7. **Recipe Details** → View full recipe with nutrition info
8. **Log Meal** → Select meal type and servings
9. **History** → View nutrition stats over time

## Key Dependencies

- `expo` - Expo framework
- `react-navigation` - Navigation
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Local storage
- `expo-camera` - Camera access
- `expo-image-picker` - Image selection
- `react-native-chart-kit` - Charts for nutrition stats

## Troubleshooting

### Cannot connect to API
- Make sure the backend server is running
- Check that `API_BASE_URL` in `config.js` uses your computer's IP address (not localhost)
- Ensure your phone/emulator is on the same network as your development machine

### Camera permissions denied
- Check that camera permissions are granted in device settings
- Restart the Expo app after granting permissions

### Build errors
- Delete `node_modules` and run `npm install` again
- Clear Expo cache: `expo start -c`

## Development

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (limited functionality)
npm run web
```

## Production Build

For production builds, you'll need to configure:
1. App icons and splash screen
2. Bundle identifier (iOS) / Package name (Android)
3. Permissions and app settings
4. Production API endpoint

Refer to Expo documentation for building standalone apps.

## License

Private project for FitMeal AI
