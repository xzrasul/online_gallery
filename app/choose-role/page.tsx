import { chooseBuyer, chooseSeller } from './actions';

export default function ChooseRolePage() {
  return (
    <main>
      <h1>Как вы хотите использовать галерею?</h1>
      <form action={chooseBuyer}>
        <button type="submit">Я покупатель</button>
      </form>
      <form action={chooseSeller}>
        <button type="submit">Хочу продавать картины</button>
      </form>
    </main>
  );
}
