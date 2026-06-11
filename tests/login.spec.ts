import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with correct credentials and navigate to dashboard', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Ensure the page has loaded
    await expect(page.locator('h2').filter({ hasText: 'Welcome back' })).toBeVisible();

    // Fill in the credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('admin@tradeoffstack.com');
    await passwordInput.fill('Admin123!Secure');

    // Click the submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard is loaded by checking for a dashboard element
    await expect(page.locator('h1').filter({ hasText: /Application Central|Enterprise Hub|Dashboard|Tableau de bord/ })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('admin@tradeoffstack.com');
    await passwordInput.fill('WrongPassword!');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // The page URL should remain the same
    await expect(page).toHaveURL(/\/login/);

    // Check that an error message is visible
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
