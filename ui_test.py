import os
import time
from playwright.sync_api import sync_playwright

def run_ui_test():
    artifact_dir = "/home/dordor/.gemini/antigravity/brain/ecff5d0a-726f-4044-bf24-9ddfd2ba3d53"
    os.makedirs(artifact_dir, exist_ok=True)

    print("Starting Playwright browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        # Step 1: Navigate to Login Page
        print("1. Navigating to http://localhost:5173/login ...")
        page.goto("http://localhost:5173/login")
        page.wait_for_selector("text=TradeOffStack")
        
        # Take login page screenshot
        login_screenshot = os.path.join(artifact_dir, "test_step1_login.png")
        page.screenshot(path=login_screenshot)
        print(f"   Login screenshot saved to {login_screenshot}")

        # Assert visual elements of split screen
        assert page.is_visible("text=TradeOffStack"), "Title 'TradeOffStack' not found on login page."
        assert page.is_visible("text=Welcome back"), "Header 'Welcome back' not found."
        assert page.is_visible("text=IT Asset Lifecycle Management, Orchestrated."), "Hero caption not found."

        # Step 2: Fill out login form
        print("2. Entering credentials...")
        page.fill("input[placeholder='admin@tradeoffstack.com']", "admin@tradeoffstack.com")
        page.fill("input[placeholder='••••••••']", "Admin123!Secure")
        
        # Click login button
        page.click("button:has-text('Sign In to Account')")
        
        # Wait for redirect
        print("3. Waiting for dashboard redirection...")
        page.wait_for_url("**/dashboard")
        time.sleep(1) # wait for page animations/renders to settle
        
        # Take dashboard screenshot
        dashboard_screenshot = os.path.join(artifact_dir, "test_step2_dashboard.png")
        page.screenshot(path=dashboard_screenshot)
        print(f"   Dashboard screenshot saved to {dashboard_screenshot}")

        # Step 3: Go to Inventory
        print("4. Navigating to Inventory...")
        page.click("a:has-text('Inventory')")
        page.wait_for_selector("text=Asset List")
        time.sleep(1)
        
        inventory_screenshot = os.path.join(artifact_dir, "test_step3_inventory.png")
        page.screenshot(path=inventory_screenshot)
        print(f"   Inventory screenshot saved to {inventory_screenshot}")

        # Step 4: Go to Reservations
        print("5. Navigating to Reservations...")
        page.click("a:has-text('Reservations')")
        page.wait_for_selector("text=Equipment Reservations")
        time.sleep(1)
        
        reservations_screenshot = os.path.join(artifact_dir, "test_step4_reservations.png")
        page.screenshot(path=reservations_screenshot)
        print(f"   Reservations screenshot saved to {reservations_screenshot}")

        # Step 5: Open Reservation Edit Dialog
        print("6. Clicking Edit button on first reservation...")
        # Select first Edit button in the table
        page.locator("button:has-text('Edit')").first.click()
        page.wait_for_selector("text=Modify Equipment Booking")
        time.sleep(0.5)
        
        edit_reservation_screenshot = os.path.join(artifact_dir, "test_step5_edit_reservation.png")
        page.screenshot(path=edit_reservation_screenshot)
        print(f"   Edit Reservation screenshot saved to {edit_reservation_screenshot}")
        
        # Close dialog
        page.keyboard.press("Escape")
        time.sleep(0.5)

        # Step 6: Go to Maintenance
        print("7. Navigating to Maintenance...")
        page.click("a:has-text('Maintenance')")
        page.wait_for_selector("text=Maintenance Requests")
        time.sleep(1)
        
        maintenance_screenshot = os.path.join(artifact_dir, "test_step6_maintenance.png")
        page.screenshot(path=maintenance_screenshot)
        print(f"   Maintenance screenshot saved to {maintenance_screenshot}")

        # Step 7: Open Maintenance Edit Dialog
        print("8. Clicking Edit button on first maintenance request...")
        page.locator("button:has-text('Edit')").first.click()
        page.wait_for_selector("text=Modify Maintenance Request")
        time.sleep(0.5)
        
        edit_maintenance_screenshot = os.path.join(artifact_dir, "test_step7_edit_maintenance.png")
        page.screenshot(path=edit_maintenance_screenshot)
        print(f"   Edit Maintenance screenshot saved to {edit_maintenance_screenshot}")
        
        # Close dialog
        page.keyboard.press("Escape")
        
        print("\nAll UI/UX tests passed successfully!")
        browser.close()

if __name__ == "__main__":
    run_ui_test()
