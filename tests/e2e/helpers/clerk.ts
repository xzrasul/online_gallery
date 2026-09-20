import type { Page } from '@playwright/test';
import { recordCreatedClerkUser } from './clerk-cleanup';

// Labels come from @clerk/localizations `ruRU`
// (formFieldLabel__emailAddress / formFieldLabel__password / formButtonPrimary).
const EMAIL_LABEL = 'Почта';
const PASSWORD_LABEL = 'Пароль';
const CONTINUE_BUTTON = 'Продолжить';
// The OTP input's label is not part of the localization package; match both.
const CODE_LABEL = /verification code|код/i;

export async function signUpWithEmail(page: Page, email: string, password: string) {
  // Recorded first so a sign-up that half-completes is still cleaned up.
  recordCreatedClerkUser(email);
  await page.goto('/sign-up');
  await page.getByLabel(EMAIL_LABEL).fill(email);
  await page.getByLabel(PASSWORD_LABEL, { exact: true }).fill(password);
  await page.getByRole('button', { name: CONTINUE_BUTTON, exact: true }).click();
  // Clerk's OTP field auto-submits once all 6 digits are entered, so callers
  // must not click anything afterwards — they assert the resulting URL.
  await page.getByLabel(CODE_LABEL).fill('424242');
}
