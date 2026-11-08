// 결과 카드를 canvas로 그린다. 페이지 화면, 공유 이미지(피드 4:5, 스토리 9:16), OG 이미지가 같은 코드를 쓴다.
import { drawSprite, drawLogo, PALETTES } from './sprites.js';
import { dateLabel } from './fortune.js';

export const SANS = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
export const PIXEL = '"Galmuri11", "Pretendard Variable", monospace';
export const SITE = '1px-society.github.io/unse';

const INK = '#2a2440';
const GOD_HANJA = { 비견: '比肩', 겁재: '劫財', 식신: '食神', 상관: '傷官', 편재: '偏財', 정재: '正財', 편관: '偏官', 정관: '正官', 편인: '偏印', 정인: '正印' };
const THEMES = [
  ['#c6f4e6', '#e6e0ff'], // 목
  ['#ffd3d6', '#ffe8c6'], // 화
  ['#fff0b3', '#ffd8e8'], // 토
  ['#eeeafb', '#d7e6ff'], // 금
  ['#d5daff', '#f1d8ff'], // 수
];

export async function ensureFonts(texts) {
  if (!document.fonts) return;
  const sample = texts.join('');
  await Promise.all([
    document.fonts.load(`800 64px "Pretendard Variable"`, sample),
    document.fonts.load(`600 34px "Pretendard Variable"`, sample),
    document.fonts.load(`700 40px Galmuri11`, sample),
    document.fonts.load(`400 30px Galmuri11`, sample),
  ]).catch(() => {});
}

export function cardTexts(r) {
  return [r.headline, r.tagline, r.love.text, r.money.text, r.work.text, r.health.text, r.grade, String(r.score), '오늘 점수 점 건강 12운성', r.mantra, r.keyword, r.lucky.item, r.lucky.color.name, r.lucky.direction, r.god, r.stage, r.today.name, ...r.shinsal, '比肩劫財食神傷官偏財正財偏官正官偏印正印',
    `${r.me.name}일주 ${r.me.colorWord} ${r.me.animal} 오늘의 운세 연애 재물 공부·일 행운 컬러 방향 숫자 아이템 오늘은 의 날 일 한마디 ${dateLabel(r.date)} ${SITE} @1px.society 나의 너도 봐 케미 띠 친구 0123456789`];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 스티커 느낌: 두꺼운 외곽선 + 각진 그림자
function sticker(ctx, x, y, w, h, r, fill, shadow = 10, line = 5) {
  ctx.fillStyle = INK;
  roundRect(ctx, x + shadow, y + shadow, w, h, r);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.lineWidth = line;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function wrap(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) line = next;
    else {
      if (line) lines.push(line);
      line = word;
      while (ctx.measureText(line).width > maxWidth) {
        let k = line.length - 1;
        while (k > 1 && ctx.measureText(line.slice(0, k)).width > maxWidth) k--;
        lines.push(line.slice(0, k));
        line = line.slice(k);
      }
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/.$/, '…');
    return kept;
  }
  return lines;
}

const ICONS = {
  heart: ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...', '.......'],
  coin: ['..xxx..', '.xxxxx.', 'xxx.xxx', 'xxx.xxx', 'xxx.xxx', '.xxxxx.', '..xxx..'],
  star: ['...x...', '..xxx..', 'xxxxxxx', '.xxxxx.', '..xxx..', '.xx.xx.', 'xx...xx'],
  plus: ['..xxx..', '..xxx..', 'xxxxxxx', 'xxxxxxx', 'xxxxxxx', '..xxx..', '..xxx..'],
};
const ICON_COLORS = { heart: '#ff5c8a', coin: '#ffb627', star: '#7c5cff', plus: '#22b07d' };

function drawIcon(ctx, kind, x, y, px, color) {
  const g = ICONS[kind];
  ctx.fillStyle = color;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (g[r][c] === 'x') ctx.fillRect(x + c * px, y + r * px, px, px);
}

function drawRating(ctx, kind, n, x, y, px, gap) {
  for (let i = 0; i < 5; i++) drawIcon(ctx, kind, x + i * (7 * px + gap), y, px, i < n ? ICON_COLORS[kind] : '#ddd7ee');
}

