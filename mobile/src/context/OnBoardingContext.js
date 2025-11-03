import React, { createContext, useState, useContext } from 'react';

const OnBoardingContext = createContext({});

export const OnBoardingProvider = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState({
    // Screen 1: Goals (multi-select)
    fitness_goals: [],
    
    // Screen 2: Gender (single select)
    gender: null,
    
    // Screen 3: Food allergies (multi-select ingredient IDs)
    food_allergies: [],
    
    // Screen 4: Medical conditions (multi-select)
    medical_conditions: [],
    
    // Screen 5: Activity level (single select)
    activity_level: null,
    
    // Screen 6: Lifting experience (single select)
    lifting_experience: null,
    
    // Screen 7: Age
    age: null,
    
    // Screen 8: Height (cm)
    height_cm: null,
    
    // Screen 9: Current weight (kg)
    current_weight_kg: null,
    
    // Screen 10: Workout days (array of selected days)
    workout_days: [],
  });

  const updateOnboardingData = (field, value) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetOnboarding = () => {
    setOnboardingData({
      fitness_goals: [],
      gender: null,
      food_allergies: [],
      medical_conditions: [],
      activity_level: null,
      lifting_experience: null,
      age: null,
      height_cm: null,
      current_weight_kg: null,
      workout_days: [],
    });
  };

  const value = {
    onboardingData,
    updateOnboardingData,
    resetOnboarding,
  };

  return (
    <OnBoardingContext.Provider value={value}>
      {children}
    </OnBoardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnBoardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

export default OnBoardingContext;