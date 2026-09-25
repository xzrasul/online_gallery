import { describe, it, expect } from 'vitest';
import { isSafeLink, parseBannerForm, parseLocalDateTime, toLocalDateTime } from '../../src/lib/home/banner-form';
import { slideOf, type Banner } from '../../src/lib/home/banners';
import { techniqueAndYear, parseYear } from '../../src/lib/artworks/year';

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe('isSafeLink', () => {
  it('allows site paths and http(s) addresses', () => {
    expect(isSafeLink('/gallery?categoryId=1')).toBe(true);
    expect(isSafeLink('https://t.me/sanatplace')).toBe(true);
  });
  it('refuses protocol-relative and script links', () => {
    expect(isSafeLink('//evil.example')).toBe(false);
    expect(isSafeLink('/\\evil.example')).toBe(false);
    expect(isSafeLink('javascript:alert(1)')).toBe(false);
    expect(isSafeLink('gallery')).toBe(false);
  });
});

describe('parseLocalDateTime', () => {
  it('turns Dushanbe wall-clock time (UTC+5, offset -300) into the right moment', () => {
    expect(parseLocalDateTime('2026-10-01T09:30', -300)?.toISOString()).toBe('2026-10-01T04:30:00.000Z');
  });
  it('is empty for an empty field and invalid for garbage', () => {
    expect(parseLocalDateTime('', -300)).toBeNull();
    expect(parseLocalDateTime('tomorrow', -300)).toBeUndefined();
  });
  it('round-trips with toLocalDateTime', () => {
    const d = parseLocalDateTime('2026-12-31T23:59', -300)!;
    expect(toLocalDateTime(d, -300)).toBe('2026-12-31T23:59');
  });
});

describe('parseBannerForm', () => {
  it('reads a full banner', () => {
    const r = parseBannerForm(
      form({
        title: ' Осенняя выставка ',
        eyebrow: 'Новое',
        buttonLabel: 'Смотреть',
        buttonUrl: '/gallery',
        overlay: '60',
        isActive: 'on',
        startsAt: '2026-10-01T00:00',
        endsAt: '2026-10-10T00:00',
        tzOffset: '-300',
      }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fields).toMatchObject({ title: 'Осенняя выставка', eyebrow: 'Новое', overlay: 60, isActive: true, subtitle: null });
    expect(r.fields.startsAt?.toISOString()).toBe('2026-09-30T19:00:00.000Z');
  });
  it('defaults the overlay to 45 and "active" to off when unchecked', () => {
    const r = parseBannerForm(form({ title: 'A' }));
    expect(r).toMatchObject({ ok: true, fields: { overlay: 45, isActive: false } });
  });
  it('needs a title', () => {
    expect(parseBannerForm(form({ title: '  ' }))).toEqual({ ok: false, error: 'title' });
  });
  it('refuses unsafe links, half-filled second buttons and a bad overlay', () => {
    expect(parseBannerForm(form({ title: 'A', buttonLabel: 'x', buttonUrl: 'javascript:1' }))).toEqual({ ok: false, error: 'url' });
    expect(parseBannerForm(form({ title: 'A', button2Label: 'x' }))).toEqual({ ok: false, error: 'button2' });
    expect(parseBannerForm(form({ title: 'A', overlay: '95' }))).toEqual({ ok: false, error: 'overlay' });
  });
  it('lets the first button go to the linked artwork without a URL', () => {
    const r = parseBannerForm(form({ title: 'A', buttonLabel: 'Смотреть', artworkId: 'b583e906-b6e9-427b-b079-0d1e2c23dd86' }));
    expect(r.ok).toBe(true);
    expect(parseBannerForm(form({ title: 'A', buttonLabel: 'Смотреть' }))).toEqual({ ok: false, error: 'button' });
  });
  it('wants the show window to end after it starts', () => {
    expect(parseBannerForm(form({ title: 'A', startsAt: '2026-10-02T00:00', endsAt: '2026-10-01T00:00' }))).toEqual({
      ok: false,
      error: 'dates',
    });
  });
});

describe('slideOf', () => {
  const base: Banner = {
    id: 'x',
    imageUrl: 'https://a/b.webp',
    imageMobileUrl: null,
    eyebrow: null,
    title: 'T',
    subtitle: null,
    buttonLabel: null,
    buttonUrl: '/gallery',
    button2Label: 'Художники',
    button2Url: '/artists',
    artworkId: null,
    overlay: 45,
    sortOrder: 0,
    isActive: true,
    startsAt: null,
    endsAt: null,
    createdAt: new Date(),
  };
  it('sends the first button to the linked artwork when there is one', () => {
    expect(slideOf({ ...base, artworkId: 'w1' }).buttons[0]).toEqual({ label: 'Смотреть картину', href: '/gallery/artwork/w1' });
  });
  it('keeps both buttons', () => {
    expect(slideOf(base).buttons).toEqual([
      { label: 'Смотреть картину', href: '/gallery' },
      { label: 'Художники', href: '/artists' },
    ]);
  });
});

describe('artwork year', () => {
  it('parses an optional year', () => {
    expect(parseYear('')).toBeNull();
    expect(parseYear('1889')).toBe(1889);
    expect(parseYear('99')).toBeUndefined();
    expect(parseYear(String(new Date().getFullYear() + 1))).toBeUndefined();
  });
  it('writes "technique, year" or just the technique', () => {
    expect(techniqueAndYear('Масло', 1889)).toBe('Масло, 1889');
    expect(techniqueAndYear('Масло', null)).toBe('Масло');
  });
});
