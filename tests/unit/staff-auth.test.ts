import { describe, it, expect, afterEach } from 'vitest';
import { createStaffToken, readStaffToken, STAFF_MAX_AGE_SECONDS } from '../../src/lib/auth/staff-token';
import { createSessionToken } from '../../src/lib/auth/session-token';
import { checkStaffLogin, hashStaffPassword, verifyStaffPassword } from '../../src/lib/auth/staff-password';

const SECRET = 'x'.repeat(40);

describe('staff token', () => {
  it('round-trips the role until it expires', async () => {
    const now = 1_000_000;
    const token = await createStaffToken('moderator', SECRET, now);
    expect(await readStaffToken(token, SECRET, now + 60)).toBe('moderator');
    expect(await readStaffToken(token, SECRET, now + STAFF_MAX_AGE_SECONDS)).toBeNull();
  });
  it('rejects a wrong secret, a tampered role and a site session token', async () => {
    const token = await createStaffToken('moderator', SECRET);
    expect(await readStaffToken(token, 'y'.repeat(40))).toBeNull();
    const [, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ role: 'admin', exp: 9e9 })).toString('base64url');
    expect(await readStaffToken(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(await readStaffToken(await createSessionToken('some-user', SECRET), SECRET)).toBeNull();
  });
});

describe('staff password', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('verifies only the right password', async () => {
    const hash = await hashStaffPassword('секрет-123');
    expect(hash).toMatch(/^scrypt:/);
    expect(await verifyStaffPassword('секрет-123', hash)).toBe(true);
    expect(await verifyStaffPassword('секрет-124', hash)).toBe(false);
    expect(await verifyStaffPassword('секрет-123', 'garbage')).toBe(false);
  });

  it('signs admin and moderator in by their own login and password', async () => {
    process.env.STAFF_ADMIN_PASSWORD_HASH = await hashStaffPassword('a-pass');
    process.env.STAFF_MODERATOR_PASSWORD_HASH = await hashStaffPassword('m-pass');
    expect(await checkStaffLogin('admin', 'a-pass')).toEqual({ ok: true, role: 'admin' });
    expect(await checkStaffLogin(' Moder ', 'm-pass')).toEqual({ ok: true, role: 'moderator' });
    expect(await checkStaffLogin('moder', 'a-pass')).toEqual({ ok: false, reason: 'invalid' });
    expect(await checkStaffLogin('root', 'a-pass')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('says so when no staff password is configured', async () => {
    delete process.env.STAFF_ADMIN_PASSWORD_HASH;
    delete process.env.STAFF_MODERATOR_PASSWORD_HASH;
    expect(await checkStaffLogin('admin', 'x')).toEqual({ ok: false, reason: 'not_configured' });
  });
});
