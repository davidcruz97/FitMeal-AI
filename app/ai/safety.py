# app/ai/safety.py
"""
Safety Disclaimers and Medical Warnings for AI Nutrition Advice
"""
import logging

logger = logging.getLogger(__name__)


class NutritionSafety:
    """Handles safety disclaimers and medical warnings"""
    
    # General AI disclaimer
    GENERAL_DISCLAIMER = """

    ⚠️ Important Disclaimer: This advice is AI-generated and for informational purposes only. It does NOT replace professional medical or nutritional guidance.
    """
    
    # Medical condition-specific warnings
    MEDICAL_WARNINGS = {
        'diabetes': (
            "⚠️ DIABETES: Monitor blood sugar levels closely. Carbohydrate recommendations "
            "should be reviewed with your doctor or diabetes educator. Adjust insulin/medications as needed."
        ),
        'type_1_diabetes': (
            "⚠️ TYPE 1 DIABETES: Consult your endocrinologist before changing carb intake. "
            "Insulin dosing must be adjusted accordingly. Monitor blood sugar frequently."
        ),
        'type_2_diabetes': (
            "⚠️ TYPE 2 DIABETES: Work with your healthcare provider to adjust medications "
            "if changing diet significantly. Monitor blood glucose regularly."
        ),
        'hypertension': (
            "⚠️ HIGH BLOOD PRESSURE: Watch sodium intake (aim for <2300mg/day). "
            "Consult doctor before making major dietary changes that could affect blood pressure medications."
        ),
        'kidney_disease': (
            "⚠️ KIDNEY DISEASE: Protein, potassium, phosphorus, and sodium restrictions may apply. "
            "MUST work with a renal dietitian. These recommendations may not be appropriate."
        ),
        'chronic_kidney_disease': (
            "⚠️ CHRONIC KIDNEY DISEASE: Requires specialized medical nutrition therapy. "
            "Consult nephrologist and renal dietitian before following any dietary advice."
        ),
        'heart_disease': (
            "⚠️ HEART DISEASE: Limit saturated fat, trans fat, and sodium. "
            "Consult cardiologist before making dietary changes that could affect medications."
        ),
        'celiac_disease': (
            "⚠️ CELIAC DISEASE: Strictly avoid all gluten-containing grains (wheat, barley, rye). "
            "Cross-contamination can cause symptoms. Verify all ingredients are certified gluten-free."
        ),
        'food_allergies': (
            "⚠️ FOOD ALLERGIES: Double-check all ingredients for potential allergens. "
            "Cross-contamination in food preparation can be dangerous. Always read labels carefully."
        ),
        'thyroid_disorders': (
            "⚠️ THYROID DISORDER: Some foods may affect thyroid medication absorption. "
            "Take thyroid medication on empty stomach. Consult endocrinologist about dietary changes."
        ),
        'pregnancy': (
            "⚠️ PREGNANCY: Nutritional needs are different during pregnancy. "
            "Consult your OB-GYN or prenatal nutritionist for personalized guidance."
        ),
        'eating_disorder': (
            "⚠️ EATING DISORDER HISTORY: Work with a specialized therapist and dietitian. "
            "Calorie counting or restrictive eating may not be appropriate."
        ),
        'gout': (
            "⚠️ GOUT: Limit high-purine foods (organ meats, certain seafood, alcohol). "
            "Consult doctor about dietary management alongside medications."
        ),
        'ibs': (
            "⚠️ IBS: Consider low-FODMAP approach under dietitian guidance. "
            "Food triggers vary by individual. Track symptoms carefully."
        ),
        'crohns_disease': (
            "⚠️ CROHN'S DISEASE: Requires individualized nutrition plan. "
            "Work with gastroenterologist and specialized dietitian."
        ),
        'ulcerative_colitis': (
            "⚠️ ULCERATIVE COLITIS: Dietary needs vary by disease activity. "
            "Consult gastroenterologist and IBD dietitian."
        )
    }
    
    @staticmethod
    def get_disclaimer(include_general=True):
        """
        Get general AI disclaimer
        
        Args:
            include_general: Include the standard disclaimer
        
        Returns:
            str: Disclaimer text
        """
        if include_general:
            return NutritionSafety.GENERAL_DISCLAIMER
        return ""
    
    @staticmethod
    def get_medical_warnings(medical_conditions):
        """
        Get warnings for specific medical conditions
        
        Args:
            medical_conditions: List of medical condition strings
        
        Returns:
            str: Combined warning text for all conditions
        """
        if not medical_conditions:
            return ""
        
        warnings = []
        
        for condition in medical_conditions:
            # Normalize condition name
            condition_key = condition.lower().replace(' ', '_')
            
            if condition_key in NutritionSafety.MEDICAL_WARNINGS:
                warnings.append(NutritionSafety.MEDICAL_WARNINGS[condition_key])
                logger.debug(f"⚠️ Added medical warning for: {condition}")
        
        if warnings:
            return "\n\n" + "\n\n".join(warnings)
        
        return ""
    
    @staticmethod
    def build_prompt_safety_instructions(allergen_names, medical_conditions):
        """
        Build safety instructions to include in LLM prompts
        
        Args:
            allergen_names: List of allergen names to avoid
            medical_conditions: List of medical conditions
        
        Returns:
            str: Safety instructions for the prompt
        """
        instructions = []
        
        # Critical allergy instructions for the LLM
        if allergen_names:
            allergen_list = ", ".join(allergen_names).upper()
            instructions.append(
                f"🚨 CRITICAL - FOOD ALLERGIES: NEVER recommend or include {allergen_list} "
                f"in ANY meal suggestions. Check all ingredients carefully."
            )
        
        # Medical condition considerations for the LLM
        if medical_conditions:
            conditions_text = ", ".join([c.replace('_', ' ').title() for c in medical_conditions])
            instructions.append(
                f"⚠️ MEDICAL CONDITIONS: Consider {conditions_text} when making recommendations. "
                f"Prioritize safety and encourage medical consultation."
            )
        
        if instructions:
            return "\n\n" + "\n\n".join(instructions) + "\n"
        
        return ""


# Singleton instance
_nutrition_safety = None

def get_nutrition_safety():
    """Get or create nutrition safety instance"""
    global _nutrition_safety
    if _nutrition_safety is None:
        _nutrition_safety = NutritionSafety()
    return _nutrition_safety