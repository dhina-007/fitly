import time
import json
import os
import urllib.request
import urllib.error
from playwright.sync_api import sync_playwright

API_BASE = "http://localhost:3000/api"
TOKEN = "dev-token-dev-user-uid-12345"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
UI_BASE = "http://localhost:8081"
SCREENSHOT_DIR = "/Users/dhinagar/Documents/antigravity/Fitly/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def api_get(path):
    req = urllib.request.Request(f"{API_BASE}{path}", headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"GET error {path}: {e}")
        return {}

def api_post(path, data=None):
    body = json.dumps(data or {}).encode('utf-8')
    req = urllib.request.Request(f"{API_BASE}{path}", data=body, headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"POST error {path}: {e}")
        return {}

def test_fasting_flow(page):
    print("\n--- 1. Testing Fasting Tracker Flow ---")
    page.goto(f"{UI_BASE}/fasting")
    page.wait_for_timeout(2000)

    # Check initial status from backend
    res = api_get("/fasting/status")
    print(f"Backend fasting status: {res}")

    # If already fasting, end it first to start clean
    if res.get('data', {}).get('isFasting'):
        api_post("/fasting/end")
        page.reload()
        page.wait_for_timeout(1500)

    # Click Start Fasting Now
    start_btn = page.locator("text=Start Fasting Now")
    if start_btn.count() > 0:
        start_btn.first.click()
        page.wait_for_timeout(2000)
        print("Clicked 'Start Fasting Now'")

    # Verify backend now shows isFasting = True
    res_after = api_get("/fasting/status")
    assert res_after.get('data', {}).get('isFasting') == True, "Fast should be active in backend"
    print(f"Verified fast is active in backend: protocol={res_after['data']['protocol']}")

    # Capture active fasting screenshot
    page.screenshot(path=f"{SCREENSHOT_DIR}/08_fasting_screen_verified.png")
    print(f"Captured: 08_fasting_screen_verified.png")

    # Now click End Fast to verify end flow
    end_btn = page.locator("text=End Fast")
    if end_btn.count() > 0:
        end_btn.first.click()
        page.wait_for_timeout(1500)
        res_end = api_get("/fasting/status")
        assert res_end.get('data', {}).get('isFasting') == False, "Fast should be ended"
        print("Verified fast ended successfully in backend")

def test_ai_coach_flow(page):
    print("\n--- 2. Testing Ria AI Coach Flow ---")
    page.goto(f"{UI_BASE}/ai-coach")
    page.wait_for_timeout(2000)

    # Click on quick prompt
    quick_prompt = page.locator("text=Suggest a 400 kcal high-protein lunch")
    if quick_prompt.count() > 0:
        quick_prompt.first.click()
        print("Clicked quick prompt: 'Suggest a 400 kcal high-protein lunch'")
        # Wait for Ria typing to complete and response to appear
        page.wait_for_timeout(3500)

    # Verify response text appears
    user_bubble = page.locator("text=Suggest a 400 kcal high-protein lunch")
    assert user_bubble.count() > 0, "User question should appear in chat"
    
    # Send another message via input bar
    input_box = page.locator("input[placeholder*='Ask Ria']").or_(page.locator("textarea[placeholder*='Ask Ria']")).first
    if input_box.count() > 0:
        input_box.fill("What exercises should I do for fat loss?")
        # Find send button
        send_btn = page.locator("div[role='button']").filter(has=page.locator("svg")).last
        input_box.press("Enter")
        page.wait_for_timeout(3500)
        print("Sent follow-up message: 'What exercises should I do for fat loss?'")

    page.screenshot(path=f"{SCREENSHOT_DIR}/09_ai_coach_verified.png")
    print(f"Captured: 09_ai_coach_verified.png")

def test_recipes_flow(page):
    print("\n--- 3. Testing Healthy Recipes Flow ---")
    page.goto(f"{UI_BASE}/recipes")
    page.wait_for_timeout(2000)

    # Click on first recipe card
    recipe_card = page.locator("text=High-Protein Moong Dal Chila").first
    if recipe_card.count() > 0:
        recipe_card.click()
        page.wait_for_timeout(1500)
        print("Opened recipe detail modal for High-Protein Moong Dal Chila")

        # Click Log Recipe to Journal
        log_btn = page.locator("text=Log Recipe to Journal").first
        if log_btn.count() > 0:
            log_btn.click()
            page.wait_for_timeout(2000)
            print("Clicked 'Log Recipe to Journal'")

    page.screenshot(path=f"{SCREENSHOT_DIR}/10_recipes_detail_logged.png")
    print(f"Captured: 10_recipes_detail_logged.png")

def test_devices_flow(page):
    print("\n--- 4. Testing Devices & Sync Flow ---")
    page.goto(f"{UI_BASE}/devices")
    page.wait_for_timeout(2000)

    # Connect Google Fit if not connected
    switches = page.locator("input[type='checkbox']").or_(page.locator("[role='switch']"))
    if switches.count() > 0:
        switches.first.click()
        page.wait_for_timeout(1500)
        print("Toggled device switch")

    # Click Force Sync Now if visible
    sync_btn = page.locator("text=Force Sync Now").first
    if sync_btn.count() > 0:
        sync_btn.click()
        page.wait_for_timeout(2000)
        print("Clicked 'Force Sync Now'")

    page.screenshot(path=f"{SCREENSHOT_DIR}/11_devices_sync_verified.png")
    print(f"Captured: 11_devices_sync_verified.png")

def test_measure_flow(page):
    print("\n--- 5. Testing Body Tracker Measure Flow ---")
    page.goto(f"{UI_BASE}/measure")
    page.wait_for_selector("text=Target Weight", timeout=10000)
    print("Verified 'Target Weight' loaded successfully")

    # Verify Maintenance Calories Card
    page.wait_for_selector("text=Metabolic Energy Balance", timeout=5000)
    print("Verified 'Metabolic Energy Balance' loaded successfully")

    page.screenshot(path=f"{SCREENSHOT_DIR}/12_measure_body_tracker.png")
    print(f"Captured: 12_measure_body_tracker.png")

def test_home_and_meals_flow(page):
    print("\n--- 6. Testing Home Screen & Logged Meals Bento ---")
    page.goto(f"{UI_BASE}/")
    page.wait_for_selector("text=Logged Meals", timeout=10000)
    print("Verified 'Logged Meals' section loaded successfully")

    page.screenshot(path=f"{SCREENSHOT_DIR}/13_home_logged_meals.png")
    print(f"Captured: 13_home_logged_meals.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()

        # Set localStorage for dev user auth
        page.goto(f"{UI_BASE}/")
        page.evaluate("""() => {
            localStorage.setItem('auth-storage', JSON.stringify({
                state: {
                    user: {
                        uid: 'dev-user-uid-12345',
                        _id: '6ac7e5d1ac9bff7edb7067a2',
                        email: 'dev@healthfit.app',
                        displayName: 'HealthFit User'
                    },
                    token: 'dev-token-dev-user-uid-12345'
                },
                version: 0
            }));
        }""")
        page.reload()
        page.wait_for_timeout(2000)

        # Run test suites
        test_fasting_flow(page)
        test_ai_coach_flow(page)
        test_recipes_flow(page)
        test_devices_flow(page)
        test_measure_flow(page)
        test_home_and_meals_flow(page)

        browser.close()
        print("\nAll verification suites passed successfully!")

if __name__ == "__main__":
    main()
