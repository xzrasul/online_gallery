import { deleteTestUsers } from './helpers/test-users-cleanup';

export default async function globalTeardown() {
  await deleteTestUsers();
}
