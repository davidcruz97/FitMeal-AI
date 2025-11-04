# FitMeal-AI

> AI-powered nutrition tracking application combining computer vision with personalized nutrition guidance

## What is FitMeal-AI?

FitMeal-AI is a comprehensive mobile-first nutrition assistant that helps users make healthier meal choices through artificial intelligence and computer vision. The application combines ingredient detection from food photos with personalized nutrition planning, real-time meal tracking, and AI-powered coaching to create a complete nutrition management system.

### Problem Statement

Many people struggle with:
- Not knowing what healthy meals they can make with available ingredients
- Difficulty tracking nutritional intake accurately
- Lack of personalized nutrition guidance
- Time-consuming meal planning process
- Limited understanding of their nutritional needs

**FitMeal-AI solves these challenges** by automating ingredient detection, providing personalized nutrition targets, and offering real-time AI coaching based on individual goals and health profiles.

---

## Key Features

### User Features (Mobile App)
- **AI-Powered Ingredient Detection** - Take photos of ingredients for instant recognition using Claude Vision API
- **Personalized Nutrition Planning** - Complete 10-screen onboarding calculating BMR, TDEE, and customized macro targets
- **Smart Recipe Matching** - Find recipes based on detected ingredients with match scoring
- **Real-Time Nutritional Tracking** - USDA-verified macro calculations with daily progress monitoring
- **Meal Logging & History** - Track consumed meals across different time periods
- **Local AI Nutrition Advisor** - Ask nutrition questions and get personalized advice using Ollama
- **Meal Recommendations** - AI-generated meal suggestions based on your profile and goals
- **Manual Ingredient Entry** - Autocomplete search with USDA nutrition data

### Nutritionist Features (Web Admin Panel)
- **Recipe Management** - Create and edit healthy recipes with nutritional calculations
- **Ingredient Database** - Manage ingredients with automatic USDA FoodData Central integration
- **User Analytics** - Monitor app usage and popular recipes
- **Content Verification** - Quality control for published recipes
- **Advanced Nutrition Tools** - Professional calculators for coaching clients

---

## Architecture

### Technology Stack

#### Backend (Flask REST API)
- **Framework**: Flask 3.0 with SQLAlchemy ORM
- **Database**: PostgreSQL 14+
- **Computer Vision**: Claude Vision API (Anthropic Sonnet 4.5)
- **Local AI**: Ollama with Llama 3.2-3b for privacy-focused AI features
- **Authentication**: JWT tokens (Flask-JWT-Extended)
- **Caching**: Redis for performance optimization
- **Rate Limiting**: Redis-backed request throttling
- **API Integration**: USDA FoodData Central for nutritional data
- **Deployment**: Nginx + Gunicorn (4 workers) + Supervisor

#### Mobile App (React Native + Expo)
- **Framework**: Expo managed workflow
- **Navigation**: React Navigation 6
- **State Management**: React Context API + custom hooks
- **HTTP Client**: Axios with JWT interceptors
- **Camera**: Expo Camera + Image Picker
- **Platform Support**: iOS (primary), Android (future)

### System Architecture

```
┌─────────────────────────┐
│   React Native App      │
│   (Expo)                │
│   - Camera              │
│   - Onboarding Flow     │
│   - Nutrition Dashboard │
└───────────┬─────────────┘
            │ HTTPS/JWT
            ↓
┌─────────────────────────┐
│   Flask API Server      │
│   - Authentication      │
│   - Onboarding Logic    │
│   - Recipe Matching     │
│   - Meal Tracking       │
└───────┬─────────────────┘
        │
    ┌───┴──────────────────┬──────────────────┬─────────────┐
    ↓                      ↓                  ↓             ↓
┌──────────┐      ┌─────────────┐   ┌──────────────┐  ┌────────┐
│ Claude   │      │ PostgreSQL  │   │    Redis     │  │ Ollama │
│ Vision   │      │  Database   │   │ Cache + Rate │  │ Llama  │
│   API    │      │             │   │   Limiting   │  │ 3.2-3b │
└──────────┘      └─────────────┘   └──────────────┘  └────────┘
     │                                                      │
     ↓                                                      ↓
┌──────────────────┐                            ┌────────────────┐
│ USDA FoodData    │                            │ Local AI       │
│ Central API      │                            │ Processing     │
└──────────────────┘                            └────────────────┘
```

---

## Getting Started

### Prerequisites

