'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type State =
  | { step: 'idle' }
  | { step: 'starting' }
  | { step: 'waiting'; botUrl: string }
  | { step: 'expired' }
  | { step: 'error' };

const POLL_INTERVAL_MS = 2000;

// Sign in via the bot: open t.me/<bot>?start=<token>, press "Confirm" in the
// bot, and this page picks the confirmation up by polling. `next` is where to
// return afterwards (validated again on the server).
export function BotLogin({ botUsername, next }: { botUsername: string; next?: string | null }) {
  const [state, setState] = useState<State>({ step: 'idle' });

  const start = useCallback(async () => {
    setState({ step: 'starting' });
    try {
      const res = await fetch('/auth/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next: next ?? null }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { botUrl } = (await res.json()) as { botUrl: string };
      setState({ step: 'waiting', botUrl });
    } catch {
      setState({ step: 'error' });
    }
  }, [next]);

  useEffect(() => {
    if (state.step !== 'waiting') return;
    let stopped = false;

    const poll = async () => {
      try {
        const res = await fetch('/auth/bot/poll', { method: 'POST' });
        const data = (await res.json()) as { status: string; redirect?: string };
        if (stopped) return;
        if (data.status === 'done' && data.redirect) {
          stopped = true;
          window.location.assign(data.redirect);
        } else if (data.status === 'expired') {
          stopped = true;
          setState({ step: 'expired' });
        }
      } catch {
        // Network hiccup: the next tick retries.
      }
    };

    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    // Returning from the Telegram app should feel instant.
    const onVisible = () => document.visibilityState === 'visible' && poll();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state]);

  if (state.step === 'waiting') {
    return (
      <div className="grid gap-4">
        <span className="halo wide">
          <a href={state.botUrl} target="_blank" rel="noopener noreferrer" className="btn wide">
            Открыть @{botUsername}
          </a>
        </span>
        <ol className="steps">
          <li>1. В Telegram нажмите «Запустить» (Start).</li>
          <li>2. Нажмите «✅ Подтвердить вход».</li>
          <li>3. Вернитесь сюда — вход выполнится автоматически.</li>
        </ol>
        <p role="status" className="flex items-center justify-center gap-2 text-sm text-ink-2">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Ждём подтверждения в Telegram…
        </p>
      </div>
    );
  }

  return (
    <div>
      {state.step === 'expired' && (
        <p role="alert" className="notice">
          Время на подтверждение истекло. Попробуйте ещё раз.
        </p>
      )}
      {state.step === 'error' && (
        <p role="alert" className="notice err">
          Не удалось начать вход. Попробуйте ещё раз.
        </p>
      )}
      <span className="halo wide">
        <button type="button" onClick={start} disabled={state.step === 'starting'} className="btn wide">
          {state.step === 'starting' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Войти через Telegram
        </button>
      </span>
    </div>
  );
}
