import Link from 'next/link';
import { Field } from '@/src/components/form/field';
import { SELLER_CONSENT_FIELD } from '@/src/lib/legal';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { getCurrentUser } from '@/src/lib/auth/session';
import { submitSellerApplication } from './actions';
import { SubmitButton } from '@/src/components/form/submit-button';

export default async function BecomeSellerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  return (
    <main className="mx-auto max-w-lg pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Анкета продавца</h1>
        {error === 'invalid' && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Пожалуйста, заполните все поля корректно.
          </p>
        )}
        {error === 'consent' && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Чтобы стать продавцом, нужно принять правила и согласиться на публикацию профиля.
          </p>
        )}
        <form action={submitSellerApplication} className="mt-6 grid gap-5">
          <Field label="Имя художника/студии">
            <Input type="text" name="displayName" required />
          </Field>
          <Field label="О себе">
            <Textarea name="bio" rows={5} required />
          </Field>
          <Field label="Telegram (необязательно)">
            <Input
              type="text"
              name="telegramContact"
              placeholder="@username"
              defaultValue={user?.username ? `@${user.username}` : undefined}
            />
          </Field>
          <label className="consent">
            <input type="checkbox" name={SELLER_CONSENT_FIELD} required />
            <span>
              Я принимаю <Link href="/rules/sellers">Правила для продавцов</Link> и согласен(на) на публикацию в открытом
              доступе имени, биографии, фото, контакта в Telegram и моих работ, в том числе в поисковых системах, по{' '}
              <Link href="/privacy">Политике конфиденциальности</Link>.
            </span>
          </label>
          <SubmitButton size="lg">
            Отправить на рассмотрение
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