// 바닥줄: 1px 로고, 계정, 주소를 로고 얼굴의 세로 가운데에 맞춘다
function drawFooter(ctx, L, R, fy) {
  const size = 5;
  const top = fy - 34;
  drawLogo(ctx, L - 6, top, size);
  const mid = top + 5 * size;   // 로고 얼굴(1~8줄)의 가운데
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.font = `700 26px ${PIXEL}`;
  ctx.fillText('@1px' + '.society', L + 52, mid + 1);
  ctx.textAlign = 'right';
  ctx.font = `400 24px ${PIXEL}`;
  ctx.fillStyle = '#6b6488';
  ctx.fillText(SITE, R, mid + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// 반짝이(픽셀 별) 배경
function sparkles(ctx, w, h, seed, color, count) {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * h);
    const p = 4 + Math.floor(rnd() * 3) * 2;
    ctx.globalAlpha = 0.35 + rnd() * 0.5;
    ctx.fillRect(x, y - p, p, p * 3);
    ctx.fillRect(x - p, y, p * 3, p);
  }
  ctx.globalAlpha = 1;
}

function background(ctx, w, h, element, seed) {
  const [a, b] = THEMES[element];
  const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // 홀로그램 줄무늬
  ctx.save();
  ctx.globalAlpha = 0.18;
  const holo = ctx.createLinearGradient(0, 0, w, h);
  ['#ff9ad5', '#9ad9ff', '#b8ffcf', '#fff59a', '#c9a6ff'].forEach((c, i, all) => holo.addColorStop(i / (all.length - 1), c));
  ctx.fillStyle = holo;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  sparkles(ctx, w, h, seed, '#ffffff', Math.round((w * h) / 26000));
}

