import KoreanLunarCalendar from '../vendor/korean-lunar-calendar.mjs';
import {
  fourPillars, HOURS, pillarById, pillar, dayPillarIndex, todayKST, msUntilNextKSTMidnight, isValidSolar, tenGod, branchGod,
  HANJA_STEMS, HANJA_BRANCHES, STEMS, BRANCHES, STEM_ELEMENT, BRANCH_ELEMENT,
} from './saju.js';
import { reading, dateLabel, shareText, calendar, nowPeriods, compat, life, daeunReading } from './fortune.js';
import { renderCard, ensureFonts, cardTexts, SITE } from './card.js';
import { drawLogo, drawSprite } from './sprites.js';
import { TAGLINE, ELEMENT_LABEL } from './data.js';
import { barChart, lineChart, scoreBars } from './charts.js';

const $ = (id) => document.getElementById(id);
const KEY = 'unse.v2';
const OLD_KEY = 'unse.v1';
const ORIGIN = 'https://1px-society.github.io';
const GOD_HANJA = { 비견: '比肩', 겁재: '劫財', 식신: '食神', 상관: '傷官', 편재: '偏財', 정재: '正財', 편관: '偏官', 정관: '正官', 편인: '偏印', 정인: '正印' };
const ELEMENT_COLORS = ['#52c48a', '#ff6b6b', '#ffd24d', '#c9ced8', '#2f3456'];
const SIJIN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const state = { calendar: 'solar', ccalendar: 'solar', format: 'story', reading: null, chart: null, birth: null, images: {}, rendered: {} };

// --- 공통 ---------------------------------------------------------------------------
function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...children.filter((c) => c !== null && c !== undefined));
  return e;
}
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

function loadBirth() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v.y === 'number') return v;
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
    if (old && typeof old.y === 'number') return { y: old.y, m: old.m, d: old.d, lunar: !!old.lunar, leap: !!old.leap, hour: old.lateNight ? 'ja-late' : null, gender: null };
  } catch { /* 저장소를 못 쓰는 브라우저 */ }
  return null;
}
function saveBirth(b) { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch { /* 사생활 보호 모드 */ } }
function clearBirth() { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch { /* 무시 */ } }

function lunarToSolar(y, m, d, leap) {
  const cal = new KoreanLunarCalendar();
  if (!cal.setLunarDate(y, m, d, leap)) return null;
  const s = cal.getSolarCalendar();
  return [s.year, s.month, s.day];
}

function parseBirth(text, calendarKind) {
  const digits = text.replace(/\D/g, '');
  if (digits.length !== 8) return { error: '생년월일 8자리를 넣어 줘 (예: 20050315)' };
  const y = Number(digits.slice(0, 4)), m = Number(digits.slice(4, 6)), d = Number(digits.slice(6, 8));
  if (y < 1900 || y > 2050) return { error: '1900년부터 2050년 사이로 넣어 줘' };
  if (calendarKind === 'solar' && !isValidSolar(y, m, d)) return { error: '없는 날짜야. 다시 확인해 줘' };
  if (calendarKind === 'lunar' && !(m >= 1 && m <= 12 && d >= 1 && d <= 30)) return { error: '음력 날짜를 다시 확인해 줘' };
  return { y, m, d };
}

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
  $('clock').textContent = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  if (ms < 1500 && state.birth) setTimeout(() => show(state.birth, true), 1600);
}

// --- 탭 -----------------------------------------------------------------------------
function selectTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    const on = t.dataset.tab === name;
    t.classList.toggle('on', on);
    t.setAttribute('aria-selected', String(on));
  });
  for (const n of ['today', 'period', 'compat', 'me']) $(`tab-${n}`).hidden = n !== name;
  // 숨겨진 탭에서는 차트 폭을 못 재니 처음 열 때 그린다
  if (!state.rendered[name]) {
    state.rendered[name] = true;
    if (name === 'today') renderTodayCharts();
    if (name === 'period') renderPeriod();
    if (name === 'me') renderMe();
  }
}

