import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getDb } from '@/src/db';
import { getArtistPublicProfile } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { plural, sinceMonth } from '@/src/lib/ru-format';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { KoshinBand } from '@/src/components/sanat/koshin-band';
import { Medal } from '@/src/components/sanat/mandala';

const WORKS: [string, string, string] = ['работа', 'работы', 'работ'];

// One query per request, shared by the page and its metadata.
const loadProfile = cache((id: string) => getArtistPublicProfile(getDb(), id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const profile = await loadProfile((await params).id);
  if (!profile) return {};
  const description = profile.bio.length > 160 ? `${profile.bio.slice(0, 157)}…` : profile.bio;
  return { title: `${profile.displayName} — художник`, description };
}

export default async function ArtistPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await loadProfile(id);
  if (!profile) notFound();

  const telegram = telegramHref(profile.telegramContact);
  const available = profile.artworks.filter((a) => a.status === 'published');
  const sold = profile.artworks.filter((a) => a.status === 'sold');
  const facts = [
    profile.joinedAt && `На sanatplace ${sinceMonth(profile.joinedAt)}`,
    available.length > 0 ? `${available.length} ${plural(available.length, WORKS)} в продаже` : 'Сейчас нет работ в продаже',
    sold.length > 0 && `${sold.length} ${plural(sold.length, ['продана', 'проданы', 'продано'])}`,
  ].filter(Boolean);

  return (
    <main>
      <KoshinBand />
      <div className="wrap stack">
        <Link className="btn alt sm back" href="/gallery">
          ← В каталог
        </Link>

        <div className="head-row">
          <div>
            <p className="eyebrow">Художник</p>
            <h1 className="t artist-name">{profile.displayName}</h1>
            <ul className="facts" aria-label="Коротко о художнике">
              {facts.map((fact) => (
                <li key={fact as string}>{fact}</li>
              ))}
            </ul>
          </div>
          <Medal size="sm" />
        </div>

        <div className="artist-info">
          <section className="panel" aria-labelledby="about-title">
            <h2 id="about-title" className="panel-title">
              О художнике
            </h2>
            <p className="bio">{profile.bio}</p>
          </section>

          <section className="panel buy" aria-labelledby="buy-title">
            <h2 id="buy-title" className="panel-title">
              Как купить работу
            </h2>
            <ol className="how">
              <li>
                <span className="how-n" aria-hidden="true">
                  1
                </span>
                <span>
                  Выберите картину {available.length > 0 ? 'из работ в продаже ниже.' : '— сейчас свободных работ нет, но можно спросить художника о новых.'}
                </span>
              </li>
              <li>
                <span className="how-n" aria-hidden="true">
                  2
                </span>
                <span>Напишите художнику в Telegram и назовите картину.</span>
              </li>
              <li>
                <span className="how-n" aria-hidden="true">
                  3
                </span>
                <span>Оплату и доставку вы обсуждаете с художником напрямую.</span>
              </li>
            </ol>
            {telegram ? (
              <div className="contact">
                <a className="btn" href={telegram} target="_blank" rel="noopener noreferrer">
                  Написать в Telegram
                </a>
                <span className="handle">{telegram.replace('https://t.me/', '@')}</span>
              </div>
            ) : profile.telegramContact ? (
              <p className="contact-note">Telegram: {profile.telegramContact}</p>
            ) : (
              <p className="contact-note">Художник пока не оставил контакт в Telegram.</p>
            )}
          </section>
        </div>

        <section className="panel" id="works" aria-labelledby="works-title">
          <div className="sec-head">
            <h2 id="works-title">Работы в продаже</h2>
            {available.length > 0 && (
              <span className="count">
                {available.length} {plural(available.length, WORKS)}
              </span>
            )}
          </div>
          {available.length === 0 ? (
            <p className="empty">Сейчас у художника нет работ в продаже.</p>
          ) : (
            <ArtworkGrid artworks={available} />
          )}
        </section>

        {sold.length > 0 && (
          <section className="panel" aria-labelledby="sold-title">
            <div className="sec-head">
              <h2 id="sold-title">Уже проданы</h2>
            </div>
            <p className="sold-note">Эти работы нашли своих владельцев. О похожей можно спросить художника.</p>
            <ArtworkGrid artworks={sold} />
          </section>
        )}
      </div>
    </main>
  );
}
