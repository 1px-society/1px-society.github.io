import KoreanLunarCalendar from '../vendor/korean-lunar-calendar.mjs';
import { birthPillar, pillarById, pillar, dayPillarIndex, todayKST, msUntilNextKSTMidnight, isValidSolar } from './saju.js';
import { reading, dateLabel, shareText } from './fortune.js';
import { renderCard, ensureFonts, cardTexts, SITE } from './card.js';
import { drawLogo, drawSprite } from './sprites.js';
import { TAGLINE } from './data.js';

const $ = (id) => document.getElementById(id);
const KEY = 'unse.v1';
const ORIGIN = 'https://1px-society.github.io';

const state = { calendar: 'solar', format: 'story', reading: null, images: {} };

// --- 저장(이 기기에만) ------------------------------------------------------------
function loadBirth() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && typeof v.y === 'number' ? v : null;
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
  const [y, m, d] = state.reading.date;
  return `${ORIGIN}/unse/r/${state.reading.me.id}/?d=${y}-${m}-${d}`;
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

async function show(birth, quick = false) {
  const me = birthPillar(birth, lunarToSolar);
  if (!me) {
    $('error').textContent = '없는 음력 날짜야. 윤달 여부를 확인해 줘';
    return;
  }
  state.birth = birth;
  const r = reading(me, todayKST());
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

  $('detail').textContent = r.detail;
  $('relation').textContent = r.relationNote;
  $('mantra').textContent = r.mantra;
  $('match').textContent = `${r.match}띠 친구`;
  $('todaypillar').textContent = `${r.today.name}일 · ${r.today.colorWord} ${r.today.animal}`;
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
  const d = new URLSearchParams(location.search).get('d');
  const parts = d ? d.split('-').map(Number) : null;
  if (parts && parts.length === 3 && isValidSolar(...parts)) {
    const r = reading(me, parts);
    ensureFonts(cardTexts(r)).then(() => {
      $('friend-card').src = renderCard(r, 'feed').toDataURL('image/png');
      $('friend-card').hidden = false;
      $('friend-card').alt = `친구의 ${dateLabel(parts)} 운세 카드`;
    });
  }
}

function init() {
  drawStatic();
  friendView();

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
    $('late').checked = !!saved.lateNight;
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
    const birth = { ...p, lunar: state.calendar === 'lunar', leap: state.calendar === 'lunar' && $('leap').checked, lateNight: $('late').checked };
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
