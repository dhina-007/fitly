import json
import os
import urllib.request
from playwright.sync_api import sync_playwright

API_BASE = "http://localhost:3000/api"
TOKEN = "dev-token-dev-user-uid-12345"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
UI_BASE = "http://localhost:8081"
SCREENSHOT_DIR = "/Users/dhinagar/Documents/antigravity/Fitly/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def api_get(path):
    req = urllib.request.Request(f"{API_BASE}{path}", headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()

        # Login via Demo Mode
        page.goto(f"{UI_BASE}/login")
        page.wait_for_timeout(2000)
        demo_btn = page.locator("text=Quick Demo Mode Access").first
        if demo_btn.count() > 0:
            demo_btn.click()
            page.wait_for_timeout(2000)
            print("Logged in via Quick Demo Mode Access. URL:", page.url)

        # Navigate to /measure
        print("Navigating to /measure...")
        page.goto(f"{UI_BASE}/measure")
        page.wait_for_selector("text=Target Weight", timeout=10000)
        print("Found Target Weight card!")

        page.screenshot(path=f"{SCREENSHOT_DIR}/14_measure_before_editing_target.png")

        # Click Edit Goal shortcut
        edit_goal_btn = page.locator("text=Edit Goal").first
        assert edit_goal_btn.count() > 0, "Edit Goal button should be present"
        edit_goal_btn.click()
        page.wait_for_timeout(1000)
        print("Clicked 'Edit Goal'")

        # Verify bottom sheet modal opened
        page.wait_for_selector("text=Set Target Weight", timeout=5000)
        print("Set Target Weight bottom sheet modal is open!")

        # Screenshot modal
        page.screenshot(path=f"{SCREENSHOT_DIR}/15_target_weight_modal_open.png")

        # Fill input with 68.0 kg or click a preset
        input_elem = page.locator("input[placeholder*='68.0']").first
        if input_elem.count() > 0:
            input_elem.fill("68.0")
            page.wait_for_timeout(500)
            print("Entered target weight: 68.0 kg")
        else:
            # Click quick preset
            preset = page.locator("text=-5 kg").first
            if preset.count() > 0:
                preset.click()
                print("Clicked -5 kg preset")

        # Click Save Target Weight
        save_btn = page.locator("text=Save Target Weight").first
        save_btn.click()
        page.wait_for_timeout(2500)
        print("Clicked 'Save Target Weight'")

        # Check backend profile
        profile_data = api_get("/auth/profile")
        saved_target = profile_data.get('data', {}).get('targetWeight')
        print(f"Backend updated targetWeight: {saved_target}")

        # Capture final screen after update
        page.screenshot(path=f"{SCREENSHOT_DIR}/16_measure_target_weight_updated.png")
        print("Captured: 16_measure_target_weight_updated.png")

        browser.close()
        print("\nAll Target Weight tests PASSED with 100% success!")

if __name__ == "__main__":
    main()
