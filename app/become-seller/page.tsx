import { submitSellerApplication } from './actions';

export default async function BecomeSellerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main>
      <h1>Анкета продавца</h1>
      {error === 'invalid' && <p role="alert">Пожалуйста, заполните все поля корректно.</p>}
      <form action={submitSellerApplication}>
        <label>
          Имя художника/студии
          <input type="text" name="displayName" required />
        </label>
        <label>
          О себе
          <textarea name="bio" required />
        </label>
        <label>
          Telegram (необязательно)
          <input type="text" name="telegramContact" />
        </label>
        <button type="submit">Отправить на рассмотрение</button>
      </form>
    </main>
  );
}
