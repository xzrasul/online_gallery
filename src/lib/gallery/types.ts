// What an artwork card needs, whether the work comes from the database or is a
// showcase («макет») piece.
export type CardArtwork = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerId?: string;
  sellerDisplayName?: string;
  status?: string;
  /** A showcase piece: made-up price and stock, shown with a «макет» badge. */
  mock?: boolean;
  /** object-position for the card crop. */
  focus?: string;
};

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: string | undefined): id is string => Boolean(id && UUID.test(id));
