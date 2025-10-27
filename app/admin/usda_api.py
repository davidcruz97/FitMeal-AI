import os
import requests
import logging
from typing import List, Dict, Optional

# Set up logger for this module
logger = logging.getLogger(__name__)


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
            logger.error("USDA API key not configured")
            raise ValueError("USDA API key not configured. Please set USDA_API_KEY in .env")

        endpoint = f'{self.base_url}/foods/search'
        params = {
            'api_key': self.api_key,
            'query': query,
            'pageSize': min(page_size, 25),
            'dataType': ['Foundation', 'SR Legacy']  # Get high-quality data
        }

        try:
            logger.info(f"🔍 USDA API: Searching for '{query}'")
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            foods = data.get('foods', [])
            logger.info(f"✅ USDA API: Found {len(foods)} results for '{query}'")
            
            return foods

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ USDA API Error: {e}")
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
            logger.error("USDA API key not configured")
            raise ValueError("USDA API key not configured")

        endpoint = f'{self.base_url}/food/{fdc_id}'
        params = {'api_key': self.api_key}

        try:
            logger.info(f"📥 USDA API: Fetching details for FDC ID {fdc_id}")
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"✅ USDA API: Retrieved details for '{data.get('description', 'Unknown')}'")
            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ USDA API Error fetching FDC ID {fdc_id}: {e}")
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
            'fiber': 0.0,
            'saturated_fat': 0.0,
            'sugar': 0.0,
            'sodium': 0.0
        }

        # Nutrient IDs in USDA database (multiple IDs for same nutrient due to different calculation methods)
        nutrient_map = {
            # Energy/Calories
            '1008': 'calories',  # Energy (kcal)
            '208': 'calories',   # Energy
            '957': 'calories',   # Energy (Atwater General Factors)
            '958': 'calories',   # Energy (Atwater Specific Factors)

            # Protein
            '1003': 'protein',   # Protein
            '203': 'protein',    # Protein

            # Carbohydrates
            '1005': 'carbs',     # Carbohydrate, by difference
            '205': 'carbs',      # Carbohydrate, by difference

            # Fats
            '1004': 'fats',      # Total lipid (fat)
            '204': 'fats',       # Total lipid (fat)

            # Fiber
            '1079': 'fiber',     # Fiber, total dietary
            '291': 'fiber',      # Fiber, total dietary

            # Saturated Fat
            '1258': 'saturated_fat',  # Fatty acids, total saturated
            '606': 'saturated_fat',   # Fatty acids, total saturated

            # Sugar
            '1063': 'sugar',     # Sugars, total
            '269': 'sugar',      # Sugars, total including NLEA

            # Sodium
            '1093': 'sodium',    # Sodium, Na
            '307': 'sodium'      # Sodium, Na
        }

        food_nutrients = food_data.get('foodNutrients', [])

        if not food_nutrients:
            logger.warning("⚠️ No nutrients found in food data")
            return nutrients

        logger.debug(f"🔬 Processing {len(food_nutrients)} nutrients from USDA data")

        # Debug: Log the structure of the first few nutrients
        for i, nutrient_data in enumerate(food_nutrients[:3]):
            logger.debug(f"📊 Nutrient {i+1} structure: {nutrient_data}")

        extracted_count = 0

        for nutrient_data in food_nutrients:
            try:
                # Check if nutrient_data is a dict
                if not isinstance(nutrient_data, dict):
                    continue
                
                # Get the amount/value
                amount = nutrient_data.get('amount') or nutrient_data.get('value', 0)

                # Skip if no amount
                if not amount:
                    continue

                # Try to get nutrient info (handles multiple API response formats)
                nutrient_info = nutrient_data.get('nutrient')
                nutrient_id = None

                if nutrient_info and isinstance(nutrient_info, dict):
                    # New API format: nutrient is a nested object
                    # Try 'number' first, then 'id'
                    nutrient_id = str(nutrient_info.get('number', ''))
                    if not nutrient_id or nutrient_id == '':
                        nutrient_id = str(nutrient_info.get('id', ''))
                else:
                    # Older API format: direct access
                    nutrient_id = str(nutrient_data.get('nutrientId', ''))
                    if not nutrient_id or nutrient_id == '':
                        nutrient_id = str(nutrient_data.get('nutrientNumber', ''))

                # Map to our nutrient keys
                if nutrient_id in nutrient_map:
                    key = nutrient_map[nutrient_id]
                    # Only update if we don't have a value yet or this value is better
                    if nutrients[key] == 0.0:
                        nutrients[key] = float(amount)
                        extracted_count += 1
                        logger.debug(f"   ✓ {key}: {nutrients[key]} (ID: {nutrient_id})")

            except (KeyError, ValueError, TypeError, AttributeError) as e:
                logger.debug(f"⚠️ Error processing nutrient: {e}")
                continue

        logger.info(
            f"✅ Extracted {extracted_count}/8 nutrients | "
            f"Calories: {nutrients['calories']:.1f} | "
            f"Protein: {nutrients['protein']:.1f}g | "
            f"Carbs: {nutrients['carbs']:.1f}g | "
            f"Fats: {nutrients['fats']:.1f}g | "
            f"Fiber: {nutrients['fiber']:.1f}g | "
            f"Sugar: {nutrients['sugar']:.1f}g | "
            f"Sat.Fat: {nutrients['saturated_fat']:.1f}g | "
            f"Sodium: {nutrients['sodium']:.1f}mg"
        )

        return nutrients

    def import_to_ingredient(self, fdc_id: int) -> Optional[Dict]:
        """
        Import a food from USDA and format it for our Ingredient model
    
        Args:
            fdc_id: FoodData Central ID
    
        Returns:
            Dictionary with ingredient data ready for database insertion
        """
        logger.info(f"📦 Importing ingredient from USDA FDC ID: {fdc_id}")
        
        food_data = self.get_food_details(fdc_id)
    
        if not food_data:
            logger.error(f"❌ Failed to retrieve food data for FDC ID {fdc_id}")
            return None
    
        nutrients = self.extract_nutrients(food_data)
        
        food_name = food_data.get('description', '').title()
        category = self._map_category(food_data.get('foodCategory', {}).get('description', None))
    
        ingredient_data = {
            'name': food_name,
            'category': category,
            'calories_per_100g': nutrients['calories'],
            'protein_per_100g': nutrients['protein'],
            'carbs_per_100g': nutrients['carbs'],
            'fats_per_100g': nutrients['fats'],
            'fiber_per_100g': nutrients['fiber'] if nutrients['fiber'] > 0 else None,
            'saturated_fat_per_100g': nutrients['saturated_fat'] if nutrients['saturated_fat'] > 0 else None,
            'sugar_per_100g': nutrients['sugar'] if nutrients['sugar'] > 0 else None,
            'sodium_per_100g': nutrients['sodium'] if nutrients['sodium'] > 0 else None,
            'usda_fdc_id': fdc_id
        }
        
        logger.info(
            f"✅ Prepared ingredient data: {food_name} | "
            f"Category: {category} | "
            f"Calories: {nutrients['calories']:.1f}"
        )
    
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