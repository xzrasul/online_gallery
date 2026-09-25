import type { ReactNode } from 'react';

// Pinned to the bottom of the artwork page: the price on the left, the way to
// reach the artist on the right. While it is on screen the burger button moves
// up out of its way (see html:has(.buybar) in the styles).
export function BuyBar({ price, children }: { price: ReactNode; children: ReactNode }) {
  return (
    <div className="buybar">
      <div className="wrap buybar-in">
        <p className="buybar-price">{price}</p>
        {children}
      </div>
    </div>
  );
}
