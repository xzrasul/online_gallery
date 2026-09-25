import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionSecret } from './session-token';
import { STAFF_COOKIE, STAFF_MAX_AGE_SECONDS, createStaffToken, readStaffToken, type StaffRole } from './staff-token';

export type { StaffRole };

// The signed-in staff role, or null.
export async function getStaffRole(): Promise<StaffRole | null> {
  return readStaffToken((await cookies()).get(STAFF_COOKIE)?.value, getSessionSecret());
}

// For staff pages and actions: moderators and admins get in; `admin` pages
// only admins. Anyone else goes to the staff sign-in.
export async function requireStaff(level: 'moderator' | 'admin' = 'moderator'): Promise<StaffRole> {
  const role = await getStaffRole();
  if (!role) redirect('/sanatadmin');
  if (level === 'admin' && role !== 'admin') redirect('/admin/sellers');
  return role;
}

export async function startStaffSession(role: StaffRole) {
  (await cookies()).set(STAFF_COOKIE, await createStaffToken(role, getSessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: STAFF_MAX_AGE_SECONDS,
  });
}

export async function endStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}
