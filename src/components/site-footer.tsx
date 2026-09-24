import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { BRAND_NAME } from '@/src/lib/brand';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <KoshinBand />
      <div className="wrap">
        © {new Date().getFullYear()} {BRAND_NAME} — место для искусства
      </div>
    </footer>
  );
}