// 피드 카드(1080×1350) 본문. (0,0)에 그린다.
function drawFeed(ctx, r, withBackground = true) {
  const W = 1080, H = 1350;
  const pal = PALETTES[r.me.element];
  if (withBackground) background(ctx, W, H, r.me.element, r.me.index * 7919 + r.date[2]);

  const M = 54;
  sticker(ctx, M, M, W - M * 2 - 10, H - M * 2 - 10, 48, 'rgba(255,255,255,0.93)', 12, 6);
  const L = M + 52, R = W - M - 62;

  // 머리줄
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `700 44px ${PIXEL}`;
  ctx.fillText('오늘의 운세', L, M + 96);
  ctx.font = `400 30px ${PIXEL}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${dateLabel(r.date)} · ${r.today.name}일`, R, M + 94);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#cfc7e6';
  for (let x = L; x < R; x += 20) ctx.fillRect(x, M + 124, 10, 6);

  // 일주 배지
  const sy = M + 160;
  const disc = 200;
  ctx.fillStyle = pal.l;
  ctx.beginPath();
  ctx.arc(L + disc / 2, sy + disc / 2, disc / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  drawSprite(ctx, r.me.branch, r.me.element, L + (disc - 160) / 2, sy + (disc - 160) / 2 + 4, 10);

  const tx = L + disc + 36;
  ctx.font = `700 26px ${PIXEL}`;
  let cx = tx;
  const chips = [[`#${r.keyword}`, pal.b, r.me.element === 4 ? '#ffffff' : INK], ...r.shinsal.slice(0, 2).map((x) => [x, '#ffe27a', INK])];
  for (const [label, fill, color] of chips) {
    const w = ctx.measureText(label).width + 30;
    if (cx + w > R) break;
    sticker(ctx, cx, sy + 2, w, 46, 23, fill, 5, 4);
    ctx.fillStyle = color;
    ctx.fillText(label, cx + 15, sy + 35);
    cx += w + 12;
  }
  ctx.fillStyle = INK;
  ctx.font = `700 56px ${PIXEL}`;
  ctx.fillText(`${r.me.name}일주`, tx, sy + 116);
  ctx.font = `700 32px ${SANS}`;
  ctx.fillText(`${r.me.colorWord} ${r.me.animal}`, tx, sy + 160);
  ctx.font = `600 26px ${SANS}`;
  ctx.fillStyle = '#6b6488';
  ctx.fillText(`오늘은 ${r.god}(${GOD_HANJA[r.god]})의 날 · 12운성 ${r.stage}`, tx, sy + 196);

  // 점수 + 한 줄 운세
  const y0 = sy + disc + 34;
  sticker(ctx, L - 4, y0, 262, 200, 32, pal.l, 8, 5);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `700 26px ${PIXEL}`;
  ctx.fillText('오늘 점수', L + 127, y0 + 44);
  ctx.textAlign = 'left';
  ctx.font = `700 112px ${PIXEL}`;
  const nw = ctx.measureText(String(r.score)).width;
  ctx.font = `700 30px ${PIXEL}`;
  const uw = ctx.measureText('점').width;
  const sx = L + 127 - (nw + 8 + uw) / 2;
  ctx.font = `700 112px ${PIXEL}`;
  ctx.fillText(String(r.score), sx, y0 + 150);
  ctx.font = `700 30px ${PIXEL}`;
  ctx.fillText('점', sx + nw + 8, y0 + 148);
  ctx.textAlign = 'center';
  ctx.font = `700 26px ${PIXEL}`;
  ctx.fillText(r.grade, L + 127, y0 + 186);
  ctx.textAlign = 'left';

  const hx = L + 290;
  ctx.font = `800 46px ${SANS}`;
  const lines = wrap(ctx, `“${r.headline}”`, R - hx, 3);
  const lh = 58;
  let y = y0 + 100 - ((lines.length - 1) * lh) / 2 + 14;
  for (const line of lines) {
    ctx.fillText(line, hx, y);
    y += lh;
  }

  // 분야별 네 줄
  y = y0 + 234;
  const rows = [['연애', 'heart', r.love], ['재물', 'coin', r.money], ['공부·일', 'star', r.work], ['건강', 'plus', r.health]];
  for (const [label, kind, v] of rows) {
    ctx.fillStyle = '#f4f0ff';
    roundRect(ctx, L - 6, y, R - L + 12, 82, 22);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = `700 28px ${PIXEL}`;
    ctx.fillText(label, L + 20, y + 36);
    drawRating(ctx, kind, v.stars, L + 20, y + 50, 3, 7);
    ctx.fillStyle = INK;
    ctx.font = `600 29px ${SANS}`;
    const t = wrap(ctx, v.text, R - L - 240, 2);
    const ty = t.length === 1 ? y + 52 : y + 36;
    t.forEach((line, i) => ctx.fillText(line, L + 210, ty + i * 34));
    y += 92;
  }

  // 행운 칩
  y += 6;
  const luck = [['행운 컬러', r.lucky.color.name, r.lucky.color.hex], ['행운 방향', r.lucky.direction], ['행운 숫자', String(r.lucky.number)]];
  const cw = (R - L - 24) / 3;
  luck.forEach(([label, value, hex], i) => {
    const bx = L + i * (cw + 12);
    sticker(ctx, bx, y, cw, 108, 24, '#ffffff', 6, 4);
    ctx.fillStyle = '#6b6488';
    ctx.font = `400 24px ${PIXEL}`;
    ctx.fillText(label, bx + 20, y + 38);
    ctx.fillStyle = INK;
    ctx.font = `800 32px ${SANS}`;
    let vx = bx + 20;
    if (hex) {
      ctx.fillStyle = hex;
      ctx.fillRect(vx, y + 60, 28, 28);
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.strokeRect(vx, y + 60, 28, 28);
      vx += 40;
      ctx.fillStyle = INK;
    }
    ctx.fillText(wrap(ctx, value, cw - (vx - bx) - 14, 1)[0], vx, y + 86);
  });

  // 바닥줄
  const fy = H - M - 10 - 56;
  drawFooter(ctx, L, R, fy);
}

