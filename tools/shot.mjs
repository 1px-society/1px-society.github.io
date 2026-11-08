// 스크린샷: node tools/shot.mjs <path> <out.png> [width] [height] [actions.json]
// actions: [{"fill": "#birth", "value": "20050315"}, {"click": "#go"}, {"wait": 1500}, {"eval": "..."}]
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { serve } from './serve.mjs';

const [path, out, w = '390', h = '844', actionsFile] = process.argv.slice(2);
const server = await serve(4811);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 2 });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(`http://127.0.0.1:4811${path}`, { waitUntil: 'networkidle' });
const actions = actionsFile ? JSON.parse(readFileSync(actionsFile, 'utf8')) : [];
for (const a of actions) {
  if (a.fill) await page.fill(a.fill, a.value);
  if (a.click) await page.click(a.click);
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.eval) logs.push(`eval: ${JSON.stringify(await page.evaluate(a.eval))}`);
  if (a.shot) await page.screenshot({ path: a.shot, fullPage: !!a.full });
}
await page.waitForTimeout(300);
await page.screenshot({ path: out, fullPage: true });
if (logs.length) console.log(logs.join('\n'));
await browser.close();
server.close();
