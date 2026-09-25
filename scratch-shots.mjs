import { chromium } from '@playwright/test';
const OUT = '/home/xzrasul/.claude/jobs/dc81f3af/tmp/';
const browser = await chromium.launch();
for (const [w, h, tag] of [[1400, 900, 'd'], [390, 844, 'm']]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const p of ['/', '/gallery', '/artists']) {
    await page.goto('http://localhost:3057' + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.screenshot({ path: `${OUT}r${tag}${p.replace(/\W+/g, '_')}.png` });
    console.log(tag, p, 'overflow', overflow);
  }
  console.log('errors', errors);
}
await browser.close();
