import { deleteRecordedClerkUsers } from './helpers/clerk-cleanup';

export default async function globalTeardown() {
  await deleteRecordedClerkUsers();
}
