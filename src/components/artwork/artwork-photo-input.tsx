'use client';

import { useState, type ChangeEvent } from 'react';
import { Input } from '@/src/components/ui/input';
import { MAX_UPLOAD_BYTES, shrinkPhoto } from '@/src/lib/uploads/shrink-photo';

type Status = { kind: 'idle' } | { kind: 'working' } | { kind: 'ready'; text: string } | { kind: 'error'; text: string };

const mb = (bytes: number) => (bytes / 1024 / 1024).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

// The artwork photo field. A chosen photo is shrunk in the browser before the
// form is sent (the form can't be submitted while that runs), and the field
// says what will be uploaded.
export function ArtworkPhotoInput({
  required,
  name = 'image',
  maxSide,
}: {
  required: boolean;
  name?: string;
  maxSide?: number;
}) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.setCustomValidity('');
    if (!file) return setStatus({ kind: 'idle' });

    input.setCustomValidity('Подождите, фото готовится');
    setStatus({ kind: 'working' });
    const shrunk = await shrinkPhoto(file, maxSide).catch(() => null);
    input.setCustomValidity('');

    const chosen = shrunk?.file ?? file;
    if (shrunk && chosen !== file) {
      const list = new DataTransfer();
      list.items.add(chosen);
      input.files = list.files;
    }
    if (chosen.size > MAX_UPLOAD_BYTES) {
      input.value = '';
      return setStatus({
        kind: 'error',
        text: `Фото слишком большое (${mb(chosen.size)} МБ). Выберите файл до ${mb(MAX_UPLOAD_BYTES)} МБ или в формате JPG.`,
      });
    }
    setStatus({
      kind: 'ready',
      text: shrunk
        ? `Фото готово: ${shrunk.width}×${shrunk.height}, ${Math.round(chosen.size / 1024)} КБ`
        : `Фото выбрано: ${Math.round(chosen.size / 1024)} КБ`,
    });
  };

  return (
    <>
      <Input type="file" name={name} accept="image/*" required={required} onChange={onChange} />
      {status.kind === 'working' && (
        <span role="status" className="text-sm text-muted-foreground">
          Готовим фото…
        </span>
      )}
      {status.kind === 'ready' && (
        <span role="status" className="text-sm text-muted-foreground">
          {status.text}
        </span>
      )}
      {status.kind === 'error' && (
        <span role="alert" className="text-sm text-destructive">
          {status.text}
        </span>
      )}
    </>
  );
}
