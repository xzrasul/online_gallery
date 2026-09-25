// What an artwork card needs.
export type CardArtwork = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerId?: string;
  sellerDisplayName?: string;
  status?: string;
};

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: string | undefined): id is string => Boolean(id && UUID.test(id));
