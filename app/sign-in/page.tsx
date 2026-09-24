import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/src/lib/auth/session';
import { BotLogin } from '@/src/components/auth/bot-login';
import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { Medal } from '@/src/components/sanat/mandala';
import { BRAND_NAME } from '@/src/lib/brand';
import { safeNextPath } from '@/src/lib/auth/next-path';

export const metadata = {
  title: 'Вход',
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next ?? '/cabinet');

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const devLoginEnabled = process.env.NODE_ENV !== 'production';

  return (
    <main>
      <KoshinBand />
      <div className="wrap signin">
        <Medal size="md" />
        <div className="panel login">
          <KoshinBand small />
          <div className="body">
            <h1>Вход в {BRAND_NAME}</h1>
            <p>
              Вход подтверждается в нашем Telegram-боте — без паролей, номера телефона и СМС. При первом входе
              аккаунт создастся автоматически.
            </p>
            {next && <p className="notice">После входа вы вернётесь туда, где были.</p>}
            {botUsername ? (
              <BotLogin botUsername={botUsername} next={next} />
            ) : (
              <p className="notice">Вход через Telegram не настроен: задайте TELEGRAM_BOT_USERNAME.</p>
            )}
            <small>Бот получит только ваше имя и username в Telegram. Номер телефона не передаётся.</small>
          </div>
        </div>

        {devLoginEnabled && (
          <form action="/auth/dev-login" method="get" className="panel dev-login" aria-label="Вход для разработки">
            <div>
              <h2>Вход для разработки</h2>
              <p>Бот не может достучаться до localhost. Эта форма есть только в режиме разработки.</p>
            </div>
            {next && <input type="hidden" name="next" value={next} />}
            <label className="field">
              <span>Telegram ID</span>
              <input type="number" name="id" min={1} required defaultValue="1000001" />
            </label>
            <label className="field">
              <span>Имя</span>
              <input type="text" name="name" placeholder="Тестовый пользователь" />
            </label>
            <button type="submit" className="btn alt">
              Войти как тестовый пользователь
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
