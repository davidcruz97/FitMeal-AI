# app/models/user.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    """User model with comprehensive health, fitness, and nutrition features"""
    
    __tablename__ = 'users'
    
    # ============================================
    # CORE FIELDS
    # ============================================
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Authentication
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile
    full_name = db.Column(db.String(255), nullable=False)
    user_type = db.Column(
        db.String(50), 
        nullable=False, 
        default='user',
        index=True
    )  # 'admin', 'nutritionist', 'user'
    
    # Status & Verification
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verified_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps (AUTO-MANAGED)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # Last activity tracking
    last_login_at = db.Column(db.DateTime, nullable=True)
    
    # ============================================
    # ONBOARDING - Goals (Multi-select)
    # ============================================
    
    fitness_goals = db.Column(db.JSON, nullable=True)
    # ['improve_fitness', 'build_muscle', 'shred_fat', 'toned_body', 
    #  'weight_loss', 'improve_mental_health', 'balance', 'maintain_muscle',
    #  'core_strength', 'optimize_workouts', 'lean_gains', 'hormones_regulation']
    
    # ============================================
    # ONBOARDING - Basic Info
    # ============================================
    
    gender = db.Column(db.String(10), nullable=True)  # 'male', 'female'
    age = db.Column(db.Integer, nullable=True)  # years
    height = db.Column(db.Integer, nullable=True)  # cm
    weight = db.Column(db.Numeric(5, 2), nullable=True)  # kg (current weight)
    
    # ============================================
    # ONBOARDING - Allergies & Restrictions
    # ============================================
    
    food_allergies = db.Column(db.JSON, nullable=True)  # [ingredient_id, ingredient_id, ...]
    
    # ============================================
    # ONBOARDING - Medical Conditions (Multi-select)
    # ============================================
    
    medical_conditions = db.Column(db.JSON, nullable=True)
    # ['hypothyroidism', 'eating_disorder_anemia', 'eating_disorder_anorexia', 
    #  'eating_disorder_bulimia', 'eating_disorder_compulsive', 'special_medications',
    #  'pregnancy_intention', 'polycystic_ovary', 'infertility', 'acne', 
    #  'insulin_resistance', 'diabetes']
    
    # ============================================
    # ONBOARDING - Activity & Lifting
    # ============================================
    
    activity_level = db.Column(db.String(20), nullable=True)
    # 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
    
    lifting_experience = db.Column(db.String(20), nullable=True)
    # 'beginner', 'intermediate', 'advanced'
    
    # ============================================
    # ONBOARDING - Workout Schedule
    # ============================================
    
    workout_days = db.Column(db.JSON, nullable=True)
    # ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    # User selects which days they will workout
    
    rest_days = db.Column(db.JSON, nullable=True)
    # Automatically calculated as inverse of workout_days
    
    # ============================================
    # CALCULATED NUTRITION TARGETS
    # ============================================
    
    calculated_bmr = db.Column(db.Integer, nullable=True)  # Basal Metabolic Rate (kcal)
    calculated_tdee = db.Column(db.Integer, nullable=True)  # Total Daily Energy Expenditure (kcal)
    target_calories = db.Column(db.Integer, nullable=True)  # Daily calorie target (kcal)
    target_protein = db.Column(db.Integer, nullable=True)  # grams per day
    target_carbs = db.Column(db.Integer, nullable=True)  # grams per day
    target_fats = db.Column(db.Integer, nullable=True)  # grams per day
    target_water = db.Column(db.Integer, nullable=True)  # ml per day
    
    # ============================================
    # PROFILE COMPLETION
    # ============================================
    
    profile_completed = db.Column(db.Boolean, default=False, nullable=False)
    profile_completed_at = db.Column(db.DateTime, nullable=True)
    
    # ============================================
    # ASSIGNED PLANS (Set by nutritionist or AI)
    # ============================================
    
    assigned_nutrition_plan_id = db.Column(db.Integer, nullable=True)  # FK to nutrition_plans table
    assigned_workout_plan_id = db.Column(db.Integer, nullable=True)  # FK to workout_plans table
    
    # ============================================
    # Relationships
    # ============================================
    
    meal_scans = db.relationship(
        'MealScan', 
        backref='user', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    meal_logs = db.relationship(
        'MealLog', 
        backref='user', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    # ============================================
    # Password Methods
    # ============================================
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    # ============================================
    # Utility Methods
    # ============================================
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login_at = datetime.utcnow()
        db.session.commit()
    
    def is_admin(self):
        """Check if user is admin"""
        return self.user_type == 'admin'
    
    def is_nutritionist(self):
        """Check if user is nutritionist"""
        return self.user_type in ['admin', 'nutritionist']
    
    def has_complete_profile(self):
        """Check if user has completed onboarding"""
        required_fields = [
            self.fitness_goals,
            self.gender,
            self.age,
            self.height,
            self.weight,
            self.activity_level,
            self.lifting_experience,
            self.workout_days
        ]
        return all(field is not None for field in required_fields)
    
    def calculate_rest_days(self):
        """Calculate rest days from workout days"""
        all_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        workout_days = self.workout_days or []
        self.rest_days = [day for day in all_days if day not in workout_days]
    
    # ============================================
    # Nutrition Calculation Methods
    # ============================================
    
    def calculate_bmr(self):
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
        
        Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
        Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
        """
        if not all([self.weight, self.height, self.age, self.gender]):
            return None
        
        weight_kg = float(self.weight)
        height_cm = float(self.height)
        age = int(self.age)
        
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
        
        if self.gender == 'male':
            bmr += 5
        else:  # female
            bmr -= 161
        
        return int(bmr)
    
    def calculate_tdee(self):
        """
        Calculate Total Daily Energy Expenditure
        TDEE = BMR × Activity Multiplier
        """
        bmr = self.calculate_bmr()
        if not bmr or not self.activity_level:
            return None
        
        # Activity multipliers
        multipliers = {
            'sedentary': 1.2,           # Little to no exercise
            'lightly_active': 1.375,    # Light exercise 1-3 days/week
            'moderately_active': 1.55,  # Moderate exercise 3-5 days/week
            'very_active': 1.725,       # Strenuous exercise 6-7 days/week
            'extremely_active': 1.9     # Strenuous exercise twice a day
        }
        
        multiplier = multipliers.get(self.activity_level, 1.2)
        tdee = bmr * multiplier
        
        return int(tdee)
    
    def calculate_target_calories(self):
        """
        Calculate daily calorie target based on fitness goals
        
        Goals affect calorie adjustment:
        - Weight loss / Shred fat: -500 kcal/day
        - Build muscle / Lean gains: +300 kcal/day
        - Toned body / Maintain muscle: TDEE
        - Balance: TDEE
        """
        tdee = self.calculate_tdee()
        if not tdee or not self.fitness_goals:
            return tdee
        
        # Determine calorie adjustment based on primary goals
        goals = self.fitness_goals or []
        
        # Weight loss goals (deficit)
        if any(goal in goals for goal in ['weight_loss', 'shred_fat']):
            return tdee - 500
        
        # Muscle building goals (surplus)
        elif any(goal in goals for goal in ['build_muscle', 'lean_gains']):
            return tdee + 300
        
        # Maintenance goals
        else:
            return tdee
    
    def calculate_macro_targets(self):
        """
        Calculate protein, carbs, and fats targets based on goals
        
        Protein priorities:
        - Build muscle: 2.2g per kg bodyweight
        - Shred fat / Weight loss: 2.0g per kg bodyweight
        - Maintain / Toned: 1.8g per kg bodyweight
        - General fitness: 1.6g per kg bodyweight
        
        Fats: 25-30% of calories (hormonal health)
        Carbs: Remaining calories
        """
        target_calories = self.calculate_target_calories()
        if not target_calories or not self.weight:
            return None, None, None
        
        weight_kg = float(self.weight)
        goals = self.fitness_goals or []
        
        # Protein calculation based on goals
        if any(goal in goals for goal in ['build_muscle', 'lean_gains']):
            protein_per_kg = 2.2
        elif any(goal in goals for goal in ['weight_loss', 'shred_fat']):
            protein_per_kg = 2.0
        elif any(goal in goals for goal in ['toned_body', 'maintain_muscle']):
            protein_per_kg = 1.8
        else:
            protein_per_kg = 1.6
        
        target_protein = int(weight_kg * protein_per_kg)
        
        # Fats: 30% of calories (important for hormones)
        fat_calories = target_calories * 0.30
        target_fats = int(fat_calories / 9)  # 9 kcal per gram of fat
        
        # Carbs: remaining calories
        protein_calories = target_protein * 4  # 4 kcal per gram
        remaining_calories = target_calories - protein_calories - fat_calories
        target_carbs = int(remaining_calories / 4)  # 4 kcal per gram
        
        return target_protein, target_carbs, target_fats
    
    def calculate_water_target(self):
        """
        Calculate daily water intake target
        
        Base: 35ml per kg bodyweight
        + 500ml per workout day
        + 250ml if very/extremely active
        """
        if not self.weight:
            return None
        
        weight_kg = float(self.weight)
        
        # Base water intake: 35ml per kg
        base_water = int(weight_kg * 35)
        
        # Add for workout days
        workout_days_count = len(self.workout_days) if self.workout_days else 0
        workout_bonus = int((workout_days_count / 7) * 500)  # Average per day
        
        # Add for high activity
        activity_bonus = 0
        if self.activity_level in ['very_active', 'extremely_active']:
            activity_bonus = 250
        
        total_water = base_water + workout_bonus + activity_bonus
        
        return total_water
    
    def update_nutrition_targets(self):
        """
        Calculate and update all nutrition targets
        Call this after user completes profile or updates relevant info
        """
        self.calculated_bmr = self.calculate_bmr()
        self.calculated_tdee = self.calculate_tdee()
        self.target_calories = self.calculate_target_calories()
        
        protein, carbs, fats = self.calculate_macro_targets()
        self.target_protein = protein
        self.target_carbs = carbs
        self.target_fats = fats
        
        self.target_water = self.calculate_water_target()
        
        # Calculate rest days
        self.calculate_rest_days()
        
        # Mark profile as completed if all required fields present
        if self.has_complete_profile():
            self.profile_completed = True
            if not self.profile_completed_at:
                self.profile_completed_at = datetime.utcnow()
        
        db.session.commit()
    
    # ============================================
    # API Serialization
    # ============================================
    
    def to_dict(self, include_sensitive=False, include_nutrition=True):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'user_type': self.user_type,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'profile_completed': self.profile_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        # Include onboarding data if profile completed
        if self.profile_completed:
            data['profile'] = {
                # Goals
                'fitness_goals': self.fitness_goals or [],
                
                # Basic info
                'gender': self.gender,
                'age': self.age,
                'height': self.height,
                'weight': float(self.weight) if self.weight else None,
                
                # Restrictions
                'food_allergies': self.food_allergies or [],
                'medical_conditions': self.medical_conditions or [],
                
                # Activity
                'activity_level': self.activity_level,
                'lifting_experience': self.lifting_experience,
                
                # Schedule
                'workout_days': self.workout_days or [],
                'rest_days': self.rest_days or [],
                'workout_days_per_week': len(self.workout_days) if self.workout_days else 0,
            }
            
            # Include nutrition targets
            if include_nutrition:
                data['nutrition_targets'] = {
                    'bmr': self.calculated_bmr,
                    'tdee': self.calculated_tdee,
                    'calories': self.target_calories,
                    'protein': self.target_protein,
                    'carbs': self.target_carbs,
                    'fats': self.target_fats,
                    'water': self.target_water,
                }
            
            # Include assigned plans
            data['assigned_plans'] = {
                'nutrition_plan_id': self.assigned_nutrition_plan_id,
                'workout_plan_id': self.assigned_workout_plan_id,
            }
        
        if include_sensitive:
            data['updated_at'] = self.updated_at.isoformat() if self.updated_at else None
            data['email_verified_at'] = self.email_verified_at.isoformat() if self.email_verified_at else None
            data['profile_completed_at'] = self.profile_completed_at.isoformat() if self.profile_completed_at else None
        
        return data