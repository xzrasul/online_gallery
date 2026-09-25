import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Field } from '@/src/components/form/field';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { getDb } from '@/src/db';
import { getCurrentUser } from '@/src/lib/auth/session';
import { getSellerProfile } from '@/src/lib/sellers/applications';
import { MAX_BIO_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '@/src/lib/sellers/profile-form';
import { AVATAR_MESSAGES, type AvatarResult } from '@/src/lib/sellers/avatar';
import { AvatarForm } from '@/src/components/sanat/avatar-form';
import { submitSellerAvatar, submitSellerProfile } from './actions';
import { SubmitButton } from '@/src/components/form/submit-button';

export const metadata = {
  title: 'Мой профиль',
};

export default async function SellerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; photo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user || user.role !== 'seller') redirect('/');

  const profile = await getSellerProfile(getDb(), user.id);
  if (!profile) redirect('/become-seller/status');

  const { error, saved, photo } = await searchParams;

  return (
    <main className="mx-auto max-w-lg">
      <Link href="/dashboard/seller" className="text-sm text-muted-foreground hover:text-brand">
        ← В кабинет
      </Link>
      <div className="mt-4 rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Мой профиль</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Эти данные видят покупатели на вашей странице и рядом с каждой вашей картиной. Изменения сохраняются сразу.
        </p>
        {saved && (
          <p role="status" className="mt-4 rounded-sm border border-border bg-accent px-3 py-2 text-sm">
            Профиль сохранён.{' '}
            <Link href={`/gallery/artist/${user.id}`} className="text-brand underline-offset-4 hover:underline">
              Посмотреть мою страницу
            </Link>
          </p>
        )}
        {error === 'invalid' && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Пожалуйста, заполните все поля корректно.
          </p>
        )}
        <section aria-labelledby="photo-title" className="mt-6 grid gap-3">
          <h2 id="photo-title" className="text-xl">
            Фото
          </h2>
          <p className="text-sm text-muted-foreground">
            Показывается на странице художника и в списке художников. Без фото там будет первая буква имени.
          </p>
          {photo && photo in AVATAR_MESSAGES && (
            <p role={photo === 'saved' || photo === 'removed' ? 'status' : 'alert'} className="notice">
              {AVATAR_MESSAGES[photo as AvatarResult]}
            </p>
          )}
          <AvatarForm action={submitSellerAvatar} name={profile.displayName} url={profile.avatarUrl ?? user.photoUrl} />
        </section>
        <form action={submitSellerProfile} className="mt-8 grid gap-5">
          <Field label="Имя художника/студии">
            <Input
              type="text"
              name="displayName"
              required
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              defaultValue={profile.displayName}
            />
          </Field>
          <Field label="О себе">
            <Textarea name="bio" rows={6} required maxLength={MAX_BIO_LENGTH} defaultValue={profile.bio} />
          </Field>
          <Field label="Telegram (необязательно)">
            <Input
              type="text"
              name="telegramContact"
              placeholder="@username"
              defaultValue={profile.telegramContact ?? ''}
            />
          </Field>
          <SubmitButton size="lg">
            Сохранить профиль
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
