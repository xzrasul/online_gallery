// The home page collage: one tall picture (a) and two square ones (b, c).
export const COLLAGE_SLOTS = ['a', 'b', 'c'] as const;
export type CollageSlot = (typeof COLLAGE_SLOTS)[number];

export const COLLAGE_SLOT_LABELS: Record<CollageSlot, string> = {
  a: 'Большая',
  b: 'Малая 1',
  c: 'Малая 2',
};

export const isCollageSlot = (value: string): value is CollageSlot =>
  (COLLAGE_SLOTS as readonly string[]).includes(value);

export type CollageWork = { id: string; title: string; imageUrl: string };
export type CollageTile = CollageWork & { slot: CollageSlot };

// The admin's picks go to their slots; every slot left empty gets the newest
// work that is not on the collage yet, so it is never short while works exist.
export function resolveCollage(
  picks: Partial<Record<CollageSlot, CollageWork>>,
  newest: CollageWork[],
): CollageTile[] {
  const used = new Set(Object.values(picks).map((w) => w.id));
  const spare = newest.filter((w) => !used.has(w.id));
  const tiles: CollageTile[] = [];
  for (const slot of COLLAGE_SLOTS) {
    const work = picks[slot] ?? spare.shift();
    if (work) tiles.push({ ...work, slot });
  }
  return tiles;
}
