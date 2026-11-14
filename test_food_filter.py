import asyncio
import os
import shutil
from playwright.async_api import async_playwright

SCREENSHOTS_DIR = "/Users/dhinagar/Documents/antigravity/Fitly/screenshots"
ARTIFACTS_DIR = "/Users/dhinagar/.gemini/antigravity/brain/fb2ac3ff-da58-452d-86bd-fd7e026ef7df/screenshots"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

async def test_food_filters():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 420, "height": 880})
        page = await context.new_page()

        # Step 1: Open app and set auth token
        await page.goto("http://localhost:8081")
        await page.wait_for_timeout(2000)

        # Inject auth token into localStorage
        await page.evaluate('''() => {
            localStorage.setItem('auth_token', 'dev-token-dev-user-uid-12345');
            localStorage.setItem('user', JSON.stringify({
                _id: 'dev-user-mongo-id',
                uid: 'dev-user-uid-12345',
                name: 'Test Athlete',
                email: 'test@healthfit.local'
            }));
        }''')

        # Step 2: Navigate directly to food-search
        await page.goto("http://localhost:8081/food-search")
        await page.wait_for_timeout(3000)

        print("Page URL:", page.url)

        # Step 3: Check "All Foods" default state
        body_text = await page.inner_text("body")
        print("Checking All Foods loaded...")
        assert "No foods found" not in body_text, "Error: All Foods showing 'No foods found'!"
        
        # Step 4: Click 'South Tiffin' filter pill
        print("Clicking 'South Tiffin'...")
        south_tiffin_btn = page.get_by_text("South Tiffin")
        await south_tiffin_btn.click()
        await page.wait_for_timeout(2000)

        body_text = await page.inner_text("body")
        print("South Tiffin text sample:", body_text[:300])
        assert "No foods found" not in body_text, "Failed: South Tiffin showed 'No foods found'!"
        print("Verified: South Tiffin displays foods correctly!")

        # Step 5: Click 'High Protein' filter pill
        print("Clicking 'High Protein'...")
        protein_btn = page.get_by_text("High Protein")
        await protein_btn.click()
        await page.wait_for_timeout(2000)

        body_text = await page.inner_text("body")
        assert "No foods found" not in body_text, "Failed: High Protein showed 'No foods found'!"
        print("Verified: High Protein displays foods correctly!")

        # Step 6: Click 'Veg' toggle while High Protein is selected
        print("Clicking Veg toggle...")
        veg_btn = page.get_by_text("Veg", exact=True)
        await veg_btn.click()
        await page.wait_for_timeout(2000)

        body_text = await page.inner_text("body")
        assert "No foods found" not in body_text, "Failed: High Protein + Veg showed 'No foods found'!"
        print("Verified: High Protein + Veg displays foods correctly!")

        # Step 7: Click 'Snacks & Chaat'
        print("Clicking 'Snacks & Chaat'...")
        # Uncheck Veg first or test with Veg
        await veg_btn.click()
        await page.wait_for_timeout(1000)

        snacks_btn = page.get_by_text("Snacks & Chaat")
        await snacks_btn.click()
        await page.wait_for_timeout(2000)

        body_text = await page.inner_text("body")
        assert "No foods found" not in body_text, "Failed: Snacks & Chaat showed 'No foods found'!"
        print("Verified: Snacks & Chaat displays foods correctly!")

        # Step 8: Take screenshot of the working filter screen
        shot_path_local = os.path.join(SCREENSHOTS_DIR, "17_food_search_category_filter_verified.png")
        shot_path_art = os.path.join(ARTIFACTS_DIR, "17_food_search_category_filter_verified.png")
        await page.screenshot(path=shot_path_local)
        shutil.copy(shot_path_local, shot_path_art)
        print("Saved screenshot:", shot_path_local)

        await browser.close()
        print("All food filter tests PASSED successfully!")

if __name__ == "__main__":
    asyncio.run(test_food_filters())
