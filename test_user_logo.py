from playwright.sync_api import sync_playwright

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        console_errors = []
        page.on("pageerror", lambda err: console_errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: console_errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("1. Loading app...")
        page.goto("http://localhost:8081", wait_until="commit")

        page.wait_for_timeout(600)
        page.screenshot(path="verified_text_splash_user_icon.png")
        print("-> Saved verified_text_splash_user_icon.png")

        # Wait for splash transition into Login screen (total ~1.8s)
        page.wait_for_timeout(1400)
        print("2. Verifying Redesigned Login Screen with User's Logo Icon...")
        page.screenshot(path="verified_login_with_user_logo.png")
        print("-> Saved verified_login_with_user_logo.png")

        # 3. Navigate to Register screen via bottom switch link "Create an account"
        print("3. Navigating to Sign Up Screen...")
        create_acc_link = page.locator("text=Create an account").first
        if create_acc_link.is_visible():
            create_acc_link.click()
            page.wait_for_timeout(1000)

        page.screenshot(path="verified_register_with_user_logo.png")
        print("-> Saved verified_register_with_user_logo.png")

        browser.close()
        print(f"Test finished! Detected {len(console_errors)} console errors.")

if __name__ == "__main__":
    run_tests()
