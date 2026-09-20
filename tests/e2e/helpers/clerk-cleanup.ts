import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createClerkClient } from '@clerk/backend';

// The e2e suite signs up real users in the Clerk *development* instance. Their
// emails are recorded here when the sign-up starts and deleted after the run
// (and at the start of the next run, if a run was interrupted).
// This file must not import '@playwright/test': it is also loaded by vitest.
const TEST_MARK = '+clerk_test';

function recordFile() {
  return path.join(process.cwd(), '.e2e', 'clerk-created-users.txt');
}

// Safety net: only a user whose EVERY email is a test address and one of them
// is exactly the recorded one may be deleted, so a real account never matches.
export function shouldDeleteClerkUser(userEmails: string[], recordedEmail: string): boolean {
  if (userEmails.length === 0) return false;
  const emails = userEmails.map((e) => e.toLowerCase());
  return emails.every((e) => e.includes(TEST_MARK)) && emails.includes(recordedEmail.toLowerCase());
}

export function recordCreatedClerkUser(email: string): void {
  const file = recordFile();
  mkdirSync(path.dirname(file), { recursive: true });
  appendFileSync(file, `${email}\n`);
}

export async function deleteRecordedClerkUsers(): Promise<void> {
  const file = recordFile();
  if (!existsSync(file)) return;

  const emails = [
    ...new Set(
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
  if (emails.length === 0) return;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn('CLERK_SECRET_KEY is not set: skipping cleanup of e2e Clerk users (the record file is kept).');
    return;
  }

  const clerk = createClerkClient({ secretKey });
  let allProcessed = true;

  for (const email of emails) {
    try {
      const { data: users } = await clerk.users.getUserList({ emailAddress: [email] });
      for (const user of users) {
        if (!shouldDeleteClerkUser(user.emailAddresses.map((e) => e.emailAddress), email)) continue;
        try {
          await clerk.users.deleteUser(user.id);
        } catch (error) {
          allProcessed = false;
          console.warn(`Could not delete Clerk test user ${email}:`, error);
        }
      }
    } catch (error) {
      allProcessed = false;
      console.warn(`Could not look up Clerk test user ${email}:`, error);
    }
  }

  if (allProcessed) rmSync(file, { force: true });
}
