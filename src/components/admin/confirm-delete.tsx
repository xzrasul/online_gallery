'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';

// A delete button that asks once more in place: the first press turns it into
// "Точно удалить?" with a "Нет" next to it (for a few seconds).
export function ConfirmDelete({
  action,
  id,
  label = 'Удалить',
  what,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  what: string;
}) {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!asking) return;
    const t = window.setTimeout(() => setAsking(false), 6000);
    return () => window.clearTimeout(t);
  }, [asking]);

  if (!asking) {
    return (
      <Button type="button" variant="outline" onClick={() => setAsking(true)} aria-label={`${label}: ${what}`}>
        {label}
      </Button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" autoFocus aria-label={`Точно удалить: ${what}`}>
        Точно удалить?
      </Button>
      <Button type="button" variant="ghost" onClick={() => setAsking(false)}>
        Нет
      </Button>
    </form>
  );
}