**Backend Requirements:**
- Python 3.9+
- PostgreSQL 14+
- Redis 6+
- Ollama with Llama 3.2-3b model
- 8GB RAM minimum
- Anthropic API key for Claude Vision
- USDA API key (free tier available)

**Mobile Requirements:**
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Backend Setup

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/FitMeal-AI.git
cd FitMeal-AI
```

2. **Create virtual environment**:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**:
Create a `.env` file with the following configuration:

```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fitmeal_db

# JWT
JWT_SECRET_KEY=your-jwt-secret-here
JWT_ACCESS_TOKEN_EXPIRES=604800

# Redis
REDIS_URL=redis://localhost:6379/0
CACHE_TYPE=redis
CACHE_REDIS_URL=redis://localhost:6379/1
RATELIMIT_STORAGE_URL=redis://localhost:6379/2

# Upload Configuration
MAX_CONTENT_LENGTH=5242880
UPLOAD_FOLDER=app/static/uploads
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp

# Claude Vision API
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# USDA API
USDA_API_KEY=your-usda-api-key-here
USDA_API_URL=https://api.nal.usda.gov/fdc/v1

# Server
HOST=0.0.0.0
PORT=8001
WORKERS=4
```

5. **Initialize database**:
```bash
# Create PostgreSQL database
createdb fitmeal_db

# Run migrations
flask db upgrade

# Optional: Seed with sample data
flask init-db
```

6. **Install and start Ollama** (for local AI features):
```bash
# Install Ollama from https://ollama.com
ollama pull llama3.2:3b
ollama serve
```

7. **Start Redis**:
```bash
redis-server
```

8. **Run the development server**:
```bash
flask run --host=0.0.0.0 --port=8001
```

The API will be available at `http://localhost:8001`

### Mobile App Setup

1. **Navigate to mobile directory**:
```bash
cd mobile
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure API endpoint**:
Edit `src/constants/config.js`:
```javascript
export const API_BASE_URL = 'http://localhost:8001/api'; // Development
// export const API_BASE_URL = 'https://fitmeal.cinturillas247.com/api'; // Production
```

4. **Start Expo development server**:
```bash
npx expo start
```

5. **Run on device/simulator**:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

---

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "user"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Onboarding

#### Complete Onboarding
```http
POST /api/onboarding/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "fitness_goals": ["build_muscle", "lean_gains"],
  "gender": "male",
  "age": 28,
  "height": 175,
  "weight": 75.5,
  "food_allergies": [123, 456],
  "medical_conditions": ["hypothyroidism"],
  "activity_level": "moderately_active",
  "lifting_experience": "intermediate",
  "workout_days": ["monday", "wednesday", "friday"]
}
```

**Response:**
```json
{
  "message": "Onboarding completed successfully",
  "user": {
    "profile_completed": true,
    "nutrition_targets": {
      "bmr": 1750,
      "tdee": 2713,
      "calories": 2438,
      "protein": 165,
      "carbs": 274,
      "fats": 68,
      "water": 2900
    }
  }
}
```

### Ingredient Detection

#### Upload Photo for Detection
```http
POST /api/scan
Authorization: Bearer {token}
Content-Type: multipart/form-data

image: [binary file data]
auto_detect: true
```

**Response:**
```json
{
  "message": "Image uploaded and processed successfully",
  "scan_id": 123,
  "image_url": "/static/uploads/scans/uuid.jpg",
  "status": "completed",
  "processing_time_ms": 3240,
  "detected_ingredients": [
    {
      "ingredient_id": 1,
      "ingredient_name": "Apple",
      "detected_as": "apple",
      "confidence": 0.95,
      "source": "claude"
    }
  ],
  "total_detected": 5
}
```

### Recipe Matching

#### Find Matching Recipes
```http
POST /api/recipes/match
Authorization: Bearer {token}
Content-Type: application/json

{
  "ingredient_ids": [1, 5, 8],
  "max_results": 10
}
```

**Response:**
```json
{
  "matches": [
    {
      "recipe": {
        "id": 1,
        "name": "Grilled Chicken Bowl",
        "category": "lunch",
        "prep_time_minutes": 15,
        "servings": 2,
        "nutritional_info": {
          "per_serving": {
            "calories": 450,
            "protein": 45,
            "carbs": 35,
            "fats": 12
          }
        }
      },
      "match_score": 85.7,
      "matched_ingredients": 3,
      "total_ingredients": 4
    }
  ],
  "total_matches": 5
}
```

### Meal Logging

#### Log Consumed Meal
```http
POST /api/meals/log
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipe_id": 1,
  "meal_type": "lunch",
  "servings_consumed": 1.5,
  "notes": "Delicious!",
  "scan_id": 123
}
```

### AI Features

#### Get Meal Recommendations
```http
POST /api/ai/recommend-meals
Authorization: Bearer {token}
Content-Type: application/json

