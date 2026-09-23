// Real Telegram ids are far below this, so test rows never collide with real
// accounts and can be cleaned up by range.
export const TEST_TELEGRAM_ID_MIN = 9_000_000_000_000;

// Maps a readable test label to a stable fake Telegram id.
export function testTelegramId(label: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < label.length; i++) {
    hash ^= label.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return TEST_TELEGRAM_ID_MIN + hash;
}
