import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="flex justify-center">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  );
}
