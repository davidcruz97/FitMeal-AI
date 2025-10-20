# 🍎 FitMeal-AI

> AI-powered meal planning application using computer vision to detect ingredients and suggest healthy recipes

## 📱 What is FitMeal-AI?

FitMeal-AI is a mobile-first nutrition assistant that helps users make healthier meal choices through **artificial intelligence** and **computer vision**. Simply take a photo of your ingredients, and our AI will:

1. 🔍 **Detect ingredients** using YOLOv8 computer vision
2. 🥗 **Match recipes** from a curated database
3. 📊 **Calculate nutrition** with real USDA data
4. ⏱️ **Track meals** throughout the day

### 🎯 Problem We Solve

Many people struggle with:
- Not knowing what healthy meals they can make with available ingredients
- Spending too much time planning meals
- Difficulty tracking nutritional intake
- Limited cooking knowledge

**FitMeal-AI makes healthy eating effortless** by automating ingredient detection and suggesting recipes instantly.

---

## ✨ Key Features

### For Users (Mobile App)
- 📸 **Photo-based ingredient detection** - Take a picture, get instant results
- 🔎 **Smart recipe matching** - Find recipes based on what you have
- 📊 **Nutritional tracking** - USDA-verified macro calculations
- 📝 **Meal logging** - Track your daily nutrition
- 🕐 **Meal history** - Review past meals and progress
- 🌮 **Manual ingredient input** - Autocomplete search fallback

### For Nutritionists (Web Admin Panel)
- 🍽️ **Recipe management** - Create and edit healthy recipes
- 🥕 **Ingredient database** - Manage ingredients with USDA integration
- 👥 **User analytics** - Monitor app usage and popular recipes
- ✅ **Content verification** - Quality control for recipes

---

## 🏗️ Architecture

### Tech Stack

#### Backend (Flask REST API)
- **Framework**: Flask 3.0 with SQLAlchemy ORM
- **Database**: PostgreSQL 14+
- **Computer Vision**: YOLOv8-nano (Ultralytics) + Clarifai fallback
- **Authentication**: JWT tokens (Flask-JWT-Extended)
- **Caching**: Redis
- **API Documentation**: RESTful design
- **Deployment**: Nginx + Gunicorn + Supervisor

#### Mobile App (React Native + Expo)
- **Framework**: Expo managed workflow
- **Navigation**: React Navigation 6
- **State Management**: React Context + React Query
- **HTTP Client**: Axios with JWT interceptors
- **Camera**: Expo Camera + Image Picker
- **Platform**: iOS (primary), Android (future)

### System Architecture Diagram

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
│  - Camera       │
│  - UI/UX        │
└────────┬────────┘
         │ HTTPS/JWT
         ↓
┌─────────────────┐
│  Flask API      │
│  - Auth         │
│  - Endpoints    │
└────────┬────────┘
         │
    ┌────┴─────────────┬──────────────┐
    ↓                  ↓              ↓
┌─────────┐     ┌──────────┐   ┌──────────┐
│YOLOv8   │     │PostgreSQL│   │  Redis   │
│Detector │     │ Database │   │  Cache   │
└─────────┘     └──────────┘   └──────────┘
    │
    ↓ (fallback)
┌─────────┐
│Clarifai │
│   API   │
└─────────┘
```

---

## 🚀 Getting Started

### Prerequisites

**Backend:**
- Python 3.9+
- PostgreSQL 14+
- Redis (optional, for caching)
- 8GB RAM minimum (for YOLOv8)

**Mobile:**
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

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
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
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

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Clarifai (optional - for enhanced detection)
CLARIFAI_PAT=your-clarifai-pat-here
```

5. **Initialize database**:
```bash
# Create PostgreSQL database
createdb fitmeal_db

# Run migrations
flask db upgrade

# Seed with sample data
flask init-db
```

6. **Download YOLOv8 model**:
```bash
# Model will auto-download on first run
# Or manually download to app/vision/models/yolov8n.pt
```

7. **Run the development server**:
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
```javascript
// src/constants/config.js
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

## 📡 API Documentation

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
  "message": "Image uploaded successfully",
  "scan_id": 123,
  "image_url": "https://fitmeal.cinturillas247.com/static/uploads/scans/abc-123.jpg",
  "status": "completed",
  "processing_time_ms": 2340,
  "detected_ingredients": [
    {
      "ingredient_id": 1,
      "ingredient_name": "Apple",
      "confidence": 0.95,
      "source": "yolo"
    },
    {
      "ingredient_id": 5,
      "ingredient_name": "Banana",
      "confidence": 0.87,
      "source": "clarifai"
    }
  ],
  "total_detected": 2
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
        "name": "Fruit Smoothie Bowl",
        "category": "breakfast",
        "prep_time_minutes": 10,
        "servings": 2,
        "nutritional_info": {
          "per_serving": {
            "calories": 245,
            "protein": 8.5,
            "carbs": 52.3,
            "fats": 3.2
          }
        }
      },
      "match_score": 85.7,
      "matched_ingredients": 3,
      "total_ingredients": 4,
      "missing_ingredients": 1
    }
  ],
  "total_matches": 5
}
```

### More Endpoints

- `GET /api/ingredients/search?q=chicken` - Autocomplete search
- `GET /api/recipes/:id` - Get recipe details
- `POST /api/meals/log` - Log consumed meal
- `GET /api/meals/history` - Get meal history
- `GET /api/meals/stats?days=7` - Get nutrition statistics

[View full API documentation](docs/API.md)

---

## 🧠 AI & Computer Vision

### Hybrid Detection Strategy

FitMeal-AI uses a **two-tier detection system** for optimal accuracy:

