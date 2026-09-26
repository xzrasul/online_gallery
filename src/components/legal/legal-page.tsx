import Link from 'next/link';
import type { ReactNode } from 'react';
import { LEGAL_DOCS, LEGAL_UPDATED } from '@/src/lib/legal';

// The frame of every legal document: breadcrumbs, title, revision date, the
// text, and links to the other documents.
export function LegalPage({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <main>
      <div className="wrap stack pg">
        <nav className="crumbs" aria-label="Путь">
          <Link href="/">Главная</Link>
          <span aria-hidden="true">/</span>
          <span>{title}</span>
        </nav>
        <article className="panel doc">
          <h1>{title}</h1>
          <p className="doc-date">Редакция от {LEGAL_UPDATED}</p>
          {children}
          <nav className="doc-others" aria-label="Другие документы">
            <h2>Другие документы</h2>
            <ul>
              {LEGAL_DOCS.filter((d) => d.href !== href).map((d) => (
                <li key={d.href}>
                  <Link href={d.href}>{d.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </div>
    </main>
  );
}
