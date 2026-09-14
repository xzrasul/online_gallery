import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test('a buyer who never applied to sell is redirected away from the seller dashboard', async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  const testEmail = `route_protect_buyer+clerk_test_${Date.now()}@example.com`;
  const testPassword = `Rp4#kLm9wQ${Date.now()}!`;
  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(testEmail);
  await page.getByLabel('Password', { exact: true }).fill(testPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });
  await page.getByRole('button', { name: 'Я покупатель' }).click();
  await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });

  await page.goto('/dashboard/seller');
  // Middleware redirects any non-seller hitting /dashboard/seller to
  // /become-seller/status; that page itself redirects on to /become-seller
  // when the user has no application row yet (Task 10 behavior, unchanged
  // here) — so the final settled URL for a buyer who never applied is
  // /become-seller, not /become-seller/status. Either way, they never reach
  // the seller dashboard.
  await expect(page).toHaveURL(/\/become-seller(\/status)?$/, { timeout: 15000 });
});

test('an anonymous visitor hitting a dashboard route is sent to sign-in', async ({ page }) => {
  await page.goto('/dashboard/buyer');
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 15000 });
});
