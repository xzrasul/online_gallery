export function telegramHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');
  return /^[A-Za-z0-9_]{5,32}$/.test(handle) ? `https://t.me/${handle}` : null;
}
