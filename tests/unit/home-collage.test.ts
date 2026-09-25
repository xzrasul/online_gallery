import { describe, it, expect } from 'vitest';
import { resolveCollage } from '../../src/lib/home/collage-slots';

const work = (id: string) => ({ id, title: `Работа ${id}`, imageUrl: `https://example.com/${id}.png` });

describe('resolveCollage', () => {
  it('shows the newest works when the admin has picked nothing', () => {
    const tiles = resolveCollage({}, [work('n1'), work('n2'), work('n3'), work('n4')]);
    expect(tiles.map((t) => [t.slot, t.id])).toEqual([
      ['a', 'n1'],
      ['b', 'n2'],
      ['c', 'n3'],
    ]);
  });

  it('puts picked works in their slots and fills the rest with the newest', () => {
    const tiles = resolveCollage({ b: work('p1') }, [work('n1'), work('n2')]);
    expect(tiles.map((t) => [t.slot, t.id])).toEqual([
      ['a', 'n1'],
      ['b', 'p1'],
      ['c', 'n2'],
    ]);
  });

  it('never shows a work twice when a picked work is also among the newest', () => {
    const tiles = resolveCollage({ a: work('n2') }, [work('n1'), work('n2'), work('n3')]);
    expect(tiles.map((t) => [t.slot, t.id])).toEqual([
      ['a', 'n2'],
      ['b', 'n1'],
      ['c', 'n3'],
    ]);
  });

  it('leaves out slots it cannot fill', () => {
    expect(resolveCollage({}, [work('n1')]).map((t) => t.slot)).toEqual(['a']);
    expect(resolveCollage({}, [])).toEqual([]);
  });
});
