// Russian wording helpers for counts and dates.

// plural(3, ['работа', 'работы', 'работ']) → 'работы'
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10,
    mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

// sinceMonth(new Date('2026-09-24')) → 'с сентября 2026'. The month is taken
// from a day-month format, which Russian puts in the genitive case.
export function sinceMonth(date: Date): string {
  const month = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Asia/Dushanbe' })
    .formatToParts(date)
    .find((p) => p.type === 'month')?.value;
  const year = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', timeZone: 'Asia/Dushanbe' }).format(date);
  return `с ${month} ${year}`;
}
