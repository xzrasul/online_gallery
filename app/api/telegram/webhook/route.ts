import { getDb } from '@/src/db';
import {
  confirmCallbackData,
  confirmLoginRequest,
  findPendingLoginRequest,
  parseConfirmCallback,
  parseStartPayload,
  webhookSecret,
} from '@/src/lib/auth/bot-login';
import { safeEqual } from '@/src/lib/auth/crypto';
import { getSessionSecret } from '@/src/lib/auth/session-token';
import { BRAND_NAME as SITE_NAME } from '@/src/lib/brand';
import { callTelegram, type TelegramUpdate, type TelegramUser } from '@/src/lib/telegram-bot/api';

// Replies are best effort: a failed sendMessage must never break the login.
async function reply(method: string, body: Record<string, unknown>) {
  try {
    await callTelegram(method, body);
  } catch (err) {
    console.error('telegram webhook reply failed:', err);
  }
}

function profileOf(from: TelegramUser) {
  return {
    telegramId: from.id,
    fullName: [from.first_name, from.last_name].filter(Boolean).join(' '),
    username: from.username ?? null,
    photoUrl: null,
  };
}

async function handleMessage(message: NonNullable<TelegramUpdate['message']>, signInUrl: string) {
  if (message.chat.type !== 'private' || !message.from || message.from.is_bot) return;
  const chatId = message.chat.id;
  const token = parseStartPayload(message.text);
  const request = token ? await findPendingLoginRequest(getDb(), token) : null;

  if (!request) {
    await reply('sendMessage', {
      chat_id: chatId,
      text: token
        ? 'Ссылка для входа устарела. Вернитесь на сайт и нажмите «Войти через Telegram» ещё раз.'
        : `Это бот для входа на сайт «${SITE_NAME}». Откройте сайт и нажмите «Войти через Telegram».`,
      reply_markup: { inline_keyboard: [[{ text: 'Открыть сайт', url: signInUrl }]] },
    });
    return;
  }

  await reply('sendMessage', {
    chat_id: chatId,
    text:
      `Вход на сайт «${SITE_NAME}».\n\n` +
      'Нажмите кнопку ниже, чтобы подтвердить вход. Если вы не пытались войти, просто проигнорируйте это сообщение.',
    reply_markup: { inline_keyboard: [[{ text: '✅ Подтвердить вход', callback_data: confirmCallbackData(request.id) }]] },
  });
}

async function handleCallback(query: NonNullable<TelegramUpdate['callback_query']>) {
  const requestId = parseConfirmCallback(query.data);
  if (!requestId || query.from.is_bot) {
    await reply('answerCallbackQuery', { callback_query_id: query.id });
    return;
  }

  const confirmed = await confirmLoginRequest(getDb(), requestId, profileOf(query.from));
  await reply('answerCallbackQuery', {
    callback_query_id: query.id,
    text: confirmed ? 'Вход подтверждён' : 'Ссылка устарела',
  });
  if (query.message) {
    await reply('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: confirmed
        ? '✅ Вход подтверждён. Вернитесь в браузер — страница обновится сама.'
        : 'Эта ссылка для входа устарела или уже использована. Нажмите «Войти через Telegram» на сайте ещё раз.',
    });
  }
}

export async function POST(req: Request) {
  const received = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!safeEqual(received, await webhookSecret(getSessionSecret()))) {
    return new Response('Forbidden', { status: 403 });
  }

  const update = (await req.json()) as TelegramUpdate;
  if (update.message) await handleMessage(update.message, new URL('/sign-in', req.url).toString());
  if (update.callback_query) await handleCallback(update.callback_query);
  // Always 200 so Telegram doesn't keep redelivering the update.
  return new Response('ok');
}
