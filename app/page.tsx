import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <main>
      <h1>Галерея художников</h1>
      <p>Маркетплейс уникальных картин.</p>
      <Show when="signed-out">
        <SignInButton>
          <button type="button">Войти</button>
        </SignInButton>
        <SignUpButton>
          <button type="button">Регистрация</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <a href="/choose-role">Личный кабинет</a>
        <UserButton />
      </Show>
    </main>
  );
}
