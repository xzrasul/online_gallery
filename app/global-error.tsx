'use client';

import { useEffect } from 'react';

// Replaces the root layout when it fails, so it brings its own <html>/<body>
// and uses inline styles only (no Tailwind/shadcn: the stylesheet may be gone too).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6f2ec',
          color: '#2b2622',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <main style={{ maxWidth: 448, padding: '40px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, margin: 0 }}>Что-то пошло не так</h1>
          <p style={{ marginTop: 12, opacity: 0.7 }}>
            Не удалось загрузить страницу. Попробуйте ещё раз чуть позже.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              background: '#2b2622',
              color: '#f6f2ec',
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            Попробовать снова
          </button>
        </main>
      </body>
    </html>
  );
}
