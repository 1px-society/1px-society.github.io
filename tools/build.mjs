// 배포 파일 만들기: node tools/build.mjs
//   unse/app.min.js      페이지 스크립트 번들(esbuild)
//   unse/og/*.png        OG 미리보기(기본 + 일주 60개)와 아이콘
//   unse/r/<id>/index.html  친구에게 보내는 결과 링크 페이지(일주별 OG)
import { chromium } from 'playwright-core';
import * as esbuild from 'esbuild';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { serve } from './serve.mjs';
import { pillar } from '../unse/js/saju.js';
import { TAGLINE } from '../unse/js/data.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const UNSE = join(ROOT, 'unse');
const ORIGIN = 'https://1px-society.github.io';

// 1) 페이지 스크립트를 한 파일로 묶는다(unse/js/* → unse/app.min.js)
await esbuild.build({ entryPoints: [join(UNSE, 'js', 'app.js')], bundle: true, minify: true, format: 'esm', target: ['es2020'], outfile: join(UNSE, 'app.min.js'), legalComments: 'none' });

// 2) OG 이미지
const server = await serve(4812);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4812/tools/og.html', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 60000 });
const og = await page.evaluate(() => window.OG);
await browser.close();
server.close();

await mkdir(join(UNSE, 'og'), { recursive: true });
for (const [name, url] of Object.entries(og)) {
  await writeFile(join(UNSE, 'og', `${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
}

const template = await readFile(join(UNSE, 'index.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(">)`);
  if (!re.test(html)) throw new Error(`meta ${key} not found`);
  return html.replace(re, `$1${esc(value)}$2`);
}

await rm(join(UNSE, 'r'), { recursive: true, force: true });
for (let i = 0; i < 60; i++) {
  const p = pillar(i);
  const url = `${ORIGIN}/unse/r/${p.id}/`;
  const title = `친구는 ${p.name}일주 · ${p.colorWord} ${p.animal}`;
  let html = template;
  html = html.replace('<title>오늘의 운세 · 1px</title>', `<title>${esc(title)} | 오늘의 운세</title>`);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', `${TAGLINE[p.name]} · 너는 무슨 일주야? 오늘 운세 보기`);
  html = setMeta(html, 'name', 'description', `${title} — ${TAGLINE[p.name]}. 생년월일시로 사주팔자, 오늘 점수, 궁합, 대운까지 무료로 봐.`);
  html = setMeta(html, 'property', 'og:image', `${ORIGIN}/unse/og/${p.id}.png`);
  html = setMeta(html, 'property', 'og:url', url);
  html = html.replace('<link rel="canonical" href="https://1px-society.github.io/unse/">', `<link rel="canonical" href="${url}">`);
  html = html.replace('<body data-friend="">', `<body data-friend="${p.id}">`);
  await mkdir(join(UNSE, 'r', p.id), { recursive: true });
  await writeFile(join(UNSE, 'r', p.id, 'index.html'), html);
}
console.log(`번들 unse/app.min.js, og ${Object.keys(og).length}장, 결과 페이지 60개`);