export function renderCard(r, format = 'feed') {
  const c = document.createElement('canvas');
  if (format === 'feed') {
    c.width = 1080;
    c.height = 1350;
    drawFeed(c.getContext('2d'), r);
    return c;
  }
  // 스토리 1080×1920: 위에 제목, 가운데 카드, 아래 안내(인스타 링크 스티커 자리를 비운다)
  c.width = 1080;
  c.height = 1920;
  const ctx = c.getContext('2d');
  background(ctx, 1080, 1920, r.me.element, r.me.index * 104729 + r.date[2]);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `700 54px ${PIXEL}`;
  ctx.fillText('✦ 나의 오늘 운세 ✦', 540, 190);
  ctx.textAlign = 'left';
  const s = 0.9;
  const feed = document.createElement('canvas');
  feed.width = 1080;
  feed.height = 1350;
  drawFeed(feed.getContext('2d'), r, false);
  ctx.save();
  ctx.translate((1080 - 1080 * s) / 2, 250);
  ctx.scale(s, s);
  ctx.drawImage(feed, 0, 0);
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 40px ${PIXEL}`;
  ctx.fillText('너도 오늘 운세 봐 ↓', 540, 1560);
  ctx.font = `400 32px ${PIXEL}`;
  ctx.fillStyle = '#4b4468';
  ctx.fillText(SITE, 540, 1612);
  ctx.textAlign = 'left';
  return c;
}

// OG 미리보기(1200×630): 일주 하나 또는 기본
export function renderOg(me, tagline) {
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 630;
  const ctx = c.getContext('2d');
  const element = me ? me.element : 3;
  background(ctx, 1200, 630, element, me ? me.index * 31 + 7 : 17);
  sticker(ctx, 40, 40, 1110, 540, 44, 'rgba(255,255,255,0.93)', 10, 6);
  if (me) {
    ctx.fillStyle = PALETTES[me.element].l;
    ctx.beginPath();
    ctx.arc(250, 310, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    drawSprite(ctx, me.branch, me.element, 250 - 136, 310 - 132, 17);
    ctx.fillStyle = INK;
    ctx.font = `700 40px ${PIXEL}`;
    ctx.fillText('친구의 일주는', 470, 190);
    ctx.font = `700 92px ${PIXEL}`;
    ctx.fillText(`${me.name}일주`, 470, 300);
    ctx.font = `800 46px ${SANS}`;
    ctx.fillText(`${me.colorWord} ${me.animal} · ${tagline}`, 470, 372);
    ctx.font = `700 36px ${PIXEL}`;
    ctx.fillStyle = '#6b6488';
    ctx.fillText('너는 무슨 일주야? 오늘 운세 보기 →', 470, 470);
  } else {
    const picks = [[4, 3], [3, 0], [6, 1], [0, 4], [9, 2]];
    picks.forEach(([b, e], i) => drawSprite(ctx, b, e, 110 + i * 200, 110, 10));
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = `700 96px ${PIXEL}`;
    ctx.fillText('오늘의 운세', 600, 400);
    ctx.font = `700 40px ${SANS}`;
    ctx.fillText('생일 하나로 보는 나의 일주와 오늘의 운세', 600, 470);
    ctx.font = `400 30px ${PIXEL}`;
    ctx.fillStyle = '#6b6488';
    ctx.fillText(`${SITE} · @1px.society`, 600, 530);
    ctx.textAlign = 'left';
  }
  return c;
}

// --- 궁합 카드 -------------------------------------------------------------------------
export function compatTexts(c, a, b) {
  return [c.label, String(c.score), ...c.short.flat(), `${a.day.name}일주 ${a.day.colorWord} ${a.day.animal}`, `${b.day.name}일주 ${b.day.colorWord} ${b.day.animal}`, '우리 궁합 점 나 상대 너희도 궁합 봐 ↓ 사주 궁합', SITE, '@1px.society'];
}

function drawCompatFeed(ctx, c, a, b, withBackground = true) {
  const W = 1080, H = 1350;
  if (withBackground) background(ctx, W, H, 1, a.day.index * 61 + b.day.index);
  const M = 54;
  sticker(ctx, M, M, W - M * 2 - 10, H - M * 2 - 10, 48, 'rgba(255,255,255,0.93)', 12, 6);
  const L = M + 52, R = W - M - 62, CX = (L + R) / 2;

  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `700 44px ${PIXEL}`;
  ctx.fillText('우리 궁합', L, M + 96);
  ctx.font = `400 30px ${PIXEL}`;
  ctx.textAlign = 'right';
  ctx.fillText('사주 궁합', R, M + 94);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#cfc7e6';
  for (let x = L; x < R; x += 20) ctx.fillRect(x, M + 124, 10, 6);

  // 두 사람 배지와 하트
  const disc = 220, dy = M + 170;
  const people = [[a, CX - 230], [b, CX + 230]];
  for (const [p, x] of people) {
    const pal = PALETTES[p.day.element];
    ctx.fillStyle = pal.l;
    ctx.beginPath();
    ctx.arc(x, dy + disc / 2, disc / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    drawSprite(ctx, p.day.branch, p.day.element, x - 88, dy + disc / 2 - 84, 11);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = `700 40px ${PIXEL}`;
    ctx.fillText(`${p.day.name}일주`, x, dy + disc + 58);
    ctx.font = `700 28px ${SANS}`;
    ctx.fillStyle = '#6b6488';
    ctx.fillText(`${p.day.colorWord} ${p.day.animal}`, x, dy + disc + 98);
  }
  // 가운데 하트(픽셀)
  const heart = ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
  ctx.fillStyle = '#ff5c8a';
  heart.forEach((row, r) => [...row].forEach((ch, k) => { if (ch === 'x') ctx.fillRect(CX - 42 + k * 12, dy + disc / 2 - 36 + r * 12, 12, 12); }));

  // 점수
  const sy = dy + disc + 140;
  ctx.textAlign = 'left';
  ctx.font = `700 150px ${PIXEL}`;
  const nw = ctx.measureText(String(c.score)).width;
  ctx.font = `700 44px ${PIXEL}`;
  const uw = ctx.measureText('점').width;
  const sx = CX - (nw + 10 + uw) / 2;
  ctx.fillStyle = INK;
  ctx.font = `700 150px ${PIXEL}`;
  ctx.fillText(String(c.score), sx, sy + 130);
  ctx.font = `700 44px ${PIXEL}`;
  ctx.fillText('점', sx + nw + 10, sy + 126);
  ctx.font = `700 34px ${PIXEL}`;
  const lw = ctx.measureText(c.label).width + 44;
  sticker(ctx, CX - lw / 2, sy + 156, lw, 60, 30, '#ffe27a', 5, 4);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.fillText(c.label, CX, sy + 198);
  ctx.textAlign = 'left';

  // 항목 네 줄
  let y = sy + 250;
  for (const [title, text] of c.short) {
    ctx.fillStyle = '#f4f0ff';
    roundRect(ctx, L - 6, y, R - L + 12, 72, 20);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = `700 28px ${PIXEL}`;
    ctx.fillText(title, L + 20, y + 46);
    ctx.font = `600 29px ${SANS}`;
    ctx.fillText(wrap(ctx, text, R - L - 150, 1)[0], L + 130, y + 46);
    y += 82;
  }

  const fy = H - M - 10 - 56;
  drawFooter(ctx, L, R, fy);
}

export function renderCompatCard(c, a, b, format = 'feed') {
  const cv = document.createElement('canvas');
  cv.width = 1080;
  if (format === 'feed') {
    cv.height = 1350;
    drawCompatFeed(cv.getContext('2d'), c, a, b);
    return cv;
  }
  cv.height = 1920;
  const ctx = cv.getContext('2d');
  background(ctx, 1080, 1920, 1, a.day.index * 97 + b.day.index);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `700 54px ${PIXEL}`;
  ctx.fillText('♥ 우리 궁합 ♥', 540, 190);
  const feed = document.createElement('canvas');
  feed.width = 1080;
  feed.height = 1350;
  drawCompatFeed(feed.getContext('2d'), c, a, b, false);
  ctx.save();
  ctx.translate(54, 250);
  ctx.scale(0.9, 0.9);
  ctx.drawImage(feed, 0, 0);
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.font = `700 40px ${PIXEL}`;
  ctx.fillText('너희도 궁합 봐 ↓', 540, 1560);
  ctx.font = `400 32px ${PIXEL}`;
  ctx.fillStyle = '#4b4468';
  ctx.fillText(SITE, 540, 1612);
  ctx.textAlign = 'left';
  return cv;
}
