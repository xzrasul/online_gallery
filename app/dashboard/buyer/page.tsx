import Link from 'next/link';
import { buttonVariants } from '@/src/components/ui/button';

export default function BuyerDashboardPage() {
  return (
    <main className="max-w-2xl pt-4 sm:pt-10">
      <h1>Личный кабинет покупателя</h1>
      <div className="mt-8 rounded-sm border border-border bg-card p-6">
        <h2>Избранное</h2>
        <p className="mt-2 text-muted-foreground">
          Работы, отмеченные сердечком. Покупку, оплату и доставку вы обсуждаете напрямую с художником в Telegram.
        </p>
        <Link href="/favorites" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
          Открыть избранное
        </Link>
      </div>
      <div className="mt-4 rounded-sm border border-border bg-card p-6">
        <h2>Хотите продавать картины?</h2>
        <p className="mt-2 text-muted-foreground">Расскажите о себе, и после проверки вы сможете выставлять свои работы.</p>
        <Link href="/become-seller" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
          Подать заявку продавца
        </Link>
      </div>
    </main>
  );
}
