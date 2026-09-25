import { getImageProps } from 'next/image';
import Link from 'next/link';
import type { HeroSlide } from '@/src/lib/home/banners';
import { HeroCarousel } from './hero-carousel';
import { SlideBody } from './slide-body';

// Desktop 1920×900 and the portrait phone version 800×1200 (the phone gets the
// desktop picture when there is no portrait one). Only the first slide loads
// at once; the rest load lazily.
function SlidePicture({ slide, first }: { slide: HeroSlide; first: boolean }) {
  const common = { alt: '', sizes: '100vw', quality: 78, ...(first ? { priority: true } : { loading: 'lazy' as const }) };
  const desktop = getImageProps({ ...common, src: slide.imageUrl, width: 1920, height: 900 }).props;
  if (!slide.imageMobileUrl) {
    return (
      <picture>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from the props */}
        <img {...desktop} />
      </picture>
    );
  }
  const mobile = getImageProps({ ...common, src: slide.imageMobileUrl, width: 800, height: 1200 }).props;
  return (
    <picture>
      <source media="(min-width: 861px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from the props */}
      <img {...mobile} />
    </picture>
  );
}

// Shown while the admin has no active banner.
function FallbackSlide() {
  return (
    <div className="hero-in">
      <h2 className="hero-t">Картины прямо от художников</h2>
      <p className="hero-sub">
        <span>Санъат</span>
        <span className="fa" lang="fa" dir="rtl">
          صنعت
        </span>
      </p>
      <div className="hero-cta">
        <Link className="btn ghost" href="/gallery">
          Каталог
        </Link>
        <Link className="btn ghost" href="/artists">
          Художники
        </Link>
      </div>
    </div>
  );
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  if (slides.length === 0) {
    return (
      <HeroCarousel labels={['Картины прямо от художников']} overlays={[null]}>
        <FallbackSlide />
      </HeroCarousel>
    );
  }
  return (
    <HeroCarousel labels={slides.map((s) => s.title)} overlays={slides.map((s) => s.overlay)}>
      {slides.map((s, k) => (
        <SlideBody key={s.id} slide={s} picture={<SlidePicture slide={s} first={k === 0} />} />
      ))}
    </HeroCarousel>
  );
}
