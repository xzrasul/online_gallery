import { clerkSetup } from '@clerk/testing/playwright';
import { deleteRecordedClerkUsers } from './helpers/clerk-cleanup';

export default async function globalSetup() {
  // Leftovers of an earlier run that was interrupted before its teardown.
  await deleteRecordedClerkUsers();
  await clerkSetup();
}
