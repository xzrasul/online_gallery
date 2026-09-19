import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="flex justify-center">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/choose-role" />
    </main>
  );
}
