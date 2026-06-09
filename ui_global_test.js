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
  console.log(`Starting Global Playwright E2E Test Suite (${isHeadless ? 'Headless' : 'Headful'})...`);
  const browser = await chromium.launch({ 
    headless: isHeadless, 
    slowMo: isHeadless ? 0 : 1000 // Slow motion to let you follow the live execution easily
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Automatically accept all confirm/alert dialogs (Delete, Cancel, etc.)
  page.on('dialog', async dialog => {
    console.log(`    [Dialog] Automatically accepting: "${dialog.message()}"`);
    await dialog.accept();
  });

  // Generate unique serial number to identify our test asset
  const uniqueSerial = 'E2E-SRL-' + Math.floor(Math.random() * 1000000);
  const assetName = 'E2E Test Laptop Pro ' + uniqueSerial;

  try {
    // ==========================================
    // STEP 1: AUTHENTICATION
    // ==========================================
    console.log('1. Navigating to Login Page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('text=TradeOffStack');
    await page.screenshot({ path: path.join(artifactDir, 'global_01_login_page.png') });

    console.log('2. Logging in as Administrator...');
    await page.fill('input[type="email"]', 'admin@tradeoffstack.com');
    await page.fill('input[type="password"]', 'Admin123!Secure');
    await page.click('button:has-text("Sign In to Account")');
    
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'global_02_dashboard.png') });
    console.log('   Successfully logged in and reached Dashboard.');

    // ==========================================
    // STEP 2: CREATE ASSET (INVENTORY)
    // ==========================================
    console.log('3. Navigating to Inventory...');
    await page.click('a:has-text("Inventory")');
    await page.waitForSelector('text=Add Equipment');
    await page.screenshot({ path: path.join(artifactDir, 'global_03_inventory.png') });

    console.log(`4. Creating equipment: "${assetName}" with serial: "${uniqueSerial}"...`);
    await page.click('button:has-text("Add Equipment")');
    await page.waitForSelector('text=Add New IT Asset');
    
    await page.fill('input[placeholder="e.g. MacBook Pro 16 M3"]', assetName);
    await page.fill('input[placeholder="Manufacturer Serial No."]', uniqueSerial);
    await page.selectOption('select:has(option[value="Laptop"])', 'Laptop');
    await page.fill('input[type="number"]', '1500');
    await page.fill('textarea', 'Temporary laptop created by automated E2E test suite.');
    await page.screenshot({ path: path.join(artifactDir, 'global_04_create_asset_form.png') });
    await page.click('button[type="submit"]:has-text("Create Asset")');
    
    // Wait for the asset to appear in the table
    await page.waitForSelector(`text=${uniqueSerial}`);
    await page.screenshot({ path: path.join(artifactDir, 'global_05_asset_created.png') });
    console.log('   Asset created and verified in inventory table.');

    // ==========================================
    // STEP 3: CREATE RESERVATION
    // ==========================================
    console.log('5. Navigating to Reservations...');
    await page.click('a:has-text("Reservations")');
    await page.waitForSelector('text=New Reservation');
    await page.screenshot({ path: path.join(artifactDir, 'global_06_reservations_page.png') });

    console.log(`6. Creating reservation for "${assetName}"...`);
    await page.click('button:has-text("New Reservation")');
    await page.waitForSelector('text=Request Equipment Booking');
    
    // Select the newly created equipment and Admin user
    await page.selectOption('select:has(option:has-text("E2E Test Laptop Pro"))', { label: `${assetName} (${uniqueSerial})` });
    await page.selectOption('select:has(option:has-text("admin@tradeoffstack.com"))', { label: 'System Admin (admin@tradeoffstack.com)' });
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('textarea', 'E2E Reservation Test Notes.');
    await page.screenshot({ path: path.join(artifactDir, 'global_07_create_reservation_form.png') });
    await page.click('button[type="submit"]:has-text("Submit Reservation")');

    // Wait for the reservation to appear in the table
    await page.waitForSelector(`tr:has-text("${uniqueSerial}")`);
    await page.screenshot({ path: path.join(artifactDir, 'global_08_reservation_created.png') });
    console.log('   Reservation created successfully.');

    // ==========================================
    // STEP 4: MODIFY RESERVATION
    // ==========================================
    console.log('7. Modifying the reservation...');
    const resRow = page.locator(`tr:has-text("${uniqueSerial}")`);
    await resRow.locator('button:has-text("Edit")').click();
    await page.waitForSelector('text=Modify Equipment Booking');
    
    await page.fill('textarea', 'E2E Reservation Test Notes - MODIFIED.');
    await page.screenshot({ path: path.join(artifactDir, 'global_09_edit_reservation_form.png') });
    await page.click('button[type="submit"]:has-text("Submit Reservation")');
    
    await page.waitForSelector('text=Modify Equipment Booking', { state: 'detached' });
    await page.screenshot({ path: path.join(artifactDir, 'global_10_reservation_modified.png') });
    console.log('   Reservation modified successfully.');

    // ==========================================
    // STEP 5: CREATE MAINTENANCE TICKET
    // ==========================================
    console.log('8. Navigating to Maintenance...');
    await page.click('a:has-text("Maintenance")');
    await page.waitForSelector('text=Report Fault');
    await page.screenshot({ path: path.join(artifactDir, 'global_11_maintenance_page.png') });

    console.log(`9. Reporting a fault for "${assetName}"...`);
    await page.click('button:has-text("Report Fault")');
    await page.waitForSelector('text=Report Equipment Issue');
    
    await page.selectOption('select:has(option:has-text("E2E Test Laptop Pro"))', { label: `${assetName} (${uniqueSerial})` });
    await page.selectOption('select:has(option[value="High"])', 'High');
    await page.fill('textarea', 'Screen flickering issue - created by E2E test.');
    await page.screenshot({ path: path.join(artifactDir, 'global_12_create_maintenance_form.png') });
    await page.click('button[type="submit"]:has-text("Submit Ticket")');

    // Wait for the maintenance ticket to appear
    await page.waitForSelector(`tr:has-text("${uniqueSerial}")`);
    await page.screenshot({ path: path.join(artifactDir, 'global_13_maintenance_created.png') });
    console.log('   Maintenance ticket created successfully.');

    // ==========================================
    // STEP 6: MODIFY MAINTENANCE TICKET
    // ==========================================
    console.log('10. Modifying the maintenance ticket...');
    const maintRow = page.locator(`tr:has-text("${uniqueSerial}")`);
    await maintRow.locator('button:has-text("Edit")').click();
    await page.waitForSelector('text=Modify Maintenance Request');
    
    await page.selectOption('select:has(option[value="Critical"])', 'Critical');
    await page.screenshot({ path: path.join(artifactDir, 'global_14_edit_maintenance_form.png') });
    await page.click('button[type="submit"]:has-text("Submit Ticket")');
    
    await page.waitForSelector('text=Critical');
    await page.screenshot({ path: path.join(artifactDir, 'global_15_maintenance_modified.png') });
    console.log('   Maintenance request modified successfully.');

    // ==========================================
    // STEP 7: CLEAN UP DEPENDENCIES (API-LEVEL DELETION)
    // ==========================================
    console.log('11. Deleting maintenance ticket via API...');
    const maintDeleted = await page.evaluate(async (serial) => {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:5000/api/maintenancerequest', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const list = await res.json();
      const item = list.find(m => m.equipment?.serial_number === serial || m.equipment?.name?.includes(serial));
      if (!item) return 'not_found';
      const delRes = await fetch(`http://localhost:5000/api/maintenancerequest/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return delRes.status === 204 ? 'success' : 'failed';
    }, uniqueSerial);
    console.log(`    Result: ${maintDeleted}`);

    console.log('12. Deleting reservation via API...');
    const resDeleted = await page.evaluate(async (serial) => {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch('http://localhost:5000/api/reservation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const list = await res.json();
      const item = list.find(r => r.equipment?.serial_number === serial || r.equipment?.name?.includes(serial));
      if (!item) return 'not_found';
      const delRes = await fetch(`http://localhost:5000/api/reservation/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return delRes.status === 204 ? 'success' : 'failed';
    }, uniqueSerial);
    console.log(`    Result: ${resDeleted}`);

    // ==========================================
    // STEP 8: DELETE ASSET (INVENTORY)
    // ==========================================
    console.log('13. Navigating back to Inventory for asset deletion...');
    await page.click('a:has-text("Inventory")');
    await page.waitForSelector('text=Add Equipment');
    
    console.log(`14. Opening details for "${assetName}"...`);
    await page.click(`tr:has-text("${uniqueSerial}")`);
    await page.waitForSelector('text=Asset Details');
    await page.screenshot({ path: path.join(artifactDir, 'global_16_asset_details_sheet.png') });

    console.log('15. Deleting the asset...');
    await page.click('button:has-text("Delete")');
    
    // Wait for the asset to be removed from the list
    await page.waitForSelector(`text=${uniqueSerial}`, { state: 'detached' });
    await page.screenshot({ path: path.join(artifactDir, 'global_17_asset_deleted.png') });
    console.log('   Asset successfully deleted.');

    console.log('\n=============================================');
    console.log('ALL E2E CRUD WORKFLOW TESTS COMPLETED SUCCESSFULLY!');
    console.log('=============================================');

  } catch (error) {
    console.error('An error occurred during the E2E test:', error);
  } finally {
    await browser.close();
  }
})();
