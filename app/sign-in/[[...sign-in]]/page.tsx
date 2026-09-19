import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="flex justify-center py-4 sm:py-10">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  );
}
