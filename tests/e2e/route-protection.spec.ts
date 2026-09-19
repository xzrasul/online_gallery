import { test, expect } from '@playwright/test';
import { signUpWithEmail } from './helpers/clerk';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test('a buyer who never applied to sell is redirected away from the seller dashboard', async ({
  page,
}) => {
  await setupClerkTestingToken({ page });

  const testEmail = `route_protect_buyer+clerk_test_${Date.now()}@example.com`;
  const testPassword = `Rp4#kLm9wQ${Date.now()}!`;
  await signUpWithEmail(page, testEmail, testPassword);
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
