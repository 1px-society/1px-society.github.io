import KoreanLunarCalendar from '../vendor/korean-lunar-calendar.mjs';
import { fourPillars, HOURS, pillarById, pillar, dayPillarIndex, todayKST, msUntilNextKSTMidnight, isValidSolar, tenGod, branchGod, HANJA_STEMS, HANJA_BRANCHES, STEMS, BRANCHES, STEM_ELEMENT, BRANCH_ELEMENT } from './saju.js';
import { reading, dateLabel, shareText } from './fortune.js';
import { renderCard, ensureFonts, cardTexts, SITE } from './card.js';
import { drawLogo, drawSprite } from './sprites.js';
import { TAGLINE, ILGAN_TEXT, NATAL_SHINSAL_TEXT, ELEMENT_LABEL } from './data.js';

const $ = (id) => document.getElementById(id);
const KEY = 'unse.v2';
const OLD_KEY = 'unse.v1';
const GOD_HANJA = { 비견: '比肩', 겁재: '劫財', 식신: '食神', 상관: '傷官', 편재: '偏財', 정재: '正財', 편관: '偏官', 정관: '正官', 편인: '偏印', 정인: '正印' };
const ELEMENT_COLORS = ['#52c48a', '#ff6b6b', '#ffd24d', '#c9ced8', '#2f3456'];
const ORIGIN = 'https://1px-society.github.io';

const state = { calendar: 'solar', format: 'story', reading: null, images: {} };

// --- 저장(이 기기에만) ------------------------------------------------------------
function loadBirth() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v.y === 'number') return v;
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
    if (old && typeof old.y === 'number') return { y: old.y, m: old.m, d: old.d, lunar: !!old.lunar, leap: !!old.leap, hour: old.lateNight ? 'ja-late' : null };
    return null;
  } catch {
    return null;
  }
}
function saveBirth(b) {
  try { localStorage.setItem(KEY, JSON.stringify(b)); } catch { /* 사생활 보호 모드 */ }
}
function clearBirth() {
  try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
}

function lunarToSolar(y, m, d, leap) {
  const cal = new KoreanLunarCalendar();
  if (!cal.setLunarDate(y, m, d, leap)) return null;
  const s = cal.getSolarCalendar();
  return [s.year, s.month, s.day];
}

function parseBirth(text) {
  const digits = text.replace(/\D/g, '');
  if (digits.length !== 8) return { error: '생년월일 8자리를 넣어 줘 (예: 20050315)' };
  const y = Number(digits.slice(0, 4)), m = Number(digits.slice(4, 6)), d = Number(digits.slice(6, 8));
  if (y < 1900 || y > 2050) return { error: '1900년부터 2050년 사이로 넣어 줘' };
  if (state.calendar === 'solar' && !isValidSolar(y, m, d)) return { error: '없는 날짜야. 다시 확인해 줘' };
  if (state.calendar === 'lunar' && !(m >= 1 && m <= 12 && d >= 1 && d <= 30)) return { error: '음력 날짜를 다시 확인해 줘' };
  return { y, m, d };
}

// --- 화면 ------------------------------------------------------------------------
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 1800);
}

