import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test('sign-up redirects to the role-choice screen', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const testEmail = `buyer+clerk_test_${Date.now()}@example.com`;
  const testPassword = `Xk9#mQ2vLp${Date.now()}!`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(testEmail);
  await page.getByLabel('Password', { exact: true }).fill(testPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Clerk's OTP field auto-submits once all 6 digits are entered, navigating
  // away immediately — so we don't click a "Continue" button here (it may
  // already be gone from the DOM by the time the click lands).
  await page.getByLabel('Enter verification code').fill('424242');

  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });
  await expect(page.getByRole('heading')).toContainText('Как вы хотите');
});
