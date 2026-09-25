import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { pagePreview, snippet } from '@/src/lib/seo';
import { getDb } from '@/src/db';
import { getArtistPublicProfile } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { plural, sinceMonth } from '@/src/lib/ru-format';
import { getCurrentUser } from '@/src/lib/auth/session';
import { likeInfoFor } from '@/src/lib/likes/likes';
import { isUuid, type CardArtwork } from '@/src/lib/gallery/types';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { HeartIcon } from '@/src/components/likes/like-button';

const WORKS: [string, string, string] = ['работа', 'работы', 'работ'];

type Profile = {
  name: string;
  info?: string;
  bio: string[];
  telegram?: string | null;
  available: CardArtwork[];
  sold: CardArtwork[];
};

// One lookup per request, shared by the page and its metadata. Only a uuid
// can reach the database.
const loadProfile = cache(async (id: string): Promise<Profile | undefined> => {
  if (!isUuid(id)) return undefined;
  const p = await getArtistPublicProfile(getDb(), id);
  if (!p) return undefined;
  const card = (a: (typeof p.artworks)[number]): CardArtwork => ({ ...a, sellerId: id, sellerDisplayName: p.displayName });
  return {
    name: p.displayName,
    info: p.joinedAt ? `На sanatplace ${sinceMonth(p.joinedAt)}` : undefined,
    bio: p.bio
      .split(/\n\s*\n|\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    telegram: p.telegramContact,
    available: p.artworks.filter((a) => a.status === 'published').map(card),
    sold: p.artworks.filter((a) => a.status === 'sold').map(card),
  };
});

// Link preview: the artist's name, bio, and their newest work on sale (or sold).
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const profile = await loadProfile((await params).id);
  if (!profile) return {};
  const title = `${profile.name} — художник`;
  const description = snippet(profile.bio.join(' '));
  const cover = profile.available[0] ?? profile.sold[0];
  return {
    title,
    description,
    ...pagePreview({ title, description, image: cover && { url: cover.imageUrl, alt: cover.title } }),
  };
}

export default async function ArtistPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await loadProfile(id);
  if (!profile) notFound();

  const viewer = await getCurrentUser();
  const works = [...profile.available, ...profile.sold];
  const likes = await likeInfoFor(
    getDb(),
    works.map((w) => ({ id: w.id, sellerId: id })),
    viewer?.id ?? null,
  );
  const totalLikes = Object.values(likes).reduce((sum, l) => sum + l.count, 0);
  const telegram = telegramHref(profile.telegram ?? null);
  const n = profile.available.length;

  return (
    <main>
      <div className="wrap stack pg">
        <nav className="crumbs" aria-label="Путь">
          <Link href="/">Главная</Link>
          <span aria-hidden="true">/</span>
          <Link href="/artists">Художники</Link>
          <span aria-hidden="true">/</span>
          <span>{profile.name}</span>
        </nav>

        <div className="panel prof">
          <div className="prof-head">
            <span className="avatar avatar-xl" aria-hidden="true">
              {profile.name.charAt(0).toUpperCase()}
            </span>
            <div className="prof-id">
              <h1 className="t">{profile.name}</h1>
              {profile.info && <p className="prof-info">{profile.info}</p>}
            </div>
          </div>
          <ul className="prof-stats" aria-label="Коротко о художнике">
            <li>
              <b>{n}</b>
              <span>
                {plural(n, WORKS)} в продаже
              </span>
            </li>
            {profile.sold.length > 0 && (
              <li>
                <b>{profile.sold.length}</b>
                <span>{plural(profile.sold.length, ['продана', 'проданы', 'продано'])}</span>
              </li>
            )}
            <li>
              <b>
                <HeartIcon />
                {totalLikes}
              </b>
              <span>{plural(totalLikes, ['лайк', 'лайка', 'лайков'])} всего</span>
            </li>
          </ul>
          {profile.bio.length > 0 && (
            <>
              <h2 className="sub">Биография</h2>
              <div className="bio">
                {profile.bio.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </>
          )}
          {telegram ? (
            <div className="contact">
              <a className="btn" href={telegram} target="_blank" rel="noopener noreferrer">
                Написать в Telegram
              </a>
              <span className="handle">{telegram.replace('https://t.me/', '@')}</span>
            </div>
          ) : (
            profile.telegram && <p className="contact handle">Telegram: {profile.telegram}</p>
          )}
        </div>

        <section className="sec" id="works" aria-labelledby="works-title">
          <div className="sec-head">
            <h2 id="works-title">Работы в продаже</h2>
            {n > 0 && (
              <p className="count">
                {n} {plural(n, WORKS)}
              </p>
            )}
          </div>
          {n === 0 ? (
            <p className="empty">Сейчас у художника нет работ в продаже.</p>
          ) : (
            <ArtworkGrid artworks={profile.available} likes={likes} />
          )}
        </section>

        {profile.sold.length > 0 && (
          <section className="sec" aria-labelledby="sold-title">
            <div className="sec-head">
              <h2 id="sold-title">Уже проданы</h2>
            </div>
            <p className="sold-note">Эти работы нашли своих владельцев. О похожей можно спросить художника.</p>
            <ArtworkGrid artworks={profile.sold} likes={likes} />
          </section>
        )}
      </div>
    </main>
  );
}
