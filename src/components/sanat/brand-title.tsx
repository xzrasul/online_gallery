import type { CSSProperties } from 'react';

const letters = (word: string, from: number) =>
  word.split('').map((c, i) => (
    <span key={i} className="ch" aria-hidden="true" style={{ '--i': from + i } as CSSProperties}>
      {c}
    </span>
  ));

// "sanatplace", letter by letter: each one turns, scales and unblurs in turn;
// a glint now and then runs across the gold "place".
export function BrandTitle() {
  return (
    <h1 className="brand" aria-label="sanatplace">
      {letters('sanat', 0)}
      <em aria-hidden="true">{letters('place', 5)}</em>
    </h1>
  );
}
