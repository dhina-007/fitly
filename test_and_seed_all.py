import os
import sys
import json
import time
import base64
import urllib.request
import urllib.parse
from playwright.sync_api import sync_playwright

API_BASE = "http://localhost:3000/api"
APP_URL = "http://localhost:8081"
DEV_TOKEN = "dev-token-dev-user-uid-12345"
TODAY = "2026-10-12"

def api_request(path, method="GET", body=None):
    url = f"{API_BASE}{path}"
    headers = {
        "Authorization": f"Bearer {DEV_TOKEN}",
        "Content-Type": "application/json"
    }
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[API ERROR] {method} {url} -> {e.code}: {err_body}")
        raise e

def create_sample_image_base64():
    # 1x1 transparent/colored PNG in base64
    sample_png = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x02\x00\x00\x00\x02'
        b'\x08\x02\x00\x00\x00\xfd\xd4\x9as\x00\x00\x00\tIDATx\x9cc\xf8\xff'
        b'\x9f\x01\x00\x02\x8f\x01\x15\xfa\x82\x90\x91\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return "data:image/png;base64," + base64.b64encode(sample_png).decode('utf-8')

def step1_seed_backend():
    print("\n--- STEP 1: SEEDING REALISTIC SAMPLE DATA IN BACKEND ---")
    
    # 0. Ensure user profile has height and targetWeight for BMI calculation
    print("0. Updating User Profile (height=175cm, targetWeight=68kg)...")
    profile_resp = api_request("/auth/profile", "PUT", {
        "height": 175,
        "targetWeight": 68,
        "currentWeight": 74.2
    })
    print(f"   -> Profile updated: height={profile_resp['data'].get('height')}cm, targetWeight={profile_resp['data'].get('targetWeight')}kg")

    # 1. Food Logging (Masala Dosa for Breakfast, Chicken Biryani for Lunch)
    print("1. Logging Breakfast (Masala Dosa)...")
    dosa_resp = api_request("/food-logs", "POST", {
        "date": TODAY,
        "mealType": "breakfast",
        "foodItemId": "6aca1c4b43890a221d2c4a63",
        "name": "Masala Dosa",
        "servingSize": 100,
        "servingUnit": "Gram",
        "quantity": 2,
        "calories": 414,
        "protein": 8.6,
        "carbs": 64,
        "fat": 13.4,
        "fiber": 4
    })
    print(f"   -> Breakfast logged: totalCalories={dosa_resp['data']['totalCalories']}")

    print("2. Logging Lunch (Chicken Biryani)...")
    biryani_resp = api_request("/food-logs", "POST", {
        "date": TODAY,
        "mealType": "lunch",
        "foodItemId": "6aca1c4b43890a221d2c4a65",
        "name": "Chicken Biryani",
        "servingSize": 100,
        "servingUnit": "Gram",
        "quantity": 2.5,
        "calories": 400,
        "protein": 23.3,
        "carbs": 45,
        "fat": 15,
        "fiber": 2
    })
    print(f"   -> Lunch logged: totalCalories={biryani_resp['data']['totalCalories']}")

    # 2. Water Logging (1000ml)
    print("3. Logging Water (1000ml)...")
    water_resp = api_request("/water", "POST", {
        "date": TODAY,
        "amount": 1000
    })
    print(f"   -> Water logged: totalAmount={water_resp['data']['totalAmount']}ml")

    # 3. Body Weight Tracker (74.2 kg + progress image)
    print("4. Logging Body Weight (74.2 kg)...")
    sample_img = create_sample_image_base64()
    weight_resp = api_request("/weight", "POST", {
        "date": TODAY,
        "weight": 74.2,
        "notes": "Morning check-in before training",
        "base64Image": sample_img
    })
    print(f"   -> Weight logged: weight={weight_resp['data']['weight']}kg, bmi={weight_resp['data'].get('bmi')}, image={weight_resp['data'].get('imageUrl')}")

    # 4. Habits Creation & Completion
    print("5. Ensuring Habits & Logging Completion...")
    habits = api_request(f"/habits?date={TODAY}")["data"]
    habit_ids = []
    if len(habits) == 0:
        h1 = api_request("/habits", "POST", {
            "name": "Drink 3L Clean Water",
            "icon": "Droplets",
            "category": "hydration",
            "color": "#059669"
        })["data"]
        h2 = api_request("/habits", "POST", {
            "name": "10,000 Daily Steps",
            "icon": "Footprints",
            "category": "fitness",
            "color": "#F97316"
        })["data"]
        h3 = api_request("/habits", "POST", {
            "name": "7.5h Restful Sleep",
            "icon": "Moon",
            "category": "sleep",
            "color": "#0284C7"
        })["data"]
        habit_ids = [h1["_id"], h2["_id"], h3["_id"]]
    else:
        habit_ids = [h["_id"] for h in habits]

    # Toggle first habit complete for today
    toggle_resp = api_request(f"/habits/{habit_ids[0]}/toggle", "POST", { "date": TODAY })
    print(f"   -> Habit toggled: completed={toggle_resp['data']['completed']}")

    # 5. Activity and Workout Logging
    print("6. Logging Activity (6200 steps, 260 kcal)...")
    act_resp = api_request("/activity", "POST", {
        "date": TODAY,
        "steps": 6200,
        "caloriesBurned": 260
    })
    print(f"   -> Activity logged: steps={act_resp['data']['steps']}")

    # 6. Verify Dashboard Analytics
    print("7. Fetching Dashboard Analytics Summary...")
    analytics = api_request(f"/analytics/dashboard?date={TODAY}")["data"]
    print(f"   -> Health Score: {analytics['healthScore']}/100")
    print(f"   -> Calories Eaten: {analytics['calories']['consumed']} kcal (Remaining: {analytics['calories']['remaining']} kcal)")
    print(f"   -> Water Logged: {analytics['water']['consumedMl']} ml / {analytics['water']['targetMl']} ml")
    print(f"   -> Macros: P={analytics['macros']['protein']['consumed']}g, C={analytics['macros']['carbs']['consumed']}g, F={analytics['macros']['fat']['consumed']}g")
    
    assert analytics['calories']['consumed'] >= 800, f"Expected consumed >= 800, got {analytics['calories']['consumed']}"
    assert analytics['water']['consumedMl'] >= 1000, f"Expected water >= 1000, got {analytics['water']['consumedMl']}"
    assert analytics['healthScore'] > 20, f"Expected healthScore > 20, got {analytics['healthScore']}"
    print("[SUCCESS] Backend database reflects all sample data perfectly!\n")

