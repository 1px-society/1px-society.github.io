// 영상 속 화면 이미지를 뽑아 블록월드 프로젝트의 assets/photos에 저장한다.
//   node tools/video-screens.mjs <projects/<id>/assets/photos 경로> [tools 안의 페이지, 기본 video-screens.html]
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve } from './serve.mjs';

const out = process.argv[2];
const pageName = process.argv[3] || 'video-screens.html';
if (!out) throw new Error('usage: node tools/video-screens.mjs <photos dir> [page]');
await mkdir(out, { recursive: true });
const server = await serve(4813);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:4813/tools/${pageName}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 60000 });
const screens = await page.evaluate(() => window.SCREENS);
await page.screenshot({ path: join(out, '..', `${pageName.replace('.html', '')}-sheet.png`), fullPage: true });
await browser.close();
server.close();
for (const [name, url] of Object.entries(screens)) await writeFile(join(out, `${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
console.log(Object.keys(screens).join(' '));
