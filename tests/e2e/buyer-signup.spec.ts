import { test, expect } from '@playwright/test';
import { signUpWithEmail } from './helpers/clerk';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test('sign-up redirects to the role-choice screen', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const testEmail = `buyer+clerk_test_${Date.now()}@example.com`;
  const testPassword = `Xk9#mQ2vLp${Date.now()}!`;

  await signUpWithEmail(page, testEmail, testPassword);

  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });
  await expect(page.getByRole('heading')).toContainText('Как вы хотите');
});
