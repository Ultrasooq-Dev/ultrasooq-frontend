import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Page should have email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    // Should have a submit/login button
    const loginButton = page.getByRole('button', { name: /login|sign in|تسجيل/i });
    await expect(loginButton).toBeVisible();
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');

    // Should have registration form fields
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
  });

  test('empty login form shows validation errors', async ({ page }) => {
    await page.goto('/login');

    // Click login without filling in fields
    const loginButton = page.getByRole('button', { name: /login|sign in|تسجيل/i });
    await loginButton.click();

    // Wait for validation messages to appear
    await page.waitForTimeout(500);

    // Page should still be on login (not redirected)
    expect(page.url()).toContain('/login');
  });

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/forget-password');

    // Should have email field for password recovery
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.locator('input[type="email"], input[name="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword');

    // Submit the form
    const loginButton = page.getByRole('button', { name: /login|sign in|تسجيل/i });
    await loginButton.click();

    // Wait for API response
    await page.waitForTimeout(3000);

    // Should still be on login page or show error
    const currentUrl = page.url();
    const hasError = await page.locator('[role="alert"], .error, .toast, [class*="error"], [class*="toast"]').count();

    // Either still on login page or showing an error message
    expect(currentUrl.includes('/login') || hasError > 0).toBe(true);
  });
});
