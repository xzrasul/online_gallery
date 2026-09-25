import Link from 'next/link';
import type { ReactNode } from 'react';
import type { HeroSlide } from '@/src/lib/home/banners';

// A banner slide's picture and text; shared by the home page and the admin's
// live preview. Links to other sites open in a new tab.
export function SlideBody({ slide, picture }: { slide: Omit<HeroSlide, 'id'>; picture: ReactNode }) {
  return (
    <>
      {picture}
      <div className="hero-in">
        {slide.eyebrow && <p className="hero-eyebrow">{slide.eyebrow}</p>}
        <h2 className="hero-t">{slide.title}</h2>
        {slide.subtitle && (
          <p className="hero-sub">
            <span>{slide.subtitle}</span>
          </p>
        )}
        {slide.buttons.length > 0 && (
          <div className="hero-cta">
            {slide.buttons.map((b) =>
              b.href.startsWith('/') ? (
                <Link key={b.label + b.href} className="btn ghost" href={b.href}>
                  {b.label}
                </Link>
              ) : (
                <a key={b.label + b.href} className="btn ghost" href={b.href} target="_blank" rel="noopener noreferrer">
                  {b.label}
                </a>
              ),
            )}
          </div>
        )}
      </div>
    </>
  );
}
