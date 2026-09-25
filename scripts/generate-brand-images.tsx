import { readFile, writeFile } from 'node:fs/promises';
import React from 'react';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

// Renders the site icon, the Apple touch icon and the link-preview card in the
// light sage style. Run once after a brand change:
//   npx tsx scripts/generate-brand-images.tsx <Cormorant-500.ttf> <Cormorant-500-italic.ttf>
const SAGE = '#617f6c';
const SAGE_L = '#eaeeea';
const INK = '#232a25';

async function main() {
  const [regularPath, italicPath] = process.argv.slice(2);
  if (!regularPath || !italicPath) throw new Error('Pass the Cormorant Garamond 500 and 500 italic .ttf files');
  const fonts = [
    { name: 'Cormorant', data: await readFile(regularPath), weight: 500 as const, style: 'normal' as const },
    { name: 'Cormorant', data: await readFile(italicPath), weight: 500 as const, style: 'italic' as const },
  ];
  const render = async (node: React.ReactElement, width: number, height: number) =>
    Buffer.from(await new ImageResponse(node, { width, height, fonts }).arrayBuffer());

  // the monogram: "s" upright, "p" in pale green italics, on sage
  const icon = (size: number) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: SAGE,
        color: '#fff',
        fontFamily: 'Cormorant',
        fontSize: size * 0.62,
        lineHeight: 1,
        paddingBottom: size * 0.08,
      }}
    >
      <span>s</span>
      <span style={{ fontStyle: 'italic', color: '#dfeadf' }}>p</span>
    </div>
  );
  await writeFile('app/icon.png', await render(icon(512), 512, 512));
  await writeFile('app/apple-icon.png', await render(icon(180), 180, 180));

  const card = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: SAGE_L,
        color: INK,
        fontFamily: 'Cormorant',
      }}
    >
      <div style={{ display: 'flex', fontSize: 150, lineHeight: 1 }}>
        <span>sanat</span>
        <span style={{ fontStyle: 'italic', color: SAGE }}>place</span>
      </div>
      <div style={{ display: 'flex', marginTop: 34, fontSize: 50, fontStyle: 'italic', color: '#4b6656' }}>
        Картины прямо от художников
      </div>
      <div style={{ display: 'flex', width: 120, height: 2, marginTop: 40, background: SAGE }} />
    </div>
  );
  const png = await render(card, 1200, 630);
  await writeFile('app/opengraph-image.jpg', await sharp(png).jpeg({ quality: 88 }).toBuffer());
  console.log('Wrote app/icon.png, app/apple-icon.png, app/opengraph-image.jpg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
