// 공유·복사 동작 시험: node tools/test-share.mjs [chromium|webkit]   (BASE=https://1px-society.github.io 로 실제 사이트)
// 실제 기기의 공유창은 띄울 수 없어서 navigator.share / clipboard를 흉내 내고, 버튼마다 무엇이 불리는지 본다.
import { chromium, webkit } from 'playwright-core';
import { serve } from './serve.mjs';

const engine = process.argv[2] || 'chromium';
const server = process.env.BASE ? null : await serve(4814);
const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
const BASE = process.env.BASE || 'http://127.0.0.1:4814';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

// mode: none(공유 없음) | ok(공유 성공) | deny(NotAllowedError) | abort(사용자가 닫음)
function shareMock(mode) {
  return `(() => {
    window.__calls = [];
    const mode = ${JSON.stringify(mode)};
    if (mode === 'none') { try { delete Navigator.prototype.share; delete Navigator.prototype.canShare; } catch (e) {} navigator.share = undefined; navigator.canShare = undefined; return; }
    navigator.canShare = (d) => !!d;
    navigator.share = (d) => {
      window.__calls.push({ files: (d.files || []).map((f) => ({ name: f.name, type: f.type, size: f.size })), url: d.url, text: d.text,
        active: navigator.userActivation ? navigator.userActivation.isActive : null });
      if (mode === 'ok') return Promise.resolve();
      const e = new Error(mode); e.name = mode === 'abort' ? 'AbortError' : 'NotAllowedError';
      return Promise.reject(e);
    };
  })();`;
}