{
  "available_ingredients": ["chicken", "broccoli"],
  "meal_type": "dinner"
}
```

#### Ask Nutrition Question
```http
POST /api/ai/ask-nutrition
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "How much protein should I eat after a workout?"
}
```

### Additional Endpoints

- `GET /api/onboarding/options` - Get valid options for onboarding screens
- `GET /api/ingredients/search?q=chicken` - Autocomplete ingredient search
- `GET /api/recipes/:id` - Get detailed recipe information
- `GET /api/meals/history?days=7` - Get meal history
- `GET /api/meals/stats?period=week` - Get nutrition statistics
- `POST /api/ai/warmup` - Warm up AI model for faster responses
- `GET /api/ai/status` - Check AI system status

---

## AI & Computer Vision

### Ingredient Detection System

FitMeal-AI uses **Claude Vision API (Sonnet 4.5)** for state-of-the-art ingredient detection:

#### Detection Features:
- **High Accuracy**: Claude's advanced vision model excels at multi-ingredient detection
- **Confidence Scoring**: Each detection includes confidence level (0.0-1.0)
- **Quantity Estimation**: Rough quantity estimates for better recipe matching
- **Specialized Food Recognition**: Optimized prompt engineering for ingredient identification

#### Detection Pipeline:
```python
def detect_ingredients(image_path):
    # Step 1: Upload image to Claude Vision API
    # Step 2: Process with specialized food detection prompt
    # Step 3: Parse structured JSON response
    # Step 4: Filter by confidence threshold (>0.5)
    # Step 5: Map detections to database ingredients
    # Step 6: Return matched ingredients with metadata
