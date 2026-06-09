import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const artifactDir = process.env.CI 
    ? path.join(process.cwd(), 'screenshots') 
    : '/home/dordor/.gemini/antigravity/brain/ecff5d0a-726f-4044-bf24-9ddfd2ba3d53';
  if (!fs.existsSync(artifactDir)){
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const isHeadless = process.env.CI ? true : false;
  console.log(`Starting Playwright Browser (${isHeadless ? 'Headless' : 'Headful'})...`);
  const browser = await chromium.launch({ 
    headless: isHeadless, 
    slowMo: isHeadless ? 0 : 800 // pauses for 800ms between actions to let you follow visually
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Login Page
    console.log('1. Navigating to http://localhost:5173/login ...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('text=TradeOffStack');
    await page.screenshot({ path: path.join(artifactDir, 'test_step1_login.png') });
    console.log('   Saved test_step1_login.png');

    // Step 2: Login Action
    console.log('2. Entering Admin Credentials...');
    await page.fill('input[type="email"]', 'admin@tradeoffstack.com');
    await page.fill('input[type="password"]', 'Admin123!Secure');
    await page.click('button:has-text("Sign In to Account")');

    // Step 3: Wait for Dashboard
    console.log('3. Waiting for Dashboard redirection...');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1500); // allow animations
    await page.screenshot({ path: path.join(artifactDir, 'test_step2_dashboard.png') });
    console.log('   Saved test_step2_dashboard.png');

    // Step 4: Inventory
    console.log('4. Navigating to Inventory...');
    await page.click('a:has-text("Inventory")');
    await page.waitForSelector('text=Add Equipment');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'test_step3_inventory.png') });
    console.log('   Saved test_step3_inventory.png');

    // Step 5: Reservations
    console.log('5. Navigating to Reservations...');
    await page.click('a:has-text("Reservations")');
    await page.waitForSelector('text=New Reservation');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'test_step4_reservations.png') });
    console.log('   Saved test_step4_reservations.png');

    // Step 6: Edit Reservation Dialog
    console.log('6. Opening first Reservation Edit dialog...');
    await page.locator('button:has-text("Edit")').first().click();
    await page.waitForSelector('text=Modify Equipment Booking');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'test_step5_edit_reservation.png') });
    console.log('   Saved test_step5_edit_reservation.png');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Step 7: Maintenance
    console.log('7. Navigating to Maintenance...');
    await page.click('a:has-text("Maintenance")');
    await page.waitForSelector('text=Report Fault');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'test_step6_maintenance.png') });
    console.log('   Saved test_step6_maintenance.png');

    // Step 8: Edit Maintenance Dialog
    console.log('8. Opening first Maintenance Edit dialog...');
    await page.locator('button:has-text("Edit")').first().click();
    await page.waitForSelector('text=Modify Maintenance Request');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, 'test_step7_edit_maintenance.png') });
    console.log('   Saved test_step7_edit_maintenance.png');

    await page.keyboard.press('Escape');
    console.log('\nAll UI/UX tests completed successfully!');

  } catch (error) {
    console.error('An error occurred during the UI test:', error);
  } finally {
    await browser.close();
  }
})();
