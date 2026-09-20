import Link from 'next/link';

const LINKS = [
  { href: '/admin/sellers', label: 'Заявки продавцов' },
  { href: '/admin/artworks', label: 'Картины на модерации' },
  { href: '/admin/categories', label: 'Категории' },
  { href: '/admin/techniques', label: 'Техники' },
];

export function AdminNav() {
  return (
    <nav aria-label="Разделы админки" className="mb-8 flex flex-nowrap gap-2 overflow-x-auto sm:flex-wrap">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:border-brand hover:text-brand"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
