import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="flex justify-center py-4 sm:py-10">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/choose-role" />
    </main>
  );
}
