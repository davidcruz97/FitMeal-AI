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

### Backend Requirements
```
- Python 3.9+
- PostgreSQL 14+
- Redis 6+
- Ollama with Llama 3.2-3b model
- 8GB RAM and 2 Cores minimum
- Anthropic API key for Claude Vision
- USDA API key (free tier available)
```

### Mobile Requirements
```
- Node.js 18+
- npm or yarn
- Expo CLI
- Internet connection
- iOS Simulator or Android Emulator (for development)
```

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
- **100% Local Processing**: All AI inference runs on our server
- **No Data Sharing**: User conversations never leave our infrastructure
- **Model Warmup**: Pre-load model into RAM for 10-20 second response times
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
- Prompt engineering for faster AI inference

**Mobile App:**
- Image compression before upload (max 5MB)
- Caching API responses with React Query
- Progressive image loading
- Offline mode for browsing cached recipes

### Benchmark Results

| Operation               | Time   | Notes                    |
|-------------------------|--------|--------------------------|
| Claude Vision Detection | 3-5s   | Network-dependent        |
| Recipe Matching         | <100ms | 100+ recipes in database |
| Macro Calculation       | <50ms  | Dynamic from ingredients |
| Local AI Response       | 15-30s | After warmup             |
| Full Scan→Recipes Flow  | 4-6s   | Detection + matching     |

---

## Development Guidelines

### Code Structure

```
FitMeal-AI/
├── app/
│   ├── __init__.py                 # Flask app factory
│   ├── models/                     # SQLAlchemy models
│   │   ├── user.py                 # User with nutrition logic
│   │   ├── ingredient.py           # Ingredient database
│   │   ├── recipe.py               # Recipe with macro calculation
│   │   └── meal_scan.py            # Scans and meal logs
│   ├── api/                        # API endpoints
│   │   ├── auth.py                 # Authentication
│   │   ├── onboarding.py           # User onboarding
│   │   ├── scan.py                 # Image upload & detection
│   │   ├── ingredients.py          # Ingredient search
│   │   ├── recipes.py              # Recipe matching
│   │   ├── meals.py                # Meal logging
│   │   ├── ai.py                   # AI features
│   │   └── coach.py                # Coach tools
│   ├── vision/                     # Computer vision
│   │   ├── claude_detector.py      # Claude Vision API
│   │   └── ingredient_mapper.py    # Detection→DB mapping
│   ├── ai/                         # Local AI features
│   │   ├── llm_manager.py          # Ollama management
│   │   ├── meal_recommender.py     # Meal suggestions
│   │   ├── nutrition_advisor.py    # Q&A system
│   │   ├── nutrition_calculator.py # Advanced calculations
│   │   ├── meal_planner.py         # Meal planning logic
│   │   └── safety.py               # Safety filters
│   ├── admin/                      # Web admin panel
│   │   └── routes.py               # Admin dashboard
│   └── utils/                      # Utilities
│       └── logger.py               # Structured logging
├── mobile/                         # React Native app
│   ├── src/
│   │   ├── api/                    # API client functions
│   │   ├── components/             # Reusable components
│   │   ├── screens/                # App screens
│   │   ├── contexts/               # React contexts
│   │   ├── constants/              # Configuration
│   │   └── utils/                  # Utilities
│   └── App.js                      # Entry point
├── migrations/                     # Database migrations
├── config.py                       # Flask configuration
├── run.py                          # Application entry point
├── requirements.txt                # Python dependencies
└── README.md                       # This file
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
- Multi-language support (currently English)
- Barcode scanning for packaged foods
- Meal planning calendar (weekly/monthly views)
- Social features (share recipes with community)
- Integration with fitness trackers (Apple Health, Google Fit)
- Advanced dietary restriction filters (vegan, keto, paleo, etc.)
- Shopping list generation from meal plans
- Progress photos and body measurements tracking

### Technical Improvements
- GraphQL API for more flexible queries
- Advanced caching strategies
- Machine learning for recipe recommendations
- Serverless functions for AI processing
- Multi-region deployment for lower latency
- Advanced analytics dashboard for coaches
- Prompt engineering optimization for 2-5s responses

---

## Contributing

This project is part of the **Staffbase AI Innovations Lab Challenge** and was developed for the competition.

### Sponsor
- **Organization**: Cinturillas 24/7
- **Nutritionist**: Fernanda Villanueva
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
- It will be later used by real clients of the sponsor
- Proven 4-6 second end-to-end response time
- Handles multiple concurrent users

**Technical Excellence**
- RESTful API with JWT security
- SQLAlchemy ORM with proper relationships
- Llama 3.2-3b: Smaller model, excellent quality
- CPU-only inference: No GPU required
- Thread-safe local AI processing
- Mobile-first responsive design

### Development Timeline

**Overview:** FitMeal-AI was developed in 16 days using modern AI-assisted development practices.

**Timeline**
- **October 20, 2025**: First commit - Initial Flask backend structure
- **October 21-25**: Core API development (auth, ingredients, recipes)
- **October 26-28**: React Native mobile app foundation
- **October 29-31**: Claude Vision API integration
- **November 1-2**: Local AI features with Ollama
- **November 3-4**: Production deployment and testing
- **November 5, 2025**: Published to Apple App Store

### Development Approach

**AI-Assisted Scaffolding**
- Design database schema and relationships
- Generate initial API endpoint structure
- Create boilerplate code for authentication
- Architect component hierarchy for mobile app

**Independent Development Built from scratch**
- 10-screen onboarding system with BMR/TDEE calculations
- Hybrid AI detection system (Claude Vision + local LLM)
- Complex nutrition calculation algorithms
- Production deployment infrastructure
- App Store submission and optimization

**This project demonstrates**
1. **Effective AI Tool Usage**: Leveraging AI for rapid scaffolding
2. **Engineering Skill**: Extending beyond AI assistance with complex logic
3. **Modern Workflow**: AI + human collaboration for maximum productivity
4. **Production Focus**: Delivering real value, not just prototypes
5. **Strategic architecture**: professional results on modest hardware

---

## License

This project is proprietary software developed for the Staffbase AI Innovations Lab Challenge under the sponsorship of Cinturillas 24/7.

**© 2025 Darbcon KMU. All rights reserved.**

---

## Contact & Support

For questions, feedback, or collaboration inquiries:

- **Email**: david.cruz.97@hotmail.com
- **GitHub**: [@davidcruz97](https://github.com/davidcruz97/)
- **Organization**: Darbcon KMU (https://darbcon.com)
- **Sponsor**: Cinturillas 24/7 (https://cinturillas247.com)

---

**Built for healthier living through AI-powered nutrition tracking**
