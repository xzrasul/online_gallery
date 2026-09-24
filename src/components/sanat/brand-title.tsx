import type { CSSProperties } from 'react';

const letters = (word: string, from: number) =>
  word.split('').map((c, i) => (
    <span key={i} className="ch" aria-hidden="true" style={{ '--i': from + i } as CSSProperties}>
      {c}
    </span>
  ));

// "sanatplace", letter by letter: each one turns, scales and unblurs in turn;
// now and then a glint runs across the gold "place". The glint is a window with
// a bright copy of the word sliding across it (the window moves one way, the
// copy inside moves back), so it is all transforms and costs no repaints.
export function BrandTitle() {
  return (
    <h1 className="brand" aria-label="sanatplace">
      {letters('sanat', 0)}
      <em aria-hidden="true">
        {letters('place', 5)}
        <span className="sheen">
          <span className="sheen-in">
            {'place'.split('').map((c, i) => (
              <span key={i} className="sc-ch">
                {c}
              </span>
            ))}
          </span>
        </span>
      </em>
    </h1>
  );
}
