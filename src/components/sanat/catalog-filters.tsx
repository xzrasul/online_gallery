'use client';

import Form from 'next/form';
import Link from 'next/link';
import { useId, useState } from 'react';
import { cn } from '@/src/lib/utils';

type Option = { id: string; name: string };

// Collapsed by default: only the "Фильтры" row with a chevron. Applying the
// filters submits the same GET form as before (client-side), folds the panel
// and shows how many conditions are active next to the title.
export function CatalogFilters({
  categories,
  techniques,
  values,
  activeCount,
}: {
  categories: Option[];
  techniques: Option[];
  values: { categoryId?: string; techniqueId?: string; minPrice?: string; maxPrice?: string };
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();

  return (
    <div className={cn('panel fbox', open && 'open')}>
      <button
        className="ftoggle"
        type="button"
        aria-expanded={open}
        aria-controls={formId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ft-title">
          Фильтры
          {activeCount > 0 && (
            <span className="fcount">
              <span className="sr-only">выбрано условий: </span>
              {activeCount}
            </span>
          )}
        </span>
        <span className="fhint">категория · техника · цена</span>
        <span className="chev-w" aria-hidden="true">
          <svg className="chev" viewBox="0 0 24 24">
            <path
              d="M5 9l7 7 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div className="fwrap">
        <Form action="/gallery" className="filters" id={formId} aria-label="Фильтры" onSubmit={() => setOpen(false)}>
          <label className="field">
            <span>Категория</span>
            <select name="categoryId" defaultValue={values.categoryId ?? ''}>
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Техника</span>
            <select name="techniqueId" defaultValue={values.techniqueId ?? ''}>
              <option value="">Все техники</option>
              {techniques.map((technique) => (
                <option key={technique.id} value={technique.id}>
                  {technique.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Цена от</span>
            <input type="number" name="minPrice" min="0" inputMode="numeric" placeholder="0" defaultValue={values.minPrice ?? ''} />
          </label>
          <label className="field">
            <span>Цена до</span>
            <input type="number" name="maxPrice" min="0" inputMode="numeric" placeholder="10000" defaultValue={values.maxPrice ?? ''} />
          </label>
          <div className="filter-actions">
            <button className="btn" type="submit">
              Применить фильтры
            </button>
            {activeCount > 0 && (
              <Link href="/gallery" className="btn alt" onClick={() => setOpen(false)}>
                Сбросить
              </Link>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}
