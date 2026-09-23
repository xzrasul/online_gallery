import { redirect } from 'next/navigation';
import { Send } from 'lucide-react';
import { getCurrentUser } from '@/src/lib/auth/session';
import { BotLogin } from '@/src/components/auth/bot-login';
import { Field } from '@/src/components/form/field';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { BRAND_NAME } from '@/src/lib/brand';

export const metadata = {
  title: 'Вход',
};

export default async function SignInPage() {
  if (await getCurrentUser()) redirect('/cabinet');

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const devLoginEnabled = process.env.NODE_ENV !== 'production';

  return (
    <main className="mx-auto max-w-md pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#229ED9] text-white">
          <Send className="size-6 -translate-x-px translate-y-px" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl">Вход в {BRAND_NAME}</h1>
        <p className="mt-2 text-muted-foreground">
          Вход подтверждается в нашем Telegram-боте — без паролей, номера телефона и СМС. При первом входе аккаунт создастся автоматически.
        </p>

        <div className="mt-6">
          {botUsername ? (
            <BotLogin botUsername={botUsername} />
          ) : (
            <p className="rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
              Вход через Telegram не настроен: задайте TELEGRAM_BOT_USERNAME.
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Бот получит только ваше имя и username в Telegram. Номер телефона не передаётся.
        </p>
      </div>

      {devLoginEnabled && (
        <form
          action="/auth/dev-login"
          method="get"
          className="mt-6 grid gap-4 rounded-sm border border-dashed border-border p-5"
          aria-label="Вход для разработки"
        >
          <div>
            <h2 className="text-base">Вход для разработки</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Бот не может достучаться до localhost. Эта форма есть только в режиме разработки.
            </p>
          </div>
          <Field label="Telegram ID">
            <Input type="number" name="id" min={1} required defaultValue="1000001" />
          </Field>
          <Field label="Имя">
            <Input type="text" name="name" placeholder="Тестовый пользователь" />
          </Field>
          <Button type="submit" variant="outline">
            Войти как тестовый пользователь
          </Button>
        </form>
      )}
    </main>
  );
}
