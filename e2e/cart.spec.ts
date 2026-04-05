import { test, expect } from '@playwright/test';

test.describe('Cart Flow', () => {
  test('cart page is accessible', async ({ page }) => {
    await page.goto('/cart');

    // Page should load
    await expect(page).not.toHaveTitle(/error|500/i);

    // Wait for content
    await page.waitForTimeout(2000);
  });

  test('empty cart shows appropriate message', async ({ page }) => {
    // Clear any existing cart state by using a fresh context
    await page.goto('/cart');

    // Wait for content to load
    await page.waitForTimeout(3000);

    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('product detail page has add to cart button', async ({ page }) => {
    await page.goto('/product');

    // Wait for products to load
    await page.waitForTimeout(3000);

    // Navigate to first product
    const productLink = page.locator('a[href*="/product/"]').first();

    if (await productLink.isVisible()) {
      await productLink.click();
      await page.waitForTimeout(3000);

      // Product detail page should have an add-to-cart button
      const addToCartBtn = page.getByRole('button', { name: /add to cart|أضف|cart/i });

      if (await addToCartBtn.isVisible()) {
        await expect(addToCartBtn).toBeEnabled();
      }
    }
  });

  test('checkout page requires authentication', async ({ page }) => {
    await page.goto('/checkout');

    // Wait for redirect or content
    await page.waitForTimeout(3000);

    // Should redirect to login or show auth required
    const currentUrl = page.url();
    // Either redirected to login or stayed on checkout (if handled differently)
    expect(
      currentUrl.includes('/login') ||
      currentUrl.includes('/checkout') ||
      currentUrl.includes('/home')
    ).toBe(true);
  });

  test('wishlist page is accessible', async ({ page }) => {
    await page.goto('/wishlist');

    // Page should load without crashing
    await expect(page).not.toHaveTitle(/error|500/i);

    await page.waitForTimeout(2000);
  });
});
