import { redirect } from 'next/navigation';
import { getStaffRole } from '@/src/lib/auth/staff';
import { staffSignIn } from './actions';

export const metadata = {
  title: 'Вход для администрации',
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  invalid: 'Неверный логин или пароль.',
  too_many: 'Слишком много неудачных попыток. Попробуйте через 15 минут.',
  not_configured: 'Вход не настроен: на сервере не заданы пароли администрации.',
};

// Admin and moderator sign-in: a login and a password, no Telegram.
export default async function StaffSignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const role = await getStaffRole();
  if (role) redirect(role === 'admin' ? '/admin/database' : '/admin/sellers');
  const error = ERRORS[(await searchParams).error ?? ''];

  return (
    <main className="wrap signin pg">
      <form action={staffSignIn} className="panel login staff-login" aria-labelledby="staff-title">
        <h1 id="staff-title">Администрация</h1>
        <p>Вход для администратора и модераторов.</p>
        {error && (
          <p role="alert" className="notice err">
            {error}
          </p>
        )}
        <label className="field">
          <span>Логин</span>
          <input name="login" autoComplete="username" required autoCapitalize="none" spellCheck={false} />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit" className="btn wide">
          Войти
        </button>
      </form>
    </main>
  );
}