function setSeg(attr, value) {
  document.querySelectorAll(`[data-${attr}]`).forEach((b) => {
    const on = b.dataset[attr] === value;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
}

function drawStatic() {
  drawLogo($('logo').getContext('2d'), 0, 0, 4);
  drawLogo($('back-logo').getContext('2d'), 0, 0, 16);
  const today = pillar(dayPillarIndex(...todayKST()));
  $('today').textContent = `${dateLabel(todayKST())} · ${today.colorWord} ${today.animal}의 날`;
}

function tickClock() {
  const ms = msUntilNextKSTMidnight();
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  $('clock').textContent = `${hh}:${mm}:${ss}`;
  if (ms < 1500 && state.birth) setTimeout(() => show(state.birth, true), 1600);
}

// 앱 안 브라우저(인스타·카톡 등) 안내: { text, link?: { label, href } }
function inAppHint() {
  const ua = navigator.userAgent || '';
  const here = `${location.origin}${location.pathname}${location.search}`;
  if (/KAKAOTALK/i.test(ua)) {
    return { text: '카톡 안에서는 공유가 막힐 수 있어요. ', link: { label: '다른 브라우저로 열기', href: `kakaotalk://web/openExternal?url=${encodeURIComponent(here)}` } };
  }
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER/i.test(ua)) {
    if (/Android/i.test(ua)) {
      const rest = encodeURI(decodeURI(here.replace(/^https?:\/\//, '')));
      return { text: "앱 안의 브라우저에서는 공유가 막힐 수 있어요. 안 되면 '이미지 저장'에서 이미지를 꾹 눌러 저장하거나 ", link: { label: '크롬으로 열기', href: `intent://${rest}#Intent;scheme=https;package=com.android.chrome;end` } };
    }
    return { text: "앱 안의 브라우저에서는 공유가 막힐 수 있어요. 안 되면 '이미지 저장'에서 이미지를 꾹 눌러 저장하거나, 오른쪽 위 ⋯ 메뉴에서 외부 브라우저로 열어 줘." };
  }
  return null;
}

function renderHint(el, hint) {
  el.replaceChildren();
  el.hidden = !hint;
  if (!hint) return;
  el.append(hint.text);
  if (hint.link) {
    const a = document.createElement('a');
    a.href = hint.link.href;
    a.textContent = hint.link.label;
    el.append(a);
  }
}

async function image(format) {
  if (state.images[format]) return state.images[format];
  const canvas = renderCard(state.reading, format);
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
  const url = URL.createObjectURL(blob);
  state.images[format] = { blob, url };
  return state.images[format];
}

function fileName(format) {
  const [y, m, d] = state.reading.date;
  return `1px-unse-${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}-${format}.png`;
}

function resultLink() {
  return `${ORIGIN}/unse/r/${state.reading.me.id}/`;
}

async function openSheet(format) {
  const img = await image(format);
  $('sheet-img').src = img.url;
  $('download').href = img.url;
  $('download').download = fileName(format);
  $('sheet').hidden = false;
}

async function shareImage() {
  const img = await image(state.format);
  const file = new File([img.blob], fileName(state.format), { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  await openSheet(state.format);
}

async function shareLink() {
  const url = resultLink();
  const r = state.reading;
  const text = `나는 ${r.me.name}일주 ${r.me.colorWord} ${r.me.animal}! 너는?`;
  if (navigator.share) {
    try {
      await navigator.share({ title: '오늘의 운세 · 1px', text, url });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  await copy(`${text}\n${url}`, '링크를 복사했어요');
}

async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    try { document.execCommand('copy'); toast(done); } catch { toast('복사가 안 돼요. 길게 눌러 복사해 줘'); }
    ta.remove();
  }
}

function listInto(el, items) {
  el.replaceChildren(...items.map((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    return li;
  }));
}

function renderFlow(r) {
  $('gloss').textContent = `오늘은 ${r.today.name}(${HANJA_STEMS[r.today.stem]}${HANJA_BRANCHES[r.today.branch]})일. 나에게는 ${r.god}(${GOD_HANJA[r.god]})의 날 — ${r.gloss}.`;
  $('detail').textContent = r.detail;
  listInto($('notes'), r.notes);
  $('luckytime').textContent = r.lucky.time;
  $('luckyitem').textContent = r.lucky.item;
  $('mantra').textContent = r.mantra;
}

function cell(text, hanja, element, extra = '') {
  const td = document.createElement('td');
  const div = document.createElement('div');
  div.className = `cell e${element} ${extra}`;
  const b = document.createElement('b');
  b.textContent = hanja;
  const small = document.createElement('small');
  small.textContent = text;
  div.append(b, small);
  td.append(div);
  return td;
}

function renderChart(r) {
  const c = r.chart;
  const me = c.day.stem;
  const cols = [['시주', c.hour], ['일주', c.day], ['월주', c.month], ['연주', c.year]];
  const table = $('pillars');
  table.replaceChildren();
  const row = (fn) => {
    const tr = document.createElement('tr');
    for (const [label, p] of cols) tr.append(fn(label, p));
    table.append(tr);
  };
  row((label) => Object.assign(document.createElement('th'), { textContent: label }));
  row((label, p) => Object.assign(document.createElement('td'), { className: 'god', textContent: p ? (label === '일주' ? '나' : tenGod(me, p.stem)) : '' }));
  row((label, p) => (p ? cell(STEMS[p.stem], HANJA_STEMS[p.stem], STEM_ELEMENT[p.stem], label === '일주' ? 'me-cell' : '') : emptyCell()));
  row((label, p) => (p ? cell(BRANCHES[p.branch], HANJA_BRANCHES[p.branch], BRANCH_ELEMENT[p.branch]) : emptyCell()));
  row((label, p) => Object.assign(document.createElement('td'), { className: 'god', textContent: p ? branchGod(me, p.branch) : '' }));
  $('hour-missing').hidden = !!c.hour;

  const info = r.info;
  const bars = $('bars');
  bars.replaceChildren(...info.counts.map((n, e) => {
    const div = document.createElement('div');
    div.className = 'bar';
    const name = document.createElement('span');
    name.textContent = ELEMENT_LABEL[e];
    const track = document.createElement('span');
    track.className = 'bar-track';
    const fill = document.createElement('span');
    fill.className = 'bar-fill';
    fill.style.display = 'block';
    fill.style.width = `${Math.round((n / info.total) * 100)}%`;
    fill.style.background = ELEMENT_COLORS[e];
    track.append(fill);
    const num = document.createElement('span');
    num.className = 'bar-n';
    num.textContent = `${n}개`;
    div.append(name, track, num);
    return div;
  }));
  const em = STEM_ELEMENT[me];
  $('strength').textContent = info.strong
    ? `일간 ${ELEMENT_LABEL[em]}을 돕는 기운이 많은 신강(身強) 사주예요. 힘이 넘치니 내보내고 쓰는 기운이 필요해요.`
    : `일간 ${ELEMENT_LABEL[em]}을 돕는 기운이 적은 신약(身弱) 사주예요. 나를 받쳐 주는 기운이 필요해요.`;
  $('yong').textContent = `그래서 나에게 필요한 기운(용신)은 ${ELEMENT_LABEL[info.yong]}. 행운의 색·방향·숫자·시간은 여기서 나와요.`;
  $('ilgan').textContent = ILGAN_TEXT[me];
  listInto($('natal'), r.natal.length ? r.natal.map((s) => NATAL_SHINSAL_TEXT[s]) : ['원국에 큰 신살은 없어요. 무난하고 균형 잡힌 타입이에요.']);
}

function emptyCell() {
  const td = document.createElement('td');
  const div = document.createElement('div');
  div.className = 'cell empty';
  div.textContent = '?';
  td.append(div);
  return td;
}

async function show(birth, quick = false) {
  const chart = fourPillars(birth, lunarToSolar);
  if (!chart) {
    $('error').textContent = '없는 음력 날짜야. 윤달 여부를 확인해 줘';
    return;
  }
  state.birth = birth;
  const r = reading(chart, todayKST());
  state.reading = r;
  state.images = {};
  await ensureFonts(cardTexts(r));
  const canvas = renderCard(r, 'feed');
  $('card').src = canvas.toDataURL('image/png');

  $('intro').hidden = true;
  $('friend').hidden = true;
  $('result').hidden = true;
  $('stage').hidden = false;
  const flip = $('flip');
  flip.classList.remove('open', 'shake');
  void flip.offsetWidth;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!quick) {
    flip.classList.add('shake');
    await new Promise((ok) => setTimeout(ok, 750));
  }
  flip.classList.remove('shake');
  flip.classList.add('open');

  renderFlow(r);
  renderChart(r);
  renderHint($('inapp'), inAppHint());
  setTimeout(() => { $('result').hidden = false; }, quick ? 300 : 800);
}

function friendView() {
  const id = document.body.dataset.friend;
  if (!id) return;
  const me = pillarById(id);
  if (!me) return;
  $('friend').hidden = false;
  drawSprite($('friend-sprite').getContext('2d'), me.branch, me.element, 0, 0, 6);
  $('friend-name').textContent = `${me.name}일주`;
  $('friend-tag').textContent = `${me.colorWord} ${me.animal} · ${TAGLINE[me.name]}`;
}

function init() {
  drawStatic();
  friendView();
  for (const h of HOURS) $('hour').append(new Option(h.label, h.key));

  const saved = loadBirth();
  if (saved) {
    $('again').hidden = false;
    $('again').textContent = '저장된 생일로 바로 보기 →';
    $('again').addEventListener('click', () => show(saved, true));
    $('birth').value = `${saved.y}${String(saved.m).padStart(2, '0')}${String(saved.d).padStart(2, '0')}`;
    state.calendar = saved.lunar ? 'lunar' : 'solar';
    setSeg('cal', state.calendar);
    $('leap-row').hidden = !saved.lunar;
    $('leap').checked = !!saved.leap;
    $('hour').value = saved.hour || '';
    if (!document.body.dataset.friend) show(saved, true);
  }

  document.querySelectorAll('[data-cal]').forEach((b) => b.addEventListener('click', () => {
    state.calendar = b.dataset.cal;
    setSeg('cal', state.calendar);
    $('leap-row').hidden = state.calendar !== 'lunar';
  }));
  document.querySelectorAll('[data-format]').forEach((b) => b.addEventListener('click', () => {
    state.format = b.dataset.format;
    setSeg('format', state.format);
  }));

  $('birth').addEventListener('input', () => { $('error').textContent = ''; });
  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = parseBirth($('birth').value);
    if (p.error) {
      $('error').textContent = p.error;
      return;
    }
    const birth = { ...p, lunar: state.calendar === 'lunar', leap: state.calendar === 'lunar' && $('leap').checked, hour: $('hour').value || null };
    saveBirth(birth);
    show(birth);
  });

  $('share').addEventListener('click', shareImage);
  $('save').addEventListener('click', () => openSheet(state.format));
  $('link').addEventListener('click', shareLink);
  $('copy').addEventListener('click', () => copy(`${shareText(state.reading)}\n${SITE}`, '텍스트를 복사했어요'));
  $('sheet-close').addEventListener('click', () => { $('sheet').hidden = true; });
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet').hidden = true; });
  $('reset').addEventListener('click', () => {
    clearBirth();
    state.birth = null;
    $('result').hidden = true;
    $('stage').hidden = true;
    $('again').hidden = true;
    $('intro').hidden = false;
    $('birth').value = '';
    $('birth').focus();
  });

  tickClock();
  setInterval(tickClock, 1000);
}

init();