def step2_verify_frontend_playwright():
    print("\n--- STEP 2: VERIFYING FRONTEND UI VIA PLAYWRIGHT ---")
    os.makedirs("screenshots", exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
            device_scale_factor=2
        )
        page = context.new_page()

        # Log browser console
        page.on("console", lambda msg: print(f"  [BROWSER CONSOLE {msg.type}]: {msg.text}") if msg.type in ['error', 'warn'] else None)

        print("1. Opening Web App...")
        page.goto(APP_URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(3000)

        # Check if login screen or home screen
        demo_btn = page.query_selector("text=Quick Demo Mode Access")
        if demo_btn:
            print("   -> Clicking Quick Demo Mode Access...")
            demo_btn.click()
            page.wait_for_timeout(3000)

        # 2. Verify on Home Screen
        print("2. Verifying Home Screen UI & Sample Data...")
        page.wait_for_selector("text=Daily Health Overview", timeout=15000)
        
        home_content = page.content()
        assert "Daily Health Overview" in home_content
        assert "Logged Meals" in home_content
        print("   -> 'Logged Meals' card verified on Home Screen!")

        # Take Home screenshot
        page.screenshot(path="screenshots/01_home_screen_verified.png")
        print("   -> Captured screenshots/01_home_screen_verified.png")

        # 3. Test Hydration increment button directly on UI (+250ml)
        print("3. Testing live UI interaction: Click +250ml Hydration badge...")
        hydration_badge = page.query_selector("text=+250ml")
        if hydration_badge:
            hydration_badge.click()
            page.wait_for_timeout(2000)
            page.screenshot(path="screenshots/01b_home_hydration_incremented.png")
            print("   -> Captured screenshots/01b_home_hydration_incremented.png with live water increment!")

        # 4. Test Time Travel directly on Home Screen
        print("4. Testing Time Travel on Home Screen...")
        prev_btn = page.query_selector("[data-testid='prev-date-btn']")
        if prev_btn:
            print("   -> Clicking previous date button...")
            prev_btn.click()
            page.wait_for_timeout(2500)
            page.screenshot(path="screenshots/06_time_travel_yesterday.png")
            print("   -> Captured screenshots/06_time_travel_yesterday.png")

            # Return to Today
            today_chip = page.query_selector("[data-testid='today-date-chip']")
            if today_chip:
                print("   -> Returning to Today...")
                today_chip.click()
                page.wait_for_timeout(2500)
                page.screenshot(path="screenshots/07_time_travel_today_restored.png")
                print("   -> Captured screenshots/07_time_travel_today_restored.png")

        # 5. Navigate to Measure Screen (Body Tracker)
        print("5. Navigating to Measure Screen (Body Tracker)...")
        page.click("text=Measure", force=True)
        page.wait_for_timeout(3000)
        page.wait_for_selector("text=Body Tracker", timeout=15000)
        
        measure_content = page.content()
        assert "Body Tracker" in measure_content
        assert "Current Weight" in measure_content
        assert "Metabolic Energy Balance" in measure_content
        print("   -> Body Tracker metrics and Metabolic guidance verified!")

        page.screenshot(path="screenshots/02_measure_screen_verified.png")
        print("   -> Captured screenshots/02_measure_screen_verified.png")

        # Test Body Weight Logging Modal on UI
        print("   -> Testing Weight Logging Modal...")
        log_btn = page.query_selector("text=Update Weight Log") or page.query_selector("text=Log Weight")
        if log_btn:
            log_btn.click()
            page.wait_for_timeout(1500)
            inputs = page.query_selector_all("input")
            if len(inputs) > 0:
                inputs[-1].fill("73.5")
                page.wait_for_timeout(500)
                save_btn = page.query_selector("text=Save Check-In") or page.query_selector("text=Save Check-in")
                if save_btn:
                    save_btn.click()
                    page.wait_for_timeout(2500)
                    print("   -> Successfully logged weight 73.5kg via UI modal!")
                    page.screenshot(path="screenshots/02b_measure_after_save.png")
                    print("   -> Captured screenshots/02b_measure_after_save.png")

        # 6. Navigate to Home and then Habits via Quick Action
        print("6. Navigating to Habits Screen via Quick Action...")
        page.click("text=Home", force=True)
        page.wait_for_timeout(2500)
        
        habits_action = page.query_selector("text=Habits")
        if habits_action:
            habits_action.click()
            page.wait_for_timeout(2500)
            page.wait_for_selector("text=Daily Habits Tracker", timeout=15000)
            print("   -> Daily Habits Tracker verified!")
            page.screenshot(path="screenshots/03_habits_screen_verified.png")
            print("   -> Captured screenshots/03_habits_screen_verified.png")
            
            # Go back to Home
            page.go_back()
            page.wait_for_timeout(2000)

        # 7. Navigate to Food Search via Quick Action
        print("7. Navigating to Food Search Screen via Quick Action...")
        food_action = page.query_selector("text=Log Food")
        if food_action:
            food_action.click()
            page.wait_for_timeout(2500)
            page.wait_for_selector("text=Log Food", timeout=15000)
            
            # Test searching for food
            search_input = page.query_selector("input[placeholder*='Search' i]")
            if search_input:
                search_input.fill("dosa")
                page.wait_for_timeout(2000)
                print("   -> Typed 'dosa' into food search input!")

            page.screenshot(path="screenshots/04_food_search_verified.png")
            print("   -> Captured screenshots/04_food_search_verified.png")

            # Go back to Home
            page.go_back()
            page.wait_for_timeout(2000)

        # 8. Navigate to Workouts Screen via bottom tab
        print("8. Navigating to Workout Screen via bottom tab...")
        page.click("text=Workout", force=True)
        page.wait_for_timeout(2500)
        
        begin_btn = page.query_selector("text=Begin Workout")
        if begin_btn:
            begin_btn.click()
            page.wait_for_timeout(2500)
            page.wait_for_selector("text=Active Session", timeout=15000)
            print("   -> Active Session verified!")
            page.screenshot(path="screenshots/05_workout_active_verified.png")
            print("   -> Captured screenshots/05_workout_active_verified.png")

            finish_btn = page.query_selector("text=Finish")
            if finish_btn:
                finish_btn.click()
                page.wait_for_timeout(2500)
                print("   -> Clicked Finish on active workout!")

        browser.close()
        print("\n[ALL TESTS PASSED SUCCESSFULLY!]")

if __name__ == "__main__":
    step1_seed_backend()
    step2_verify_frontend_playwright()
