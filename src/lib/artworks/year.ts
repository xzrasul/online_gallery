// The optional "year painted" form field: empty is null, anything else must be
// a plausible year; `undefined` means the value is invalid.
export function parseYear(value: FormDataEntryValue | null): number | null | undefined {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  const year = Number(raw);
  if (!Number.isInteger(year) || year < 1000 || year > new Date().getFullYear()) return undefined;
  return year;
}

// "Масло, 1889", or just the technique when the year is unknown.
export function techniqueAndYear(technique?: string | null, year?: number | null) {
  return [technique, year].filter(Boolean).join(', ');
}
