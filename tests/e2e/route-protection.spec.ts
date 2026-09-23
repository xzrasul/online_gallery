import { test, expect } from '@playwright/test';
import { signInAsNewUser } from './helpers/auth';

test('a buyer who never applied to sell is redirected away from the seller dashboard', async ({
  page,
}) => {
  await signInAsNewUser(page, 'route_protect_buyer');
  await page.getByRole('button', { name: 'Я покупатель' }).click();
  await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });

  await page.goto('/dashboard/seller');
  // Middleware redirects any non-seller hitting /dashboard/seller to
  // /become-seller/status; that page itself redirects on to /become-seller
  // when the user has no application row yet — so the final settled URL for
  // a buyer who never applied is /become-seller, not /become-seller/status.
  // Either way, they never reach the seller dashboard.
  await expect(page).toHaveURL(/\/become-seller(\/status)?$/, { timeout: 15000 });
});

test('an anonymous visitor hitting a dashboard route is sent to sign-in', async ({ page }) => {
  await page.goto('/dashboard/buyer');
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 15000 });
});

test('a forged session cookie is treated as anonymous', async ({ page, context }) => {
  await context.addCookies([{ name: 'session', value: 'forged.signature', url: 'http://localhost:3000' }]);
  await page.goto('/dashboard/buyer');
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 15000 });
});
