import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'mlaofficeambattur@gmail.com';
const ADMIN_PASSWORD = 'Adminmla@70';

test('admin login - success', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.locator('footer a[href="#admin-login"]').click();
  await page.waitForSelector('h2:has-text("Portal Login")');

  await page.fill('input[placeholder="Enter Email Address"]', ADMIN_EMAIL);
  await page.fill('input[placeholder="Enter Password"]', ADMIN_PASSWORD);

  await page.click('button:has-text("Sign In")');

  await expect(page.locator('.admin-layout')).toBeVisible({ timeout: 15000 });
});

test('admin login - wrong password shows error', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.locator('footer a[href="#admin-login"]').click();
  await page.waitForSelector('h2:has-text("Portal Login")');

  await page.fill('input[placeholder="Enter Email Address"]', ADMIN_EMAIL);
  await page.fill('input[placeholder="Enter Password"]', 'wrongpassword');

  await page.click('button:has-text("Sign In")');

  await expect(page.locator('.alert-danger')).toBeVisible({ timeout: 15000 });
});

test('admin logout clears dashboard button', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.locator('footer a[href="#admin-login"]').click();
  await page.waitForSelector('h2:has-text("Portal Login")');

  await page.fill('input[placeholder="Enter Email Address"]', ADMIN_EMAIL);
  await page.fill('input[placeholder="Enter Password"]', ADMIN_PASSWORD);
  await page.click('button:has-text("Sign In")');
  await expect(page.locator('.admin-layout')).toBeVisible({ timeout: 15000 });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
});
