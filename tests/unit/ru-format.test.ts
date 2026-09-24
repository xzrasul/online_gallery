import { describe, it, expect } from 'vitest';
import { plural, sinceMonth } from '../../src/lib/ru-format';

const WORKS: [string, string, string] = ['работа', 'работы', 'работ'];

describe('plural', () => {
  it.each([
    [1, 'работа'],
    [2, 'работы'],
    [4, 'работы'],
    [5, 'работ'],
    [11, 'работ'],
    [12, 'работ'],
    [14, 'работ'],
    [21, 'работа'],
    [22, 'работы'],
    [0, 'работ'],
    [111, 'работ'],
  ])('%i → %s', (n, word) => {
    expect(plural(n, WORKS)).toBe(word);
  });
});

describe('sinceMonth', () => {
  it('puts the month in the genitive case', () => {
    expect(sinceMonth(new Date('2026-09-24T10:00:00Z'))).toBe('с сентября 2026');
    expect(sinceMonth(new Date('2026-03-01T10:00:00Z'))).toBe('с марта 2026');
  });
});
