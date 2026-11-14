import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.abspath('screenshots')
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def run_tests():
    print("Starting Playwright Mobile UI Navigation & Verification...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 393, 'height': 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        # 1. Login Screen
        print("Navigating to http://localhost:8081...")
        page.goto('http://localhost:8081', wait_until='domcontentloaded')
        time.sleep(2)

        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '00_login_screen.png'))
        print("Captured 00_login_screen.png")

        # Click Quick Demo Mode Access
        demo_btn = page.locator('text=Quick Demo Mode Access').first
        if demo_btn.is_visible():
            print("Clicking Quick Demo Mode Access...")
            demo_btn.click()
            time.sleep(3)

        print(f"Current URL: {page.url}")

        # 2. Home Screen
        page.wait_for_selector('text=Daily Health Overview', timeout=15000)
        print("Verified Home Screen loaded with 'Daily Health Overview' Bento card!")
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '01_home_screen.png'))
        print("Captured 01_home_screen.png")

        # 3. Measure Tab
        print("Clicking Measure tab...")
        # Bottom tab bar has label 'Measure'
        measure_tab = page.locator('div[role="tab"]:has-text("Measure"), div:has-text("Measure")').last
        measure_tab.click(force=True)
        page.wait_for_selector('text=Body Tracker', timeout=15000)
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '02_measure_screen.png'))
        print("Captured 02_measure_screen.png")

        # 4. Workout Tab
        print("Clicking Workout tab...")
        workout_tab = page.locator('div[role="tab"]:has-text("Workout"), div:has-text("Workout")').last
        workout_tab.click(force=True)
        page.wait_for_selector('text=Training & Workouts', timeout=15000)
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '03_workout_screen.png'))
        print("Captured 03_workout_screen.png")

        # 5. Profile Tab
        print("Clicking Profile tab...")
        profile_tab = page.locator('div[role="tab"]:has-text("Profile"), div:has-text("Profile")').last
        profile_tab.click(force=True)
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '04_profile_screen.png'))
        print("Captured 04_profile_screen.png")

        # 6. Center Floating Add (+) Button / Food Search
        print("Clicking Center (+) Add Button...")
        add_tab = page.locator('div[role="tab"]:has-text("Add"), div:has-text("Add")').last
        add_tab.click(force=True)
        page.wait_for_selector('text=All Foods', timeout=15000)
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '06_food_search_screen.png'))
        print("Captured 06_food_search_screen.png")

        # 7. Habits Screen
        print("Navigating to Habits screen...")
        page.goto('http://localhost:8081/habits', wait_until='domcontentloaded')
        page.wait_for_selector('text=Daily Habits Tracker', timeout=15000)
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, '05_habits_screen.png'))
        print("Captured 05_habits_screen.png")

        browser.close()

        print("\n=== Playwright Flow Verification Complete ===")
        if console_errors:
            print(f"Console errors detected ({len(console_errors)}):")
            for err in console_errors[:10]:
                print(f"  - {err}")
        else:
            print("Zero console errors! Complete app navigation verified successfully.")

if __name__ == '__main__':
    run_tests()
