// Minimal Telegram Bot API client: https://core.telegram.org/bots/api
export async function callTelegram(method: string, body: Record<string, unknown>): Promise<unknown> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description ?? res.status}`);
  return data.result;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramUpdate {
  message?: { chat: { id: number; type: string }; from?: TelegramUser; text?: string };
  callback_query?: {
    id: string;
    from: TelegramUser;
    data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
}
