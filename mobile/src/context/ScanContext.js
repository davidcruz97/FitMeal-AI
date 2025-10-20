import React, { createContext, useState, useContext } from 'react';

const ScanContext = createContext({});

export const ScanProvider = ({ children }) => {
  const [currentScan, setCurrentScan] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [matchedRecipes, setMatchedRecipes] = useState([]);

  // Update current scan data
  const updateScan = (scanData) => {
    setCurrentScan(scanData);
    if (scanData?.detected_ingredients) {
      setSelectedIngredients(
        scanData.detected_ingredients.map(ing => ing.ingredient_id)
      );
    }
  };

  // Toggle ingredient selection
  const toggleIngredient = (ingredientId) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        return prev.filter(id => id !== ingredientId);
      } else {
        return [...prev, ingredientId];
      }
    });
  };

  // Add ingredient manually
  const addIngredient = (ingredientId) => {
    if (!selectedIngredients.includes(ingredientId)) {
      setSelectedIngredients(prev => [...prev, ingredientId]);
    }
  };

  // Remove ingredient
  const removeIngredient = (ingredientId) => {
    setSelectedIngredients(prev => prev.filter(id => id !== ingredientId));
  };

  // Clear all selected ingredients
  const clearIngredients = () => {
    setSelectedIngredients([]);
  };

  // Update matched recipes
  const updateMatchedRecipes = (recipes) => {
    setMatchedRecipes(recipes);
  };

  // Reset scan context
  const resetScan = () => {
    setCurrentScan(null);
    setSelectedIngredients([]);
    setMatchedRecipes([]);
  };

  const value = {
    currentScan,
    selectedIngredients,
    matchedRecipes,
    updateScan,
    toggleIngredient,
    addIngredient,
    removeIngredient,
    clearIngredients,
    updateMatchedRecipes,
    resetScan,
  };

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
};

// Custom hook to use scan context
export const useScan = () => {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
};

export default ScanContext;
