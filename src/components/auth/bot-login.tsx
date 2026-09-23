'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

type State =
  | { step: 'idle' }
  | { step: 'starting' }
  | { step: 'waiting'; botUrl: string }
  | { step: 'expired' }
  | { step: 'error' };

const POLL_INTERVAL_MS = 2000;

// Sign in via the bot: open t.me/<bot>?start=<token>, press "Confirm" in the
// bot, and this page picks the confirmation up by polling.
export function BotLogin({ botUsername }: { botUsername: string }) {
  const [state, setState] = useState<State>({ step: 'idle' });

  const start = useCallback(async () => {
    setState({ step: 'starting' });
    try {
      const res = await fetch('/auth/bot/start', { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      const { botUrl } = (await res.json()) as { botUrl: string };
      setState({ step: 'waiting', botUrl });
    } catch {
      setState({ step: 'error' });
    }
  }, []);

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
        <a
          href={state.botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: 'lg' }), 'w-full bg-[#229ED9] text-white hover:bg-[#1c8cc2]')}
        >
          <Send aria-hidden="true" />
          Открыть @{botUsername}
        </a>
        <ol className="grid gap-1 text-left text-sm text-muted-foreground">
          <li>1. В Telegram нажмите «Запустить» (Start).</li>
          <li>2. Нажмите «✅ Подтвердить вход».</li>
          <li>3. Вернитесь сюда — вход выполнится автоматически.</li>
        </ol>
        <p role="status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Ждём подтверждения в Telegram…
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {state.step === 'expired' && (
        <p role="alert" className="rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
          Время на подтверждение истекло. Попробуйте ещё раз.
        </p>
      )}
      {state.step === 'error' && (
        <p
          role="alert"
          className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Не удалось начать вход. Попробуйте ещё раз.
        </p>
      )}
      <Button
        type="button"
        size="lg"
        onClick={start}
        disabled={state.step === 'starting'}
        className="w-full bg-[#229ED9] text-white hover:bg-[#1c8cc2]"
      >
        {state.step === 'starting' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        Войти через Telegram
      </Button>
    </div>
  );
}
