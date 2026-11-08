// 오늘의 운세: 오늘 일진(날짜의 간지)이 내 사주 원국에 무엇이 되는지로 정한다.
//   십신(오늘 천간 ↔ 내 일간), 12운성(내 일간이 오늘 지지에서 갖는 힘), 오늘 지지와 원국 지지의 합·충·형,
//   오늘 드는 신살(천을귀인·문창·도화·역마·화개), 용신(원국에 필요한 오행)과 오늘 오행의 궁합.
// 같은 날 같은 원국이면 같은 운세가 나온다. 문장 고르기만 날짜+원국 해시로 정한다.
import { pillar, dayPillarIndex, tenGod, STEM_ELEMENT, BRANCH_ELEMENT, ELEMENT_NUMBERS, STAGES, STAGE_ENERGY, stage, shinsalOf, relation, analyse, natalShinsal } from './saju.js';
import {
  STARS, KEYWORD, HEADLINE, DETAIL, LOVE, MONEY, WORK, MANTRA, LUCKY_COLORS, LUCKY_ITEMS, TAGLINE, GOD_GLOSS, STAGE_TEXT,
  PILLAR_ROLE, RELATION_TEXT, SHINSAL_TEXT, LOVE_DOHWA, LOVE_CLASH, WORK_MUNCHANG, DIRECTIONS, LUCKY_TIME,
} from './data.js';

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}

const pick = (list, key) => list[hash(key) % list.length];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const PILLARS = ['year', 'month', 'day', 'hour'];

export function chartKey(chart) {
  return PILLARS.map((p) => (chart[p] ? chart[p].index : 'x')).join('-');
}

export function reading(chart, [y, m, d]) {
  const me = chart.day;
  const today = pillar(dayPillarIndex(y, m, d));
  const info = analyse(chart);
  const god = tenGod(me.stem, today.stem);
  const st = STAGES[stage(me.stem, today.branch)];
  const energy = STAGE_ENERGY[stage(me.stem, today.branch)];
  const shinsal = shinsalOf(chart, today.branch);
  const relations = PILLARS.filter((p) => chart[p]).map((p) => ({ pillar: p, type: relation(today.branch, chart[p].branch) })).filter((r) => r.type !== 'none');
  const has = (p, t) => relations.some((r) => r.pillar === p && r.type === t);

  // 오늘 천간·지지 오행이 용신·희신이면 +, 기신이면 −
  const favor = [STEM_ELEMENT[today.stem], BRANCH_ELEMENT[today.branch]]
    .reduce((s, e) => s + (e === info.yong || e === info.hee ? 1 : e === info.gi ? -1 : 0), 0);

  const key = `${y}-${m}-${d}|${chartKey(chart)}`;
  const base = STARS[god];
  const energyAdj = (energy - 3) * 0.25;
  const jitter = (cat) => ((hash(`${key}|${cat}`) % 3) - 1) * 0.25;
  const harmonyAny = relations.some((r) => r.type === 'harmony' || r.type === 'trio');
  const clashAny = relations.some((r) => r.type === 'clash' || r.type === 'punish');
  const star = (v) => clamp(Math.round(v), 1, 5);

  const total = star(base.total + energyAdj + favor * 0.5 + (shinsal.includes('천을귀인') ? 0.5 : 0) + (harmonyAny ? 0.25 : 0) - (clashAny ? 0.5 : 0) + jitter('t'));
  const love = star(base.love + favor * 0.25 + (shinsal.includes('도화') ? 1 : 0) + (has('day', 'harmony') || has('day', 'trio') ? 0.5 : 0) - (has('day', 'clash') || has('day', 'punish') ? 0.75 : 0) + jitter('l'));
  const money = star(base.money + favor * 0.5 + (has('month', 'clash') ? -0.25 : 0) + jitter('m'));
  const work = star(base.work + energyAdj + (shinsal.includes('문창귀인') ? 0.75 : 0) + (has('month', 'harmony') || has('month', 'trio') ? 0.5 : 0) - (has('month', 'clash') || has('month', 'punish') ? 0.5 : 0) + jitter('w'));

  let loveText = pick(LOVE[god], `${key}|l`);
  if (shinsal.includes('도화')) loveText = pick(LOVE_DOHWA, `${key}|ld`);
  else if (has('day', 'clash') || has('day', 'punish')) loveText = pick(LOVE_CLASH, `${key}|lc`);
  const workText = shinsal.includes('문창귀인') ? pick(WORK_MUNCHANG, `${key}|wm`) : pick(WORK[god], `${key}|w`);

  const notes = [
    STAGE_TEXT[st],
    ...relations.map((r) => RELATION_TEXT[r.type](PILLAR_ROLE[r.pillar])),
    ...shinsal.map((s) => SHINSAL_TEXT[s]),
  ];

  const yong = info.yong;
  return {
    date: [y, m, d],
    today,
    chart,
    me,
    info,
    god,
    gloss: GOD_GLOSS[god],
    stage: st,
    shinsal,
    natal: natalShinsal(chart),
    favor,
    keyword: KEYWORD[god],
    tagline: TAGLINE[me.name],
    headline: pick(HEADLINE[god], `${key}|h`),
    detail: pick(DETAIL[god], `${key}|d`),
    notes,
    total,
    love: { stars: love, text: loveText },
    money: { stars: money, text: pick(MONEY[god], `${key}|m`) },
    work: { stars: work, text: workText },
    lucky: {
      element: yong,
      color: pick(LUCKY_COLORS[yong], `${key}|c`),
      direction: DIRECTIONS[yong],
      number: pick(ELEMENT_NUMBERS[yong], `${key}|n`),
      time: LUCKY_TIME[yong],
      item: pick(LUCKY_ITEMS[yong], `${key}|i`),
    },
    mantra: pick(MANTRA, `${key}|t`),
  };
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function dateLabel([y, m, d]) {
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}월 ${d}일 ${DAYS[w]}요일`;
}

export function shareText(r) {
  const s = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  return [
    `🔮 ${dateLabel(r.date)} 오늘의 운세 (${r.today.name}일)`,
    `${r.me.name}일주 · ${r.me.colorWord} ${r.me.animal} · 오늘은 ${r.god}의 날${r.shinsal.length ? ` · ${r.shinsal.join('·')}` : ''}`,
    `“${r.headline}”`,
    `총운 ${s(r.total)}`,
    `연애 ${s(r.love.stars)} · 재물 ${s(r.money.stars)} · 공부·일 ${s(r.work.stars)}`,
    `행운 컬러 ${r.lucky.color.name} · 방향 ${r.lucky.direction} · 숫자 ${r.lucky.number}`,
  ].join('\n');
}
