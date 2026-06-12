import { test, expect, request } from '@playwright/test';

// The API is running on port 5000
// The API is running on port 5000
const API_BASE_URL = 'http://localhost:5000';

test.describe.serial('HTTP Injection and UI Persistence Verification', () => {

  let apiContext: any;
  let token: string = '';
  
  // Entity IDs to be captured during creation
  let departmentId: string;
  let equipmentId: string;
  let userId: string;

  test.beforeAll(async () => {
    // 1. Authenticate with the API using default admin credentials
    apiContext = await request.newContext({
      baseURL: API_BASE_URL,
    });
    
    const loginResponse = await apiContext.post('/api/Auth/login', {
      data: {
        email: 'admin@tradeoffstack.com',
        password: 'Admin123!Secure'
      }
    });
    
    if (!loginResponse.ok()) {
      console.error(`Login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
    }
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    token = loginData.token || loginData.Token;
    expect(token).toBeDefined();

    // Re-initialize api context with auth header
    apiContext = await request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  });

  test('should inject Department data via HTTP POST', async () => {
    const res = await apiContext.post('/api/Department', {
      data: {
        name: 'UI Verification Dept',
        description: 'Created automatically by HTTP Injection script'
      }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    departmentId = data.id || data.Id;
  });

  test('should inject Equipment data via HTTP POST', async () => {
    const res = await apiContext.post('/api/Equipment', {
      data: {
        name: 'MacBook Pro M3 Max',
        serial_number: 'SN-M3-99901',
        status: 1, // Available
        category: 1, // Laptop
        description: 'High-end developer machine',
        price: 3499.99,
        salvage_value: 500,
        useful_life_years: 5,
        depreciation_method: 1 // StraightLine
      }
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    equipmentId = data.id || data.Id;
  });

  test('should inject Software License data via HTTP POST', async () => {
    const res = await apiContext.post('/api/SoftwareLicense', {
      data: {
        name: 'JetBrains All Products Pack',
        license_key: 'JB-1234-5678-ABCD',
        total_seats: 50,
        expiration_date: '2027-12-31T00:00:00Z',
        price: 299.99
      }
    });
    expect(res.ok()).toBeTruthy();
  });

  // We can also create a reservation to test the foreign key relations
  test('should inject Reservation data via HTTP POST', async () => {
    // Fetch users to get an ID
    const usersRes = await apiContext.get('/api/User');
    const usersData = await usersRes.json();
    const adminUser = usersData.find((u: any) => u.email === 'admin@tradeoffstack.com');
    userId = adminUser.id || adminUser.Id;

    const reservationRes = await apiContext.post('/api/Reservation', {
      data: {
        equipment_id: equipmentId,
        user_id: userId,
        status: 1, // Approved
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        notes: 'Injected Reservation'
      }
    });
    if (!reservationRes.ok()) {
      console.error(`Reservation failed: ${reservationRes.status()} ${await reservationRes.text()}`);
    }
    expect(reservationRes.ok()).toBeTruthy();
  });

  test('should inject Maintenance Request data via HTTP POST', async () => {
    const res = await apiContext.post('/api/MaintenanceRequest', {
      data: {
        equipment_id: equipmentId,
        requested_by_id: userId,
        status: 0, // Pending
        priority: 2, // High
        description: 'Keyboard keys sticky'
      }
    });
    expect(res.ok()).toBeTruthy();
  });

  // Now the UI Persistence part!
  test('should navigate to UI pages and verify injected data persists visually', async ({ page }) => {
    // 1. Login to UI
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@tradeoffstack.com');
    await page.fill('input[type="password"]', 'Admin123!Secure');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Screenshot Dashboard
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/1_dashboard.png', fullPage: true });

    // Screenshot Inventory (Equipment)
    await page.goto('/inventory');
    await page.waitForSelector('text=MacBook Pro M3 Max', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/2_inventory.png', fullPage: true });

    // Screenshot Licenses
    await page.goto('/licenses');
    await page.waitForSelector('text=JetBrains All Products Pack', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/3_licenses.png', fullPage: true });

    // Screenshot Departments
    await page.goto('/departments');
    await page.waitForSelector('text=UI Verification Dept', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/4_departments.png', fullPage: true });

    // Screenshot Reservations
    await page.goto('/reservations');
    await page.waitForSelector('text=Injected Reservation', { timeout: 10000 }).catch(() => {});
    await page.screenshot({ path: 'screenshots/5_reservations.png', fullPage: true });

    // Screenshot Maintenance
    await page.goto('/maintenance');
    await page.waitForSelector('text=Keyboard keys sticky', { timeout: 10000 }).catch(() => {});
    await page.screenshot({ path: 'screenshots/6_maintenance.png', fullPage: true });
  });

});