```

#### Ingredient Mapping:
Detected food names are intelligently mapped to the database through:
1. **Exact name matching** - Direct database lookup
2. **Plural normalization** - "apples" becomes "apple"
3. **Alias resolution** - "red bell pepper" maps to "bell pepper"
4. **Fuzzy matching** - Handles variations in naming

### Local AI Assistant

FitMeal-AI features an on-device AI nutrition advisor powered by **Ollama with Llama 3.2-3b**:

#### AI Capabilities:
- **Personalized Meal Recommendations**: Suggests meals based on user profile and goals
- **Nutrition Q&A**: Answers questions with context from user's health data
- **Recipe Generation**: Creates custom recipes hitting specific macro targets
- **Meal Timing Advice**: Optimizes meal timing around workout schedule
- **Macro Explanations**: Educational content about nutrition fundamentals

#### Privacy & Performance:
- **100% Local Processing**: All AI inference runs on your server
- **No Data Sharing**: User conversations never leave your infrastructure
- **Model Warmup**: Pre-load model into RAM for 2-3 second response times
- **Thread-Safe**: Handles multiple users simultaneously via Ollama's queuing
- **Safety Filters**: Built-in allergen and medical condition awareness

---

## Database Schema

### Core Tables

**users** - User accounts and profile data
- Authentication credentials
- Personal information (age, height, weight, gender)
- Fitness goals and preferences
- Medical conditions and food allergies
- Activity level and workout schedule
- Calculated nutrition targets (BMR, TDEE, macros)

**ingredients** - Food ingredient database
- Name and category
- USDA FoodData Central integration
- Nutritional values per 100g
- Serving size information (RACC data)
- Image URLs

**recipes** - Recipe collection
- Basic information (name, description, category)
- Instructions and preparation details
- Servings, prep time, cook time
- Created by nutritionists
- Publishing status

**recipe_ingredients** - Junction table
- Links recipes to ingredients
- Quantity and unit information
- Normalized quantity_grams for calculations
- Preparation notes
- Display order

**meal_scans** - User scan history
- Image storage path
- Detection results and metadata
- Processing status and timing
- Source tracking (claude)

**meal_logs** - Consumed meal tracking
- Recipe reference
- Meal type (breakfast/lunch/dinner/snack)
- Servings consumed
- Logged nutritional values
- Timestamp with timezone support

### Key Design Decisions

**Dynamic Macro Calculation**
- Nutritional values calculated in real-time from ingredients
- No stored macro data in recipes table
- Always accurate, even after ingredient updates
- Based on `quantity_grams` field for consistency

**Comprehensive User Profiling**
- 10-screen onboarding captures detailed user data
- Automatic BMR/TDEE calculations using Mifflin-St Jeor equation
- Goal-based macro distribution
- Activity-adjusted calorie targets

**Timezone-Aware Logging**
- All timestamps stored in UTC
- Converted to user timezone for display
- Proper daily meal aggregation

---

## Nutrition Calculation System

### Onboarding Flow

FitMeal-AI uses a comprehensive 10-screen onboarding process:

1. **Fitness Goals** (multi-select)
   - Build muscle, shred fat, toned body, weight loss, etc.

2. **Gender**
   - Male or Female (affects BMR calculations)

3. **Age, Height, Weight**
   - Required for BMR/TDEE calculations

4. **Food Allergies**
   - Select from ingredient database for safety filtering

5. **Medical Conditions** (multi-select)
   - Hypothyroidism, diabetes, eating disorders, PCOS, etc.
   - Affects nutrition recommendations and AI safety filters

6. **Activity Level**
   - Sedentary to extremely active
   - Determines TDEE multiplier

7. **Lifting Experience**
   - Beginner, intermediate, or advanced
   - Influences protein recommendations

8. **Workout Days**
   - Select specific days of week
   - Used for meal timing optimization

### Nutrition Target Calculations

**BMR (Basal Metabolic Rate)**
- Formula: Mifflin-St Jeor equation
- Men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
- Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

**TDEE (Total Daily Energy Expenditure)**
- Formula: BMR × Activity Multiplier
- Sedentary: 1.2
- Lightly active: 1.375
- Moderately active: 1.55
- Very active: 1.725
- Extremely active: 1.9

**Target Calories**
- Weight loss: TDEE - 10%
- Muscle gain: TDEE + 10%
- Maintenance: TDEE

**Macro Distribution**
- Protein: 2.0-2.2g per kg bodyweight (goal-dependent)
- Fats: 25% of total calories
- Carbs: Remaining calories

**Water Intake**
- Base: 35ml per kg bodyweight
- Workout bonus: +500ml per workout day (averaged daily)
- High activity bonus: +250ml for very/extremely active

---

## Production Deployment

### Server Configuration

**Current Production Setup:**
- **Server**: VPS with 2-Core CPU, 8GB RAM
- **OS**: Ubuntu 22.04 LTS
- **Domain**: fitmeal.cinturillas247.com
- **SSL**: Let's Encrypt via Certbot

**Service Stack:**
- **Nginx**: Reverse proxy with SSL termination
- **Gunicorn**: WSGI server (4 workers)
- **Supervisor**: Process management and auto-restart
- **PostgreSQL**: Main database
- **Redis**: Caching and rate limiting
- **Ollama**: Local LLM server

### Performance Optimizations

**Backend:**
- Redis caching for frequent queries (ingredients, recipes)
- Database indexing on frequently queried columns
- Rate limiting to prevent abuse (20 scans/hour per user)
- Image compression before storage
- Lazy loading for recipe ingredients

**Mobile App:**
- Image compression before upload (max 5MB)
- Caching API responses with React Query
- Progressive image loading
- Offline mode for browsing cached recipes

### Benchmark Results

| Operation | Time | Notes |
|-----------|------|-------|
| Claude Vision Detection | 3-5s | Network-dependent |
| Recipe Matching | <100ms | 100+ recipes in database |
| Macro Calculation | <50ms | Dynamic from ingredients |
| Local AI Response | 2-3s | After warmup |
| Full Scan→Recipes Flow | 4-6s | Detection + matching |

---

## Development Guidelines

### Code Structure

```
FitMeal-AI/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── models/                  # SQLAlchemy models
│   │   ├── user.py             # User with nutrition logic
│   │   ├── ingredient.py       # Ingredient database
│   │   ├── recipe.py           # Recipe with macro calculation
│   │   └── meal_scan.py        # Scans and meal logs
│   ├── api/                     # API endpoints
│   │   ├── auth.py             # Authentication
│   │   ├── onboarding.py       # User onboarding
│   │   ├── scan.py             # Image upload & detection
│   │   ├── ingredients.py      # Ingredient search
│   │   ├── recipes.py          # Recipe matching
│   │   ├── meals.py            # Meal logging
│   │   ├── ai.py               # AI features
│   │   └── coach.py            # Coach tools
│   ├── vision/                  # Computer vision
│   │   ├── claude_detector.py  # Claude Vision API
│   │   └── ingredient_mapper.py # Detection→DB mapping
│   ├── ai/                      # Local AI features
│   │   ├── llm_manager.py      # Ollama management
│   │   ├── meal_recommender.py # Meal suggestions
│   │   ├── nutrition_advisor.py # Q&A system
│   │   ├── nutrition_calculator.py # Advanced calculations
│   │   ├── meal_planner.py     # Meal planning logic
│   │   └── safety.py           # Safety filters
│   ├── admin/                   # Web admin panel
│   │   └── routes.py           # Admin dashboard
│   └── utils/                   # Utilities
│       └── logger.py           # Structured logging
├── mobile/                      # React Native app
│   ├── src/
│   │   ├── api/                # API client functions
│   │   ├── components/         # Reusable components
│   │   ├── screens/            # App screens
│   │   ├── contexts/           # React contexts
│   │   ├── constants/          # Configuration
│   │   └── utils/              # Utilities
│   └── App.js                  # Entry point
├── migrations/                  # Database migrations
├── config.py                   # Flask configuration
├── run.py                      # Application entry point
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

