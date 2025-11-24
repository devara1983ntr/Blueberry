from playwright.sync_api import sync_playwright

def verify_premium_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a desktop viewport
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Subscribe to console logs to debug
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        # Navigate to a dummy page first to clear storage for the domain (localhost:8080)
        # This ensures we get the age gate again
        try:
             page.goto("http://localhost:8080/404.html")
             page.evaluate("localStorage.clear()")
        except:
             pass

        # Load index.html
        print("Navigating to index.html...")
        page.goto("http://localhost:8080/index.html")

        # 1. Verify Age Verification Modal
        print("Waiting for age verification modal...")
        try:
            page.wait_for_selector("age-verification-modal", timeout=5000)
            print("Age verification modal found.")
            page.screenshot(path="/home/jules/verification/1_age_gate.png")

            # Click verify
            modal = page.locator("age-verification-modal")
            # Updated selector to match actual component implementation
            modal.evaluate("element => element.shadowRoot.getElementById('confirm-btn').click()")

            print("Clicked verify button.")

            # Wait for removal
            page.wait_for_selector("age-verification-modal", state="hidden", timeout=3000)
            print("Modal dismissed.")

        except Exception as e:
            print(f"Modal verification failed or skipped: {e}")
            page.screenshot(path="/home/jules/verification/error_modal.png")
            # If modal failed to close, subsequent checks might fail, but let's try.

        # 2. Verify Home Page Content (Mock Data)
        print("Verifying home page mock data...")
        try:
            # Wait for grid to populate
            page.wait_for_selector(".video-card", timeout=10000) # Increased timeout
            print("Video cards found.")

            page.screenshot(path="/home/jules/verification/2_home_hero.png")

            # Verify text "Search videos..." (fallback translation)
            search_input = page.locator("search-bar").evaluate("element => element.shadowRoot.querySelector('input').placeholder")
            print(f"Search placeholder: '{search_input}'")
            if search_input == "Search videos...":
                print("SUCCESS: Fallback translation working for search.")
            else:
                print(f"FAILURE: Unexpected search placeholder: '{search_input}'")

            # Scroll to trigger lazy loading or just view grid
            page.evaluate("window.scrollTo(0, 800)")
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/3_video_grid.png")

            # Check for specific mock title pattern
            first_title = page.locator(".video-card h3").first.inner_text()
            print(f"First video title: '{first_title}'")
            if "Mock Video" in first_title:
                 print("SUCCESS: Mock data loaded correctly.")
            else:
                 print(f"FAILURE: Unexpected video title: '{first_title}'")

        except Exception as e:
            print(f"Home page verification failed: {e}")
            page.screenshot(path="/home/jules/verification/error_home.png")

        browser.close()

if __name__ == "__main__":
    verify_premium_ui()