async function page(mode, { clipboard = true, blockCopy = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  if (clipboard && engine === 'chromium') await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await ctx.addInitScript(shareMock(mode));
  if (blockCopy) await ctx.addInitScript(`navigator.clipboard && (navigator.clipboard.writeText = () => Promise.reject(new Error('blocked'))); document.execCommand = () => false;`);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/unse/`, { waitUntil: 'networkidle' });
  await p.fill('#birth', '20050315');
  await p.click('#go');
  await p.waitForTimeout(3000);   // 카드 + 공유 이미지 미리 만들기
  return { ctx, p, errors };
}
const calls = (p) => p.evaluate(() => window.__calls);
const sheet = (p) => p.evaluate(() => ({ open: !document.getElementById('sheet').hidden, img: !document.getElementById('sheet-img').hidden && document.getElementById('sheet-img').naturalWidth, text: !document.getElementById('sheet-text').hidden ? document.getElementById('sheet-text').value : null }));
const toastText = (p) => p.evaluate(() => document.getElementById('toast').classList.contains('show') ? document.getElementById('toast').textContent : '');

// 1) 공유창이 있는 폰: 이미지 공유 → 파일 한 장, 누른 순간에 불림 / 링크 → 결과 링크
{
  const { ctx, p, errors } = await page('ok');
  await p.click('#share');
  await p.waitForTimeout(300);
  let c = await calls(p);
  check('이미지 공유: navigator.share에 PNG 한 장(스토리용)', c.length === 1 && c[0].files.length === 1 && c[0].files[0].type === 'image/png' && c[0].files[0].size > 50000 && /story/.test(c[0].files[0].name), JSON.stringify(c[0]));
  if (engine === 'chromium') check('이미지 공유: 누른 순간에 불림(user activation)', c[0] && c[0].active === true, String(c[0] && c[0].active));
  await p.click('[data-format=feed]');
  await p.click('#share');
  await p.waitForTimeout(300);
  c = await calls(p);
  check('이미지 공유: 댓글·피드용 선택 시 feed 파일', c.length === 2 && /feed/.test(c[1].files[0].name), JSON.stringify(c[1] && c[1].files));
  await p.click('#link');
  await p.waitForTimeout(300);
  c = await calls(p);
  const last = c[c.length - 1];
  check('링크 보내기: 첫 화면 URL로 공유, 문구에 일주(점수 없음)', last && last.url === 'https://1px-society.github.io/unse/' && /일주/.test(last.text) && !/점/.test(last.text), JSON.stringify(last));
  check('오류 없음', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 2) 공유창이 거부될 때(앱 안 브라우저 등): 이미지 → 저장 창, 링크 → 복사
{
  const { ctx, p } = await page('deny');
  await p.click('#share');
  await p.waitForTimeout(500);
  const s = await sheet(p);
  check('공유 거부: 이미지 저장 창이 뜸', s.open && s.img === 1080, JSON.stringify(s));
  await p.click('#sheet-close');
  await p.click('#link');
  await p.waitForTimeout(500);
  const t = await toastText(p);
  const s2 = await sheet(p);
  check('공유 거부: 링크는 복사되거나 복사 창이 뜸', t === '링크를 복사했어요' || (s2.open && /1px-society\.github\.io\/unse\//.test(s2.text || '')), `toast=${t} sheet=${JSON.stringify(s2)}`);
  await ctx.close();
}

// 3) 사용자가 공유창을 닫음: 아무것도 안 뜸
{
  const { ctx, p } = await page('abort');
  await p.click('#share');
  await p.waitForTimeout(400);
  check('공유 취소: 저장 창이 뜨지 않음', !(await sheet(p)).open);
  await ctx.close();
}

// 4) 공유창이 없는 브라우저(PC): 이미지 → 저장 창, 링크 → 클립보드
{
  const { ctx, p } = await page('none');
  await p.click('#share');
  await p.waitForTimeout(500);
  check('공유 없음: 이미지 저장 창', (await sheet(p)).img === 1080);
  await p.click('#sheet-close');
  await p.click('#link');
  await p.waitForTimeout(500);
  const t = await toastText(p);
  let clip = '';
  if (engine === 'chromium') clip = await p.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  check('공유 없음: 링크가 클립보드로', t === '링크를 복사했어요' && (engine !== 'chromium' || /1px-society\.github\.io\/unse\//.test(clip)), `toast=${t} clip=${clip}`);
  await ctx.close();
}

// 5) 복사가 막힌 브라우저: 길게 눌러 복사하는 창
{
  const { ctx, p } = await page('none', { clipboard: false, blockCopy: true });
  await p.click('#copy');
  await p.waitForTimeout(400);
  const s = await sheet(p);
  check('복사 막힘: 글 복사 창이 뜸(텍스트 포함)', s.open && /오늘의 운세/.test(s.text || ''), JSON.stringify(s).slice(0, 120));
  await ctx.close();
}

// 6) 궁합 카드 공유
{
  const { ctx, p } = await page('ok');
  await p.click('[data-tab=compat]');
  await p.fill('#cbirth', '20040821');
  await p.click('#cform button[type=submit]');
  await p.waitForTimeout(2500);
  await p.evaluate(() => [...document.querySelectorAll('#compat-result .btn-main')][0].click());
  await p.waitForTimeout(300);
  const c = await calls(p);
  check('궁합 카드 공유: gunghap PNG', c.length === 1 && /gunghap/.test(c[0].files[0].name) && c[0].files[0].size > 50000, JSON.stringify(c[0]));
  await ctx.close();
}

// 7) 친구 링크 페이지
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/unse/r/gyeong-jin/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const v = await p.evaluate(() => ({ friend: !document.getElementById('friend').hidden, name: document.getElementById('friend-name').textContent, robots: document.querySelector('meta[name=robots]').content, og: document.querySelector('meta[property="og:image"]').content }));
  check('친구 링크: 일주 배지·noindex·일주 OG', v.friend && v.name === '경진일주' && /noindex/.test(v.robots) && /gyeong-jin\.png$/.test(v.og), JSON.stringify(v));
  await ctx.close();
}

// 8) 다시 온 사람: 입력란이 먼저 뜨고 저장된 생일이 채워져 있다; 결과 위 '생일 바꾸기'로 입력란에 돌아간다
{
  const { ctx, p } = await page('ok');
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const first = await p.evaluate(() => ({ intro: !document.getElementById('intro').hidden, result: !document.getElementById('result').hidden, birth: document.getElementById('birth').value }));
  check('다시 온 사람: 입력란부터, 생일은 채워짐', first.intro && !first.result && first.birth === '20050315', JSON.stringify(first));
  await p.click('#go');
  await p.waitForTimeout(2500);
  const who = await p.evaluate(() => document.getElementById('who-birth').textContent);
  await p.click('#change');
  await p.waitForTimeout(300);
  const back = await p.evaluate(() => ({ intro: !document.getElementById('intro').hidden, result: !document.getElementById('result').hidden }));
  check('생일 바꾸기: 결과 위 생일 표시, 누르면 입력란으로', /2005\.03\.15/.test(who) && back.intro && !back.result, `${who} ${JSON.stringify(back)}`);
  await ctx.close();
}

await browser.close();
if (server) server.close();
let fail = 0;
for (const r of results) {
  if (!r.ok) fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  → ${r.detail}`}`);
}
console.log(`${engine}: ${results.length - fail}/${results.length} 통과`);
process.exit(fail ? 1 : 0);
