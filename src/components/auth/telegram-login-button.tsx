'use client';

import { useEffect, useRef, useState } from 'react';

// Renders the official Telegram Login Widget. After confirming in Telegram the
// user is redirected to /auth/telegram with a signed profile in the query string.
export function TelegramLoginButton({ botUsername }: { botUsername: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.dataset.telegramLogin = botUsername;
    script.dataset.size = 'large';
    script.dataset.radius = '8';
    script.dataset.requestAccess = 'write';
    script.dataset.authUrl = `${window.location.origin}/auth/telegram`;
    script.onload = () => setLoaded(true);
    node.appendChild(script);
    return () => {
      node.replaceChildren();
    };
  }, [botUsername]);

  return (
    <div className="relative flex min-h-10 justify-center">
      {!loaded && (
        <div aria-hidden="true" className="absolute inset-x-0 mx-auto h-10 w-56 animate-pulse rounded-md bg-muted" />
      )}
      <div ref={container} />
    </div>
  );
}