### API Response Format

All API responses follow this structure:

**Success:**
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

**Error:**
```json
{
  "error": "Error description",
  "details": "Additional context (optional)"
}
```

### Logging

FitMeal-AI uses structured logging for debugging and monitoring:

```python
logger.info("Onboarding completed for user 123")
logger.warning("Detection confidence low: 0.35")
logger.error("Failed to connect to Ollama")
logger.debug("Mapping detection 'apple' to ingredient")
```

---

## Future Enhancements

### Planned Features
- Multi-language support (currently English with Spanish ingredient names)
- Barcode scanning for packaged foods
- Meal planning calendar (weekly/monthly views)
- Social features (share recipes with community)
- Integration with fitness trackers (Apple Health, Google Fit)
- Voice commands for meal logging
- Advanced dietary restriction filters (vegan, keto, paleo, etc.)
- Shopping list generation from meal plans
- Recipe import from URLs
- Batch meal prep calculator
- Progress photos and body measurements tracking

### Technical Improvements
- GraphQL API for more flexible queries
- Real-time updates via WebSockets
- Advanced caching strategies
- Machine learning for recipe recommendations
- Serverless functions for AI processing
- Multi-region deployment for lower latency
- Advanced analytics dashboard for coaches

---

## Contributing

This project is part of the **Staffbase AI Innovations Lab Challenge** and is actively developed for the competition.

### Sponsor
- **Organization**: Coaching FV
- **Coach**: Fernanda Villanueva
- **Website**: https://cinturillas247.com

### Development Team
- **Developer**: David Cruz
- **Email**: david.cruz.97@hotmail.com
- **Company**: Darbcon KMU
- **Website**: https://darbcon.com
- **GitHub**: [@davidcruz97](https://github.com/davidcruz97/)

---

## Competition Highlights

### Innovation & Technical Achievement

**Real AI Implementation**
- Not just API calls - runs local LLM (Llama 3.2-3b) for privacy-focused AI features
- Claude Vision API integration for state-of-the-art ingredient detection
- Hybrid approach combining cloud and local AI processing

**Comprehensive Solution**
- Complete nutrition management system, not just a feature
- 10-screen onboarding with scientific nutrition calculations
- Real-time meal tracking with timezone support
- Personalized AI coaching based on user health profiles

**Production-Ready Architecture**
- Deployed on VPS with professional infrastructure
- PostgreSQL for data integrity
- Redis for performance optimization
- Rate limiting and security best practices
- Comprehensive error handling and logging

**Practical Real-World Application**
- Solves actual nutrition planning problems
- Used by real clients of Coaching FV
- Proven 4-6 second end-to-end response time
- Handles multiple concurrent users

**Technical Excellence**
- RESTful API with JWT security
- SQLAlchemy ORM with proper relationships
- Dynamic macro calculation (never stale data)
- Thread-safe local AI processing
- Mobile-first responsive design

---

## License

This project is proprietary software developed for the Staffbase AI Innovations Lab Challenge.

**© 2024 Darbcon KMU. All rights reserved.**

---

## Contact & Support

For questions, feedback, or collaboration inquiries:

- **Email**: david.cruz.97@hotmail.com
- **GitHub**: [@davidcruz97](https://github.com/davidcruz97/)
- **Organization**: Darbcon KMU (https://darbcon.com)
- **Sponsor**: Coaching FV (https://cinturillas247.com)

---

**Built for healthier living through AI-powered nutrition tracking**
