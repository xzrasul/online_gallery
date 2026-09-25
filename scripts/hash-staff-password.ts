// Prints the hash for a staff password, to put in STAFF_ADMIN_PASSWORD_HASH or
// STAFF_MODERATOR_PASSWORD_HASH (locally in .env.local, and in Vercel's
// environment variables). Usage: npx tsx scripts/hash-staff-password.ts <password>
import { hashStaffPassword } from '../src/lib/auth/staff-password';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npx tsx scripts/hash-staff-password.ts <password>');
  process.exit(1);
}
hashStaffPassword(password).then((hash) => console.log(hash));