#### Primary: YOLOv8-nano (Local)
- Fast inference (~1-2 seconds)
- Runs on CPU (2-core, 8GB RAM)
- Detects 80+ common objects
- Confidence threshold: 0.25

#### Fallback: Clarifai Food Recognition API
- Triggered when:
  - Less than 2 ingredients detected by YOLO
  - Average confidence < 40%
- Specialized food detection model
- Higher accuracy for food items
- Confidence threshold: 0.30

#### Detection Pipeline

```python
def detect_ingredients_hybrid(image_path):
    # Step 1: YOLOv8 Detection
    yolo_results = yolo_detector.detect(image_path)
    
    # Step 2: Evaluate need for fallback
    if len(yolo_results) < 2 or avg_confidence < 0.4:
        # Step 3: Clarifai Fallback
        clarifai_results = clarifai_detector.detect(image_path)
        
        # Step 4: Merge & Deduplicate
        return merge_detections(yolo_results, clarifai_results)
    
    return yolo_results
```

### Ingredient Mapping

Detected objects are mapped to our ingredient database:

```python
# YOLOv8 class "apple" → Ingredient "Apple" (ID: 1)
# Clarifai "chicken breast" → Ingredient "Chicken Breast" (ID: 6)
```

Mapping strategies:
1. Exact name match
2. Partial/fuzzy match
3. Spanish name match (bilingual support bacuse of sponsor)

---

## 📊 Database Schema

### Core Tables

```sql
-- Users (authentication)
users (
  id, email, password_hash, full_name, 
  user_type, is_active, created_at
)

-- Ingredients (USDA-verified nutrition)
ingredients (
  id, name, name_es, category,
  calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g,
  yolo_detectable, usda_fdc_id, is_verified
)

-- Recipes (created by nutritionists)
recipes (
  id, name, category, instructions, 
  prep_time_minutes, servings, created_by_id
)

-- Recipe Ingredients (junction table)
recipe_ingredients (
  id, recipe_id, ingredient_id, 
  quantity, unit, quantity_grams
)

-- Meal Scans (user detection history)
meal_scans (
  id, user_id, image_path, 
  detected_ingredients, processing_status
)

-- Meal Logs (tracking consumed meals)
meal_logs (
  id, user_id, recipe_id, meal_type,
  calories_logged, consumed_at
)
```

### Key Design Decisions

✅ **No Stored Macros**: Nutritional values calculated dynamically from ingredients
- Prevents stale data
- Always accurate, even after ingredient updates

✅ **Soft Deletes**: Records marked as deleted, not physically removed
- Data integrity
- Allows recovery
- Historical tracking

✅ **Hybrid Detection Storage**: Stores both YOLO and Clarifai results
- Enables algorithm improvement
- A/B testing capability
- Debugging support

---

## 🎨 Mobile App

### Key Screens:
1. **Authentication** - Login/Register
2. **Camera** - Take photo of ingredients
3. **Detection Results** - AI-detected ingredients
4. **Recipe Matches** - Sorted by match score
5. **Recipe Detail** - Full instructions + macros
6. **Meal History** - Daily nutrition tracking

---

## 🚀 Deployment

### Production Server Setup

**Server Specs:**
- VPS with 2-Core CPU, 8GB RAM
- Ubuntu 22.04 LTS
- Nginx for reverse proxy
- Gunicorn for WSGI server
- Supervisor for process management

---

## 📈 Performance Optimization

### Backend Optimizations
- ✅ Redis caching for frequent queries (ingredients, recipes)
- ✅ Image compression before storage
- ✅ Database indexing on frequently queried columns
- ✅ Rate limiting to prevent abuse
- ✅ Lazy loading for recipe ingredients

### Mobile App Optimizations
- ✅ Image compression before upload (~1MB max)
- ✅ Caching API responses (React Query)
- ✅ Lazy loading images
- ✅ Offline mode for browsing cached recipes
- ✅ Progressive image loading

### Benchmark Results

| Operation              | Time   | Notes                |
|------------------------|--------|----------------------|
| YOLOv8 Detection (CPU) | 1-2s   | 2-core processor     |
| Clarifai Detection     | 2-3s   | Network-dependent    |
| Recipe Matching        | <100ms | 100 recipes        |
| Full API Response      | 3-5s   | Detection + matching |

---

### Future Enhancements
- [ ] Multi-language support (beyond Spanish)
- [ ] Barcode scanning for packaged foods
- [ ] Meal planning calendar
- [ ] Social features (share recipes)
- [ ] Integration with fitness trackers
- [ ] Voice commands
- [ ] Dietary restriction filters
- [ ] Shopping list generation

---

## 🤝 Contributing

- **Sponsor**: Fernanda Villanueva
- **Organization**: Coaching FV
- **Website**: https://cinturillas247.com

---

## 📞 Contact

- **Developer**: David Cruz
- **Email**: david.cruz.97@hotmail.com
- **Organization**: Darbcon KMU (https://darbcon.com)
- **GitHub**: [@davidcruz97](https://github.com/davidcruz97/)

---

## 🏆 Competition Notes

**Innovation Highlights:**
1. ✅ **Real AI Implementation** - Not just API calls, runs YOLOv8 locally
2. ✅ **Hybrid Detection** - Intelligent fallback strategy
3. ✅ **Dynamic Macro Calculation** - Always accurate, never stale
4. ✅ **Practical Solution** - Solves real nutrition planning problem
5. ✅ **Scalable Architecture** - Production-ready deployment

**Technical Achievements:**
- YOLOv8 running on CPU (resource-efficient)
- 3-5 second end-to-end response time
- RESTful API with JWT security
- Mobile-first design
- Real-world deployment on VPS

---

**Built with ❤️ for healthier eating through AI**
