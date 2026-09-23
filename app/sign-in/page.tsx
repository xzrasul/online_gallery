import { redirect } from 'next/navigation';
import { Send } from 'lucide-react';
import { getCurrentUser } from '@/src/lib/auth/session';
import { TelegramLoginButton } from '@/src/components/auth/telegram-login-button';
import { Field } from '@/src/components/form/field';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

export const metadata = {
  title: 'Вход — Галерея художников',
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect('/cabinet');

  const { error } = await searchParams;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const devLoginEnabled = process.env.NODE_ENV !== 'production';

  return (
    <main className="mx-auto max-w-md pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 text-center sm:p-8">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#229ED9] text-white">
          <Send className="size-6 -translate-x-px translate-y-px" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl">Вход в галерею</h1>
        <p className="mt-2 text-muted-foreground">
          Войдите через Telegram — без паролей и писем с кодами. При первом входе аккаунт создастся автоматически.
        </p>

        {error === 'telegram' && (
          <p
            role="alert"
            className="mt-5 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-left text-sm text-destructive"
          >
            Не удалось подтвердить вход через Telegram. Попробуйте ещё раз.
          </p>
        )}

        <div className="mt-6">
          {botUsername ? (
            <TelegramLoginButton botUsername={botUsername} />
          ) : (
            <p className="rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
              Вход через Telegram не настроен: задайте TELEGRAM_BOT_USERNAME.
            </p>
          )}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Мы получим только ваше имя, username и фото профиля из Telegram. Номер телефона не передаётся.
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
              Виджет Telegram не работает на localhost. Эта форма есть только в режиме разработки.
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
