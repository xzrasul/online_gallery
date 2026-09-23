import { webhookSecret } from '../src/lib/auth/bot-login';
import { getSessionSecret } from '../src/lib/auth/session-token';
import { callTelegram } from '../src/lib/telegram-bot/api';

// Points the bot at the site's webhook. SESSION_SECRET must be the same value
// the deployed site uses, because the webhook secret is derived from it.
//   tsx scripts/set-telegram-webhook.ts https://onlinegallery-eosin.vercel.app
async function main() {
  const siteUrl = process.argv[2];
  if (!siteUrl?.startsWith('https://')) {
    console.error('Usage: tsx scripts/set-telegram-webhook.ts https://<site-domain>');
    process.exit(1);
  }

  const url = new URL('/api/telegram/webhook', siteUrl).toString();
  await callTelegram('setWebhook', {
    url,
    secret_token: await webhookSecret(getSessionSecret()),
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
  const info = (await callTelegram('getWebhookInfo', {})) as { url: string; last_error_message?: string };
  console.log(`Webhook set: ${info.url}`);
  if (info.last_error_message) console.log(`Last error reported by Telegram: ${info.last_error_message}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
