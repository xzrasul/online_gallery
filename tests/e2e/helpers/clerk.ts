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
  // Clerk's OTP field is usable before `prepare_verification` has finished; filling
  // it early auto-submits an attempt with no code sent yet. Register the wait
  // before the click so the response cannot be missed.
  const prepared = page.waitForResponse(
    (r) => r.request().method() === 'POST' && /\/sign_ups\/[^/]+\/prepare_verification/.test(r.url()),
  );
  await page.getByRole('button', { name: CONTINUE_BUTTON, exact: true }).click();
  await prepared;
  // Clerk's OTP field auto-submits once all 6 digits are entered, so callers
  // must not click anything afterwards — they assert the resulting URL.
  await page.getByLabel(CODE_LABEL).fill('424242');
}
