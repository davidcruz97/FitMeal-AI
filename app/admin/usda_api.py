import os
import requests
from typing import List, Dict, Optional


class USDAFoodAPI:
    """Interface for USDA FoodData Central API"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('USDA_API_KEY')
        self.base_url = 'https://api.nal.usda.gov/fdc/v1'

    def search_foods(self, query: str, page_size: int = 25) -> List[Dict]:
        """
        Search for foods in the USDA database

        Args:
            query: Search term (e.g., "chicken breast")
            page_size: Number of results to return (max 200)

        Returns:
            List of food items with nutritional data
        """
        if not self.api_key:
            raise ValueError("USDA API key not configured. Please set USDA_API_KEY in .env")

        endpoint = f'{self.base_url}/foods/search'
        params = {
            'api_key': self.api_key,
            'query': query,
            'pageSize': min(page_size, 25),
            'dataType': ['Foundation', 'SR Legacy']  # Get high-quality data
        }

        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            return data.get('foods', [])

        except requests.exceptions.RequestException as e:
            print(f"USDA API Error: {e}")
            return []

    def get_food_details(self, fdc_id: int) -> Optional[Dict]:
        """
        Get detailed information about a specific food

        Args:
            fdc_id: FoodData Central ID

        Returns:
            Detailed food information including all nutrients
        """
        if not self.api_key:
            raise ValueError("USDA API key not configured")

        endpoint = f'{self.base_url}/food/{fdc_id}'
        params = {'api_key': self.api_key}

        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            print(f"USDA API Error: {e}")
            return None

    def extract_nutrients(self, food_data: Dict) -> Dict:
        """
        Extract key nutrients from USDA food data

        Args:
            food_data: Food details from USDA API

        Returns:
            Dictionary with calories, protein, carbs, fats per 100g
        """
        nutrients = {
            'calories': 0.0,
            'protein': 0.0,
            'carbs': 0.0,
            'fats': 0.0,
            'fiber': 0.0
        }

        # Nutrient IDs in USDA database
        nutrient_map = {
            '1008': 'calories',  # Energy (kcal)
            '1003': 'protein',   # Protein
            '1005': 'carbs',     # Carbohydrates
            '1004': 'fats',      # Total lipid (fat)
            '1079': 'fiber'      # Fiber, total dietary
        }

        food_nutrients = food_data.get('foodNutrients', [])

        for nutrient in food_nutrients:
            nutrient_id = str(nutrient.get('nutrient', {}).get('number', ''))
            amount = nutrient.get('amount', 0)

            if nutrient_id in nutrient_map:
                key = nutrient_map[nutrient_id]
                nutrients[key] = float(amount)

        return nutrients

    def import_to_ingredient(self, fdc_id: int) -> Optional[Dict]:
        """
        Import a food from USDA and format it for our Ingredient model

        Args:
            fdc_id: FoodData Central ID

        Returns:
            Dictionary with ingredient data ready for database insertion
        """
        food_data = self.get_food_details(fdc_id)

        if not food_data:
            return None

        nutrients = self.extract_nutrients(food_data)

        ingredient_data = {
            'name': food_data.get('description', '').title(),
            'category': self._map_category(food_data.get('foodCategory', {}).get('description', None)),
            'calories_per_100g': nutrients['calories'],
            'protein_per_100g': nutrients['protein'],
            'carbs_per_100g': nutrients['carbs'],
            'fats_per_100g': nutrients['fats'],
            'fiber_per_100g': nutrients['fiber'] if nutrients['fiber'] > 0 else None,
            'usda_fdc_id': fdc_id
        }

        return ingredient_data

    def _map_category(self, usda_category: str) -> str:
        """Map USDA category to our category system"""
        if not usda_category:
            return 'other'

        usda_lower = usda_category.lower()

        if any(word in usda_lower for word in ['vegetable', 'veget']):
            return 'vegetable'
        elif any(word in usda_lower for word in ['fruit']):
            return 'fruit'
        elif any(word in usda_lower for word in ['meat', 'poultry', 'fish', 'seafood', 'egg', 'protein']):
            return 'protein'
        elif any(word in usda_lower for word in ['grain', 'cereal', 'bread', 'pasta', 'rice']):
            return 'grain'
        elif any(word in usda_lower for word in ['dairy', 'milk', 'cheese', 'yogurt']):
            return 'dairy'
        else:
            return 'other'


# Singleton instance
usda_api = USDAFoodAPI()
