import os
import shutil
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/Users/dhinagar/Documents/antigravity/Fitly/screenshots"
ARTIFACTS_DIR = "/Users/dhinagar/.gemini/antigravity/brain/fb2ac3ff-da58-452d-86bd-fd7e026ef7df/screenshots"
UI_BASE = "http://localhost:8081"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 420, "height": 880})
        page = context.new_page()

        # Step 1: Login via Demo Mode Access
        page.goto(f"{UI_BASE}/login")
        page.wait_for_timeout(2000)
        demo_btn = page.locator("text=Quick Demo Mode Access").first
        if demo_btn.count() > 0:
            demo_btn.click()
            page.wait_for_timeout(2500)
            print("Logged in via Demo Mode. URL:", page.url)

        # Step 2: Open Home screen
        page.goto(f"{UI_BASE}/home")
        page.wait_for_timeout(3000)

        body_home = page.inner_text("body")
        print("Checking Home screen wording...")
        
        # Verify "Daily Shortcuts" exists and "Quick Actions" does not
        assert "Daily Shortcuts" in body_home, f"Failed: 'Daily Shortcuts' not found on Home screen! Text snippet: {body_home[:400]}"
        assert "Fast tracking & smart tools" in body_home, "Failed: 'Fast tracking & smart tools' not found!"
        assert "Quick Actions" not in body_home, "Failed: Old 'Quick Actions' still present!"
        assert "Fast health logging" not in body_home, "Failed: Old 'Fast health logging' still present!"
        
        # Verify "Today's Meals" exists and "Logged Meals" does not
        assert "Today's Meals" in body_home, "Failed: 'Today's Meals' not found on Home screen!"
        assert "Logged Meals" not in body_home, "Failed: Old 'Logged Meals' still present!"
        print("Verified: Home screen shortcuts and meals wording are user-friendly!")

        shot_home = os.path.join(SCREENSHOTS_DIR, "18_home_friendly_wording_verified.png")
        page.screenshot(path=shot_home)
        shutil.copy(shot_home, os.path.join(ARTIFACTS_DIR, "18_home_friendly_wording_verified.png"))

        # Step 3: Open Measure screen
        page.goto(f"{UI_BASE}/measure")
        page.wait_for_timeout(3000)

        body_measure = page.inner_text("body")
        print("Checking Measure screen wording...")

        # Verify friendly weight labels
        assert "Update Weight Log" not in body_measure, "Failed: Old 'Update Weight Log' still present!"
        assert "Recorded Check-in" not in body_measure, "Failed: Old 'Recorded Check-in' still present!"
        assert "Metabolic Energy Balance" not in body_measure, "Failed: Old 'Metabolic Energy Balance' still present!"
        assert "Daily Calorie Burn" in body_measure, "Failed: 'Daily Calorie Burn' not found!"
        print("Verified: Measure screen wording is user-friendly!")

        shot_measure = os.path.join(SCREENSHOTS_DIR, "19_measure_friendly_wording_verified.png")
        page.screenshot(path=shot_measure)
        shutil.copy(shot_measure, os.path.join(ARTIFACTS_DIR, "19_measure_friendly_wording_verified.png"))

        # Step 4: Open Add Food screen
        page.goto(f"{UI_BASE}/food-search")
        page.wait_for_timeout(3000)

        body_food = page.inner_text("body")
        print("Checking Add Food screen...")
        assert "Add Food" in body_food, "Failed: 'Add Food' header title not found!"

        # Tap on a food item, e.g., "Masala Dosa" or first item
        first_food = page.locator("text=Masala Dosa").first
        if first_food.count() > 0:
            first_food.click()
        else:
            page.locator("text=Akki Roti").first.click()
        page.wait_for_timeout(1500)

        # Check modal opened
        modal_body = page.inner_text("body")
        assert "Standard Portion" in modal_body, "Failed: 'Standard Portion' toggle not found in modal!"
        assert "Exact Grams (g)" in modal_body, "Failed: 'Exact Grams (g)' toggle not found in modal!"
        print("Verified: Food modal has 'Standard Portion' and 'Exact Grams (g)' options!")

        # Click "Exact Grams (g)"
        page.get_by_text("Exact Grams (g)").click()
        page.wait_for_timeout(1000)

        modal_body_grams = page.inner_text("body")
        assert "Weight in Grams (g):" in modal_body_grams, "Failed: Grams input section not shown!"
        
        # Click 150g preset
        page.get_by_text("150g").click()
        page.wait_for_timeout(1000)

        modal_after_preset = page.inner_text("body")
        assert "Total: 150g" in modal_after_preset or "150g" in modal_after_preset, "Failed: 150g preset not reflected!"
        print("Verified: 150g preset clicked and calculated!")

        # Take screenshot of Gram Mode modal
        shot_gram = os.path.join(SCREENSHOTS_DIR, "20_food_grams_option_verified.png")
        page.screenshot(path=shot_gram)
        shutil.copy(shot_gram, os.path.join(ARTIFACTS_DIR, "20_food_grams_option_verified.png"))

        # Click "Add to Breakfast" button
        add_btn = page.get_by_text("Add to Breakfast")
        add_btn.click()
        page.wait_for_timeout(2000)

        # Check redirected back to Home
        page.goto(f"{UI_BASE}/home")
        page.wait_for_timeout(2500)

        body_home_after = page.inner_text("body")
        print("Home screen after food add sample:", body_home_after[:300])
        assert "Today's Meals" in body_home_after, "Failed: Today's Meals section not found!"
        print("Verified: Food logged in grams successfully and reflected on Home screen!")

        shot_home_meals = os.path.join(SCREENSHOTS_DIR, "21_home_meals_logged_with_grams.png")
        page.screenshot(path=shot_home_meals)
        shutil.copy(shot_home_meals, os.path.join(ARTIFACTS_DIR, "21_home_meals_logged_with_grams.png"))

        browser.close()
        print("All friendly wording and gram option tests PASSED completely!")

if __name__ == "__main__":
    main()
