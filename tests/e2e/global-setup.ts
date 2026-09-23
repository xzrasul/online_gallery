import { deleteTestUsers } from './helpers/test-users-cleanup';

export default async function globalSetup() {
  // Leftovers of an earlier run that was interrupted before its teardown.
  await deleteTestUsers();
}
