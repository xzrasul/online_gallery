// Where to send someone after signing in, e.g. back to the artwork they tried
// to like. Only same-site paths are accepted ("/gallery/..."), never "//host"
// or "https://..." — otherwise the sign-in page becomes an open redirect.
export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 512) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  return raw;
}

// The login-request cookie that carries `next` across the bot sign-in.
export const LOGIN_NEXT_COOKIE = 'sp_login_next';

// New accounts pick a role first, returning users go to their cabinet — or,
// with `next` (an already validated same-site path), back to where they were.
export function afterSignInPath(isNewUser: boolean, next?: string | null): string {
  if (isNewUser) return next ? `/choose-role?next=${encodeURIComponent(next)}` : '/choose-role';
  return next ?? '/cabinet';
}