// --- 공유 ---------------------------------------------------------------------------
function inAppHint() {
  const ua = navigator.userAgent || '';
  const here = `${location.origin}${location.pathname}${location.search}`;
  if (/KAKAOTALK/i.test(ua)) return { text: '카톡 안에서는 공유가 막힐 수 있어요. ', link: { label: '다른 브라우저로 열기', href: `kakaotalk://web/openExternal?url=${encodeURIComponent(here)}` } };
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER/i.test(ua)) {
    if (/Android/i.test(ua)) {
      const rest = encodeURI(decodeURI(here.replace(/^https?:\/\//, '')));
      return { text: "앱 안의 브라우저에서는 공유가 막힐 수 있어요. 안 되면 '이미지 저장'에서 이미지를 꾹 눌러 저장하거나 ", link: { label: '크롬으로 열기', href: `intent://${rest}#Intent;scheme=https;package=com.android.chrome;end` } };
    }
    return { text: "앱 안의 브라우저에서는 공유가 막힐 수 있어요. 안 되면 '이미지 저장'에서 이미지를 꾹 눌러 저장하거나, 오른쪽 위 ⋯ 메뉴에서 외부 브라우저로 열어 줘." };
  }
  return null;
}
function renderHint(node, hint) {
  node.replaceChildren();
  node.hidden = !hint;
  if (!hint) return;
  node.append(hint.text);
  if (hint.link) node.append(el('a', { href: hint.link.href, textContent: hint.link.label }));
}

async function image(format) {
  if (state.images[format]) return state.images[format];
  const canvas = renderCard(state.reading, format);
  const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
  state.images[format] = { blob, url: URL.createObjectURL(blob) };
  return state.images[format];
}
function fileName(format) {
  const [y, m, d] = state.reading.date;
  return `1px-unse-${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}-${format}.png`;
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
    try { await navigator.share({ files: [file] }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  await openSheet(state.format);
}
async function shareLink() {
  const r = state.reading;
  const url = `${ORIGIN}/unse/r/${r.me.id}/`;
  const text = `나는 ${r.me.name}일주 ${r.me.colorWord} ${r.me.animal}, 오늘 ${r.score}점! 너는?`;
  if (navigator.share) {
    try { await navigator.share({ title: '오늘의 운세 · 1px', text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  await copy(`${text}\n${url}`, '링크를 복사했어요');
}
async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    const ta = el('textarea', { value: text });
    document.body.append(ta);
    ta.select();
    try { document.execCommand('copy'); toast(done); } catch { toast('복사가 안 돼요. 길게 눌러 복사해 줘'); }
    ta.remove();
  }
}

// --- 오늘 탭 ------------------------------------------------------------------------
function renderToday(r) {
  scoreBars($('scores'), [
    { label: '♥ 연애', score: r.love.score, text: r.love.text },
    { label: '◎ 재물', score: r.money.score, text: r.money.text },
    { label: '★ 공부·일', score: r.work.score, text: r.work.text },
    { label: '✚ 건강', score: r.health.score, text: r.health.text },
  ]);
  $('besttime').textContent = `가장 좋은 시간: ${r.best.label} (${r.best.score}점). 중요한 연락·약속은 이때 잡아 보세요.`;
  $('gloss').textContent = `오늘은 ${r.today.name}(${HANJA_STEMS[r.today.stem]}${HANJA_BRANCHES[r.today.branch]})일. 나에게는 ${r.god}(${GOD_HANJA[r.god]})의 날 — ${r.gloss}.`;
  $('detail').textContent = r.detail;
  $('notes').replaceChildren(...r.notes.map((t) => el('li', { textContent: t })));
  const L = r.lucky;
  const facts = [
    ['행운 컬러', `${L.color.name} (${ELEMENT_LABEL[L.element]} 기운)`],
    ['행운 방향', L.direction],
    ['행운 숫자', String(L.number)],
    ['행운 시간', L.time],
    ['먹으면 좋은 것', L.food],
    ['하면 좋은 것', L.action],
    ['행운 아이템', L.item],
    ['오늘의 조언', r.mantra],
  ];
  $('gaeun').replaceChildren(...facts.map(([k, v]) => el('div', {}, el('dt', { textContent: k }), el('dd', { textContent: v }))));
  renderHint($('inapp'), inAppHint());
}

function renderTodayCharts() {
  const r = state.reading;
  barChart($('hours-chart'), r.hours.map((h) => ({ label: SIJIN[h.branch], value: h.score, tip: `${h.label} · ${h.score}점`, strong: h.key === r.best.key })), { height: 160 });
  const cal = calendar(state.chart, r.date, 30);
  lineChart($('month-chart'), cal.map((c, i) => ({
    label: i === 0 ? '오늘' : `${c.date[1]}/${c.date[2]}`,
    value: c.score,
    mark: c.tags.length > 0,
    tip: `${c.date[1]}/${c.date[2]} · ${c.score}점${c.tags.length ? ` · ${c.tags.join('·')}` : ''}`,
  })), { height: 180, labelEvery: 7 });
  const good = cal.slice(1).filter((c) => c.tags.length).sort((a, b) => b.score - a.score).slice(0, 5).sort((a, b) => (a.date.join() > b.date.join() ? 1 : -1));
  $('gooddays').replaceChildren(...good.map((c) => el('li', {}, el('b', { textContent: dateLabel(c.date) }), el('span', { textContent: `${c.score}점 · ${c.tags.join('·')}에 좋아요` }))));
}

// --- 이번 달·올해 탭 ----------------------------------------------------------------
function periodBlock(title, p) {
  return [
    el('h2', { textContent: title }),
    el('div', { className: 'phead' },
      el('span', { className: 'pbig', textContent: `${p.score}` }),
      el('span', { className: 'punit', textContent: '점' }),
      el('span', { className: 'pgrade', textContent: p.grade }),
      el('span', { className: 'ppillar', textContent: `${p.pillar.name}(${HANJA_STEMS[p.pillar.stem]}${HANJA_BRANCHES[p.pillar.branch]}) · ${p.god}(${GOD_HANJA[p.god]})의 기운` })),
    el('p', { textContent: p.text }),
    el('ul', { className: 'notes' }, ...p.notes.map((t) => el('li', { textContent: t }))),
    el('p', { className: 'soft small', textContent: `연애 ${stars(p.love)} · 재물 ${stars(p.money)} · 공부·일 ${stars(p.work)} · 건강 ${stars(p.health)}` }),
  ];
}
function renderPeriod() {
  const np = nowPeriods(state.chart);
  $('p-month').replaceChildren(...periodBlock('이번 달 운세', np.month));
  $('p-year').replaceChildren(...periodBlock(`${np.year.sajuYear} ${np.year.pillar.name}년 운세`, np.year));
  $('p-next-body').replaceChildren(...periodBlock(`${np.next.sajuYear} ${np.next.pillar.name}년 신년운세`, np.next));
  barChart($('next-chart'), np.next.months.map((m) => ({ label: m.label, value: m.score, tip: `${np.next.sajuYear + (m.k === 11 ? 1 : 0)}년 ${m.label} · ${m.score}점 · ${m.god}`, strong: m.score >= 80 })), { height: 160 });
}

// --- 궁합 탭 ------------------------------------------------------------------------
function renderCompat(other) {
  const c = compat(state.chart, other);
  const box = $('compat-result');
  box.hidden = false;
  box.replaceChildren(
    el('h2', { textContent: '우리 궁합' }),
    el('div', { className: 'phead' },
      el('span', { className: 'pbig', textContent: String(c.score) }),
      el('span', { className: 'punit', textContent: '점' }),
      el('span', { className: 'pgrade', textContent: c.label })),
    el('p', { className: 'soft small', textContent: `나 ${state.chart.day.name}일주(${state.chart.day.colorWord} ${state.chart.day.animal}) × 상대 ${other.day.name}일주(${other.day.colorWord} ${other.day.animal})` }),
    ...c.sections.map((s) => el('div', { className: 'csec' }, el('h3', { textContent: s.title }), el('p', { textContent: s.text }))),
    el('button', { className: 'btn btn-ghost small', type: 'button', textContent: '궁합 결과 텍스트 복사', onclick: () => copy(`💞 우리 궁합 ${c.score}점 · ${c.label}\n${state.chart.day.name}일주 × ${other.day.name}일주\n${SITE}`, '궁합 결과를 복사했어요') }),
  );
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- 내 사주 탭 ---------------------------------------------------------------------
function cell(text, hanja, element, extra = '') {
  return el('td', {}, el('div', { className: `cell e${element} ${extra}` }, el('b', { textContent: hanja }), el('small', { textContent: text })));
}
function emptyCell() { return el('td', {}, el('div', { className: 'cell empty', textContent: '?' })); }

function renderMe() {
  const r = state.reading;
  const c = r.chart;
  const me = c.day.stem;
  const cols = [['시주', c.hour], ['일주', c.day], ['월주', c.month], ['연주', c.year]];
  const table = $('pillars');
  table.replaceChildren();
  const row = (fn) => table.append(el('tr', {}, ...cols.map(([label, p]) => fn(label, p))));
  row((label) => el('th', { textContent: label }));
  row((label, p) => el('td', { className: 'god', textContent: p ? (label === '일주' ? '나' : tenGod(me, p.stem)) : '' }));
  row((label, p) => (p ? cell(STEMS[p.stem], HANJA_STEMS[p.stem], STEM_ELEMENT[p.stem], label === '일주' ? 'me-cell' : '') : emptyCell()));
  row((label, p) => (p ? cell(BRANCHES[p.branch], HANJA_BRANCHES[p.branch], BRANCH_ELEMENT[p.branch]) : emptyCell()));
  row((label, p) => el('td', { className: 'god', textContent: p ? branchGod(me, p.branch) : '' }));
  $('hour-missing').hidden = !!c.hour;

  const info = r.info;
  $('bars').replaceChildren(...info.counts.map((n, e) => {
    const fill = el('span', { className: 'bar-fill' });
    fill.style.cssText = `display:block;width:${Math.round((n / info.total) * 100)}%;background:${ELEMENT_COLORS[e]}`;
    return el('div', { className: 'bar' }, el('span', { textContent: ELEMENT_LABEL[e] }), el('span', { className: 'bar-track' }, fill), el('span', { className: 'bar-n', textContent: `${n}개` }));
  }));
  const em = STEM_ELEMENT[me];
  $('strength').textContent = info.strong
    ? `일간 ${ELEMENT_LABEL[em]}을 돕는 기운이 많은 신강(身強) 사주예요. 힘이 넘치니 내보내고 쓰는 기운이 필요해요.`
    : `일간 ${ELEMENT_LABEL[em]}을 돕는 기운이 적은 신약(身弱) 사주예요. 나를 받쳐 주는 기운이 필요해요.`;
  $('yong').textContent = `그래서 나에게 필요한 기운(용신)은 ${ELEMENT_LABEL[info.yong]}. 행운의 색·방향·숫자·시간은 여기서 나와요.`;

  const lf = life(c);
  $('life').replaceChildren(el('h2', { textContent: '평생 사주 풀이' }), ...lf.sections.map((s) => el('div', { className: 'csec' }, el('h3', { textContent: s.title }), ...s.items.map((t) => el('p', { textContent: t })))));
  renderDaeun();
}

function renderDaeun() {
  const box = $('daeun');
  const c = state.chart;
  const dr = daeunReading(c, state.birth.gender, state.birth.y);
  if (!dr) {
    box.replaceChildren(
      el('h2', { textContent: '대운 (10년마다 바뀌는 큰 운)' }),
      el('p', { className: 'soft', textContent: '대운은 성별에 따라 흐르는 방향이 달라서 성별이 필요해요.' }),
      el('div', { className: 'row' },
        el('button', { className: 'btn btn-sub', type: 'button', textContent: '여자', onclick: () => setGender('F') }),
        el('button', { className: 'btn btn-sub', type: 'button', textContent: '남자', onclick: () => setGender('M') })),
    );
    return;
  }
  const list = dr.list.filter((x) => x.age <= 90);
  const host = el('div');
  box.replaceChildren(
    el('h2', { textContent: '대운 (10년마다 바뀌는 큰 운)' }),
    el('p', { className: 'soft small', textContent: `${dr.startAge}세부터 ${dr.forward ? '순행' : '역행'}으로 10년마다 바뀌어요. 지금 대운은 진하게 표시했어요.` }),
    host,
    el('ul', { className: 'notes' }, ...list.map((x) => el('li', { className: x.now ? 'now' : '', textContent: `${x.age}~${x.age + 9}세 ${x.pillar.name}(${HANJA_STEMS[x.pillar.stem]}${HANJA_BRANCHES[x.pillar.branch]}) · ${x.god} · ${x.score}점 — ${x.text}` }))),
  );
  barChart(host, list.map((x) => ({ label: `${x.age}`, value: x.score, tip: `${x.age}~${x.age + 9}세 · ${x.score}점 · ${x.god}`, strong: x.now })), { height: 160 });
}

function setGender(g) {
  state.birth = { ...state.birth, gender: g };
  saveBirth(state.birth);
  $('gender').value = g;
  renderDaeun();
}

// --- 결과 보이기 --------------------------------------------------------------------
async function show(birth, quick = false) {
  const chart = fourPillars(birth, lunarToSolar);
  if (!chart) {
    $('error').textContent = '없는 음력 날짜야. 윤달 여부를 확인해 줘';
    return;
  }
  state.birth = birth;
  state.chart = chart;
  const r = reading(chart, todayKST());
  state.reading = r;
  state.images = {};
  state.rendered = {};
  await ensureFonts(cardTexts(r));
  $('card').src = renderCard(r, 'feed').toDataURL('image/png');

  $('intro').hidden = true;
  $('friend').hidden = true;
  $('result').hidden = false;
  renderToday(r);
  selectTab('today');
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
  for (const h of HOURS) {
    $('hour').append(new Option(h.label, h.key));
    $('chour').append(new Option(h.label, h.key));
  }

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
    $('gender').value = saved.gender || '';
    if (!document.body.dataset.friend) show(saved, true);
  }

  document.querySelectorAll('[data-cal]').forEach((b) => b.addEventListener('click', () => {
    state.calendar = b.dataset.cal;
    setSeg('cal', state.calendar);
    $('leap-row').hidden = state.calendar !== 'lunar';
  }));
  document.querySelectorAll('[data-ccal]').forEach((b) => b.addEventListener('click', () => {
    state.ccalendar = b.dataset.ccal;
    setSeg('ccal', state.ccalendar);
    $('cleap-row').hidden = state.ccalendar !== 'lunar';
  }));
  document.querySelectorAll('[data-format]').forEach((b) => b.addEventListener('click', () => {
    state.format = b.dataset.format;
    setSeg('format', state.format);
  }));
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => selectTab(t.dataset.tab)));

  $('birth').addEventListener('input', () => { $('error').textContent = ''; });
  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = parseBirth($('birth').value, state.calendar);
    if (p.error) { $('error').textContent = p.error; return; }
    const birth = { ...p, lunar: state.calendar === 'lunar', leap: state.calendar === 'lunar' && $('leap').checked, hour: $('hour').value || null, gender: $('gender').value || null };
    saveBirth(birth);
    show(birth);
  });
  $('cform').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = parseBirth($('cbirth').value, state.ccalendar);
    if (p.error) { $('cerror').textContent = p.error; return; }
    $('cerror').textContent = '';
    const other = fourPillars({ ...p, lunar: state.ccalendar === 'lunar', leap: state.ccalendar === 'lunar' && $('cleap').checked, hour: $('chour').value || null }, lunarToSolar);
    if (!other) { $('cerror').textContent = '없는 음력 날짜야. 윤달 여부를 확인해 줘'; return; }
    renderCompat(other);
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
    $('again').hidden = true;
    $('intro').hidden = false;
    $('birth').value = '';
    $('birth').focus();
  });

  tickClock();
  setInterval(tickClock, 1000);
}

init();
