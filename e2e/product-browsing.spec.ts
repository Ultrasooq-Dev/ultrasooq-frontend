import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/home');

    // Page should load without errors
    await expect(page).not.toHaveTitle(/error|500|404/i);

    // Should have some content on the page
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('home page has navigation elements', async ({ page }) => {
    await page.goto('/home');

    // Should have a header/navbar
    const header = page.locator('header, nav, [role="navigation"]').first();
    await expect(header).toBeVisible();
  });

  test('product listing page loads', async ({ page }) => {
    await page.goto('/product');

    // Page should load
    await expect(page).not.toHaveTitle(/error|500/i);

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Should have some content
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('search page is accessible', async ({ page }) => {
    await page.goto('/search');

    // Should load without errors
    await expect(page).not.toHaveTitle(/error|500/i);
  });

  test('clicking a product navigates to product detail', async ({ page }) => {
    await page.goto('/product');

    // Wait for products to load
    await page.waitForTimeout(3000);

    // Find product links/cards - try common patterns
    const productLink = page.locator('a[href*="/product/"]').first();

    if (await productLink.isVisible()) {
      await productLink.click();

      // Wait for navigation
      await page.waitForTimeout(2000);

      // URL should contain /product/ with an ID
      expect(page.url()).toMatch(/\/product\//);
    }
  });

  test('trending page loads', async ({ page }) => {
    await page.goto('/trending');

    await expect(page).not.toHaveTitle(/error|500/i);

    // Wait for content
    await page.waitForTimeout(2000);

    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
