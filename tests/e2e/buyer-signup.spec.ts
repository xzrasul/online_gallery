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

  await page.getByLabel('Enter verification code').fill('424242');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/choose-role/);
  await expect(page.getByRole('heading')).toContainText('Как вы хотите');
});
