import Link from 'next/link';
import { getDb } from '@/src/db';
import { listPublicArtists } from '@/src/lib/artworks/public-queries';
import { plural, sinceMonth } from '@/src/lib/ru-format';
import { ArtistAvatar } from '@/src/components/sanat/artist-avatar';

export const metadata = {
  title: 'Художники',
  description: 'Художники sanatplace: откройте страницу автора, чтобы узнать о нём и увидеть все его работы.',
};

const WORKS: [string, string, string] = ['работа', 'работы', 'работ'];

// Every artist on the site; a card opens the artist's own page.
export default async function ArtistsPage() {
  const real = await listPublicArtists(getDb());
  const artists = real.map((a) => ({
    id: a.id,
    name: a.displayName,
    info: a.joinedAt ? `На sanatplace ${sinceMonth(a.joinedAt)}` : 'Художник sanatplace',
    avatarUrl: a.avatarUrl,
    works: a.works,
    from: a.minPrice,
  }));

  return (
    <main>
      <div className="wrap stack pg">
        <div className="head-row">
          <h1 className="t">Художники</h1>
          <p className="count">
            {artists.length} {plural(artists.length, ['художник', 'художника', 'художников'])}
          </p>
        </div>
        <ul className="artists-grid">
          {artists.map((a) => (
            <li key={a.id}>
              <Link className="artist" href={`/gallery/artist/${a.id}`}>
                <div className="row">
                  <ArtistAvatar name={a.name} url={a.avatarUrl} />
                  <div>
                    <h2>{a.name}</h2>
                    <p>{a.info}</p>
                  </div>
                </div>
                <p>
                  {a.works > 0 ? `${a.works} ${plural(a.works, WORKS)}${a.from ? ` · от ${a.from} TJS` : ''}` : 'Пока нет работ в продаже'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
