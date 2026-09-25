// The fixed painted background behind every page: brush strokes like feathers
// or leaves, darkened by a veil (see .bg::after) so text stays readable. The
// tall crop is for phones and narrow windows.
export function Backdrop() {
  return (
    <div className="bg" aria-hidden="true">
      <picture>
        <source media="(max-width: 860px)" srcSet="/bg/paint-mobile.webp" />
        <img id="bg-img" src="/bg/paint-desktop.webp" alt="" width={1600} height={900} decoding="async" fetchPriority="high" />
      </picture>
    </div>
  );
}
