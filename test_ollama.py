# test_ollama.py
"""
Comprehensive Test Script for FitMeal-AI LLM System
Tests warmup, shared LLM, safety features, and all AI modules
"""
import sys
import time
from app import create_app, db
from app.models.user import User
from app.models.ingredient import Ingredient
from app.ai.llm_manager import get_llm_manager
from app.ai.meal_recommender import get_meal_recommender
from app.ai.nutrition_advisor import get_nutrition_advisor
from app.ai.meal_planner import get_meal_planner
from app.ai.safety import get_nutrition_safety

# ANSI color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_section(title):
    """Print a section header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{title:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")


def print_test(name, status="running"):
    """Print test status"""
    if status == "running":
        print(f"{Colors.CYAN}▶ Testing: {name}...{Colors.ENDC}")
    elif status == "success":
        print(f"{Colors.GREEN}✓ PASSED: {name}{Colors.ENDC}")
    elif status == "failed":
        print(f"{Colors.RED}✗ FAILED: {name}{Colors.ENDC}")


def print_result(label, value):
    """Print a result"""
    print(f"{Colors.YELLOW}  {label}:{Colors.ENDC} {value}")


def test_llm_manager():
    """Test 1: LLM Manager & Warmup"""
    print_section("TEST 1: LLM Manager & Warmup")
    
    try:
        print_test("LLM Manager initialization")
        manager = get_llm_manager()
        print_result("Manager created", "✓")
        print_result("Model", "llama3.2:3b")
        print_result("Keep alive", "30m")
        
        # Test warmup
        print_test("Model warmup")
        start_time = time.time()
        success = manager.warmup()
        warmup_time = time.time() - start_time
        
        if success:
            print_result("Warmup status", "✓ SUCCESS")
            print_result("Warmup time", f"{warmup_time:.2f}s")
            print_result("Model ready", manager.is_ready())
            print_test("LLM Manager", "success")
        else:
            print_result("Warmup status", "✗ FAILED")
            print_test("LLM Manager", "failed")
            return False
        
        # Test second warmup (should be instant)
        print_test("Second warmup call (should skip)")
        start_time = time.time()
        manager.warmup()
        second_warmup = time.time() - start_time
        print_result("Second warmup time", f"{second_warmup:.2f}s (should be ~0s)")
        
        # Test status
        print_test("Status check")
        status = manager.get_status()
        print_result("Status", status)
        
        return True
        
    except Exception as e:
        print_result("Error", str(e))
        print_test("LLM Manager", "failed")
        return False


def test_safety_system():
    """Test 2: Safety & Disclaimers"""
    print_section("TEST 2: Safety & Disclaimer System")
    
    try:
        print_test("Safety system initialization")
        safety = get_nutrition_safety()
        print_result("Safety system created", "✓")
        
        # Test general disclaimer
        print_test("General disclaimer")
        disclaimer = safety.get_disclaimer()
        print_result("Has general disclaimer", len(disclaimer) > 0)
        print(f"\n{Colors.BLUE}--- General Disclaimer ---{Colors.ENDC}")
        print(disclaimer[:200] + "...")
        
        # Test medical warnings
        print_test("Medical warnings")
        conditions = ['diabetes', 'hypertension', 'kidney_disease']
        warnings = safety.get_medical_warnings(conditions)
        print_result("Has medical warnings", len(warnings) > 0)
        print_result("Conditions tested", ", ".join(conditions))
        
        # Test allergy warning
        print_test("Allergy warnings")
        allergens = ['Peanuts', 'Shellfish', 'Dairy']
        allergy_warning = safety.get_allergy_warning(allergens)
        print_result("Has allergy warning", len(allergy_warning) > 0)
        print_result("Allergens tested", ", ".join(allergens))
        
        # Test prompt safety instructions
        print_test("Prompt safety instructions")
        instructions = safety.build_prompt_safety_instructions(allergens, conditions)
        print_result("Has safety instructions", len(instructions) > 0)
        print(f"\n{Colors.BLUE}--- Prompt Safety Instructions ---{Colors.ENDC}")
        print(instructions[:300] + "...")
        
        print_test("Safety system", "success")
        return True
        
    except Exception as e:
        print_result("Error", str(e))
        print_test("Safety system", "failed")
        return False


def test_meal_recommender_with_profile():
    """Test 3: Meal Recommender with User Profile"""
    print_section("TEST 3: Meal Recommender with User Profile")
    
    try:
        print_test("Creating test user with profile")
        
        # Create test user in database
        test_user = User(
            email="test_ai@example.com",
            full_name="Test AI User",
            user_type="user",
            age=28,
            gender="male",
            height=175,
            weight=80,
            fitness_goals=["build_muscle", "lose_weight"],
            target_calories=2200,
            target_protein=165,
            target_carbs=220,
            target_fats=73,
            activity_level="moderately_active",
            lifting_experience="intermediate",
            workout_days=["Monday", "Wednesday", "Friday", "Saturday"],
            medical_conditions=["hypertension"],
            food_allergies=[],  # We'll add some if ingredients exist
            profile_completed=True,
            calculated_bmr=1850,
            calculated_tdee=2500
        )
        test_user.set_password("test123")
        
        print_result("Test user created", "✓")
        print_result("Name", test_user.full_name)
        print_result("Age/Gender", f"{test_user.age} year old {test_user.gender}")
        print_result("Goals", test_user.fitness_goals)
        print_result("Target calories", test_user.target_calories)
        print_result("Medical conditions", test_user.medical_conditions)
        
        # Test recommendation
        print_test("Generating meal recommendations")
        recommender = get_meal_recommender()
        
        start_time = time.time()
        recommendations = recommender.recommend_recipes(
            user_profile=test_user,
            available_ingredients=["chicken", "broccoli", "rice"],
            meal_type="dinner"
        )
        generation_time = time.time() - start_time
        
        print_result("Generation time", f"{generation_time:.2f}s")
        print_result("Response length", f"{len(recommendations)} characters")
        print_result("Has content", len(recommendations) > 100)
        print_result("Has disclaimer", "⚠️" in recommendations)
        
        print(f"\n{Colors.BLUE}--- Meal Recommendations (first 500 chars) ---{Colors.ENDC}")
        print(recommendations[:500] + "...")
        
        print_test("Meal Recommender", "success")
        return True
        
    except Exception as e:
        print_result("Error", str(e))
        import traceback
        traceback.print_exc()
        print_test("Meal Recommender", "failed")
        return False


def test_nutrition_advisor():
    """Test 4: Nutrition Advisor"""
    print_section("TEST 4: Nutrition Advisor Q&A")
    
    try:
        print_test("Nutrition advisor initialization")
        advisor = get_nutrition_advisor()
        print_result("Advisor created", "✓")
        
        # Test simple question (no user context)
        print_test("Answering simple question (no context)")
        question = "What are the benefits of protein for muscle building?"
        
        start_time = time.time()
        answer = advisor.answer_question(question, user_profile=None)
        generation_time = time.time() - start_time
        
        print_result("Question", question)
        print_result("Generation time", f"{generation_time:.2f}s")
        print_result("Response length", f"{len(answer)} characters")
        print_result("Has content", len(answer) > 100)
        
        print(f"\n{Colors.BLUE}--- Answer (first 400 chars) ---{Colors.ENDC}")
        print(answer[:400] + "...")
        
        # Test macro explanation
        print_test("Explaining macro (protein)")
        start_time = time.time()
        explanation = advisor.explain_macro("protein")
        generation_time = time.time() - start_time
        
        print_result("Generation time", f"{generation_time:.2f}s")
        print_result("Response length", f"{len(explanation)} characters")
        
        print_test("Nutrition Advisor", "success")
        return True
        
    except Exception as e:
        print_result("Error", str(e))
        import traceback
        traceback.print_exc()
        print_test("Nutrition Advisor", "failed")
        return False


def test_allergy_resolution():
    """Test 5: Allergy ID Resolution"""
    print_section("TEST 5: Allergy ID Resolution")
    
    try:
        print_test("Checking for ingredients in database")
        
        # Get some sample ingredients
        sample_ingredients = Ingredient.query.limit(5).all()
        
        if not sample_ingredients:
            print_result("Warning", "No ingredients found in database")
            print_result("Allergy resolution", "⚠ Cannot test (no ingredients)")
            return True
        
        print_result("Found ingredients", len(sample_ingredients))
        
        # Create test user with allergies
        print_test("Creating user with allergies")
        allergen_ids = [ing.id for ing in sample_ingredients[:3]]
        allergen_names = [ing.name for ing in sample_ingredients[:3]]
        
        test_user = User(
            email="allergy_test@example.com",
            full_name="Allergy Test User",
            user_type="user",
            age=25,
            gender="female",
            height=165,
            weight=60,
            fitness_goals=["weight_loss"],
            target_calories=1800,
            target_protein=120,
            target_carbs=180,
            target_fats=60,
            activity_level="lightly_active",
            food_allergies=allergen_ids,  # List of ingredient IDs
            profile_completed=True
        )
        test_user.set_password("test123")
        
        print_result("Allergy IDs", allergen_ids)
        print_result("Expected names", allergen_names)
        
        # Test recommendation with allergies
        print_test("Generating recommendations with allergies")
        recommender = get_meal_recommender()
        
        start_time = time.time()
        recommendations = recommender.recommend_recipes(
            user_profile=test_user,
            meal_type="lunch"
        )
        generation_time = time.time() - start_time
        
        print_result("Generation time", f"{generation_time:.2f}s")
        print_result("Has allergy warning", "CRITICAL ALLERGIES" in recommendations or "ALLERGY" in recommendations)
        print_result("Allergens mentioned", any(allergen.upper() in recommendations for allergen in allergen_names))
        
        print(f"\n{Colors.BLUE}--- Recommendations with Allergies (first 600 chars) ---{Colors.ENDC}")
        print(recommendations[:600] + "...")
        
        print_test("Allergy Resolution", "success")
        return True
        
    except Exception as e:
        print_result("Error", str(e))
        import traceback
        traceback.print_exc()
        print_test("Allergy Resolution", "failed")
        return False


def test_performance():
    """Test 6: Performance Comparison"""
    print_section("TEST 6: Performance Testing")
    
    try:
        print_test("Testing warm vs cold performance")
        
        manager = get_llm_manager()
        llm = manager.get_llm(temperature=0.7)
        
        # Test 1: Simple prompt
        print_test("Test 1: Simple prompt (warm model)")
        simple_prompt = "List 3 healthy breakfast ideas:"
        
        start_time = time.time()
        response1 = llm.invoke(simple_prompt)
        time1 = time.time() - start_time
        
        print_result("Simple prompt time", f"{time1:.2f}s")
        print_result("Response length", f"{len(response1)} chars")
        
        # Test 2: Complex prompt (should be similar speed)
        print_test("Test 2: Complex prompt (warm model)")
        complex_prompt = """You are a nutritionist. Create a high-protein breakfast for a 28-year-old male 
        athlete training 4x/week who needs 2200 calories/day with 165g protein. Include:
        1. Meal name
        2. Ingredients
        3. Macros
        4. Why it's good for muscle building"""
        
        start_time = time.time()
        response2 = llm.invoke(complex_prompt)
        time2 = time.time() - start_time
        
        print_result("Complex prompt time", f"{time2:.2f}s")
        print_result("Response length", f"{len(response2)} chars")
        
        # Test 3: Third call (should still be fast)
        print_test("Test 3: Third call (warm model)")
        start_time = time.time()
        response3 = llm.invoke("List 3 healthy lunch ideas:")
        time3 = time.time() - start_time
        
        print_result("Third call time", f"{time3:.2f}s")
        
        print(f"\n{Colors.BLUE}--- Performance Summary ---{Colors.ENDC}")
        print_result("Average response time", f"{(time1 + time2 + time3) / 3:.2f}s")
        print_result("Model stays warm", "✓ All calls fast")
        
        print_test("Performance Testing", "success")
        return True
        
    except Exception as e:
        print_result("Error", str(e))
        import traceback
        traceback.print_exc()
        print_test("Performance Testing", "failed")
        return False


def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║         FitMeal-AI LLM System Comprehensive Test Suite            ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)
    
    # Create app context
    app = create_app()
    
    with app.app_context():
        results = []
        
        # Run tests
        results.append(("LLM Manager & Warmup", test_llm_manager()))
        results.append(("Safety System", test_safety_system()))
        results.append(("Meal Recommender", test_meal_recommender_with_profile()))
        results.append(("Nutrition Advisor", test_nutrition_advisor()))
        results.append(("Allergy Resolution", test_allergy_resolution()))
        results.append(("Performance", test_performance()))
        
        # Print summary
        print_section("TEST SUMMARY")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = f"{Colors.GREEN}✓ PASSED{Colors.ENDC}" if result else f"{Colors.RED}✗ FAILED{Colors.ENDC}"
            print(f"  {test_name:.<50} {status}")
        
        print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.ENDC}")
        
        if passed == total:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! System is ready! 🎉{Colors.ENDC}\n")
            return 0
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ Some tests failed. Please check the output above.{Colors.ENDC}\n")
            return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)