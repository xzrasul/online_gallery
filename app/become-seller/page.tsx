import { submitSellerApplication } from './actions';

export default function BecomeSellerPage() {
  return (
    <main>
      <h1>Анкета продавца</h1>
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
