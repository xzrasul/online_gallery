import { isUuid } from '../gallery/types';

// The admin's banner form, parsed and checked. Images are handled separately
// (they are files); this covers the text fields.

export const BANNER_LIMITS = { title: 120, eyebrow: 60, subtitle: 200, label: 40, url: 500 } as const;
export const DEFAULT_OVERLAY = 45;
// Dushanbe (UTC+5): used when the browser did not send its own offset.
const DEFAULT_TZ_OFFSET_MIN = -300;

export type BannerFields = {
  title: string;
  eyebrow: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  button2Label: string | null;
  button2Url: string | null;
  artworkId: string | null;
  overlay: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type BannerFormError =
  | 'title'
  | 'eyebrow'
  | 'subtitle'
  | 'button'
  | 'button2'
  | 'url'
  | 'artwork'
  | 'overlay'
  | 'dates';

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
};
const orNull = (s: string) => (s ? s : null);

// A link on the site ("/gallery?…") or a full http(s) address. Not "//host",
// not javascript: and the like.
export function isSafeLink(url: string): boolean {
  if (url.startsWith('/')) return !url.startsWith('//') && !url.startsWith('/\\');
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

// <input type="datetime-local"> sends wall-clock time; `offsetMin` is the
// browser's Date#getTimezoneOffset(), so the stored moment is the one the admin meant.
export function parseLocalDateTime(value: string, offsetMin: number): Date | null | undefined {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return undefined;
  const [, y, mo, d, h, mi] = m.map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi) + offsetMin * 60_000;
  return Number.isFinite(utc) ? new Date(utc) : undefined;
}

// The reverse, for the edit form's default value.
export function toLocalDateTime(date: Date | null, offsetMin = DEFAULT_TZ_OFFSET_MIN): string {
  if (!date) return '';
  const local = new Date(date.getTime() - offsetMin * 60_000);
  return local.toISOString().slice(0, 16);
}

export function parseBannerForm(form: FormData): { ok: true; fields: BannerFields } | { ok: false; error: BannerFormError } {
  const title = text(form, 'title');
  if (!title || title.length > BANNER_LIMITS.title) return { ok: false, error: 'title' };
  const eyebrow = text(form, 'eyebrow');
  if (eyebrow.length > BANNER_LIMITS.eyebrow) return { ok: false, error: 'eyebrow' };
  const subtitle = text(form, 'subtitle');
  if (subtitle.length > BANNER_LIMITS.subtitle) return { ok: false, error: 'subtitle' };

  const artworkId = text(form, 'artworkId');
  if (artworkId && !isUuid(artworkId)) return { ok: false, error: 'artwork' };

  const buttonLabel = text(form, 'buttonLabel');
  const buttonUrl = text(form, 'buttonUrl');
  const button2Label = text(form, 'button2Label');
  const button2Url = text(form, 'button2Url');
  for (const s of [buttonLabel, button2Label]) if (s.length > BANNER_LIMITS.label) return { ok: false, error: 'button' };
  for (const u of [buttonUrl, button2Url]) {
    if (u.length > BANNER_LIMITS.url || (u && !isSafeLink(u))) return { ok: false, error: 'url' };
  }
  // a button needs somewhere to go; the first one may go to the linked artwork
  if (buttonLabel && !buttonUrl && !artworkId) return { ok: false, error: 'button' };
  if (Boolean(button2Label) !== Boolean(button2Url)) return { ok: false, error: 'button2' };

  const overlayRaw = text(form, 'overlay');
  const overlay = overlayRaw === '' ? DEFAULT_OVERLAY : Number(overlayRaw);
  if (!Number.isInteger(overlay) || overlay < 0 || overlay > 80) return { ok: false, error: 'overlay' };

  const tz = Number(text(form, 'tzOffset'));
  const offset = text(form, 'tzOffset') !== '' && Number.isInteger(tz) && Math.abs(tz) <= 14 * 60 ? tz : DEFAULT_TZ_OFFSET_MIN;
  const startsAt = parseLocalDateTime(text(form, 'startsAt'), offset);
  const endsAt = parseLocalDateTime(text(form, 'endsAt'), offset);
  if (startsAt === undefined || endsAt === undefined) return { ok: false, error: 'dates' };
  if (startsAt && endsAt && endsAt <= startsAt) return { ok: false, error: 'dates' };

  return {
    ok: true,
    fields: {
      title,
      eyebrow: orNull(eyebrow),
      subtitle: orNull(subtitle),
      buttonLabel: orNull(buttonLabel),
      buttonUrl: orNull(buttonUrl),
      button2Label: orNull(button2Label),
      button2Url: orNull(button2Url),
      artworkId: orNull(artworkId),
      overlay,
      isActive: form.get('isActive') === 'on',
      startsAt,
      endsAt,
    },
  };
}

export const BANNER_ERRORS: Record<BannerFormError | 'image' | 'upload' | 'too_many_active' | 'not_found', string> = {
  title: `Заполните заголовок (до ${BANNER_LIMITS.title} символов).`,
  eyebrow: `Надпись над заголовком — до ${BANNER_LIMITS.eyebrow} символов.`,
  subtitle: `Подзаголовок — до ${BANNER_LIMITS.subtitle} символов.`,
  button: 'У первой кнопки должна быть ссылка или выбранная картина; подпись — до 40 символов.',
  button2: 'У второй кнопки нужны и подпись, и ссылка (или оставьте оба поля пустыми).',
  url: 'Ссылка должна начинаться с «/» (страница сайта) или с https://.',
  artwork: 'Выберите картину из списка.',
  overlay: 'Затемнение — число от 0 до 80.',
  dates: 'Проверьте даты показа: окончание должно быть позже начала.',
  image: 'Не удалось прочитать изображение. Загрузите JPEG, PNG или WebP.',
  upload: 'Не удалось сохранить изображение. Попробуйте ещё раз чуть позже.',
  too_many_active: 'Активных баннеров может быть не больше 8. Выключите один из них.',
  not_found: 'Баннер не найден: возможно, его уже удалили.',
};
