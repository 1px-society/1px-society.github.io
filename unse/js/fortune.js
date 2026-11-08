// 오늘의 운세 고르기. 결과는 (내 일주, 날짜)로만 정해진다: 같은 날 같은 일주면 같은 운세.
import { pillar, dayPillarIndex, tenGod, branchRelation, goodMatches, luckyElement, ELEMENT_NUMBERS, ANIMALS } from './saju.js';
import { STARS, KEYWORD, HEADLINE, DETAIL, LOVE, MONEY, WORK, RELATION, RELATION_BONUS, MANTRA, LUCKY_COLORS, LUCKY_ITEMS, TAGLINE } from './data.js';

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

export function reading(me, [y, m, d]) {
  const today = pillar(dayPillarIndex(y, m, d));
  const god = tenGod(me.stem, today.stem);
  const rel = branchRelation(me.branch, today.branch);
  const key = `${y}-${m}-${d}|${me.index}`;
  const base = STARS[god];
  const bonus = RELATION_BONUS[rel];
  const star = (cat) => clamp(Math.round(base[cat] + (bonus[cat] || 0) + ((hash(`${key}|${cat}`) % 3) - 1) * 0.5), 2, 5);
  const luckyEl = luckyElement(me.stem, today.stem);
  const matches = goodMatches(me.branch);
  return {
    date: [y, m, d],
    today,
    me,
    god,
    rel,
    keyword: KEYWORD[god],
    tagline: TAGLINE[me.name],
    headline: pick(HEADLINE[god], `${key}|h`),
    detail: pick(DETAIL[god], `${key}|d`),
    relationNote: pick(RELATION[rel], `${key}|r`),
    total: star('total'),
    love: { stars: star('love'), text: pick(LOVE[god], `${key}|l`) },
    money: { stars: star('money'), text: pick(MONEY[god], `${key}|m`) },
    work: { stars: star('work'), text: pick(WORK[god], `${key}|w`) },
    lucky: {
      element: luckyEl,
      color: pick(LUCKY_COLORS[luckyEl], `${key}|c`),
      item: pick(LUCKY_ITEMS[luckyEl], `${key}|i`),
      number: pick(ELEMENT_NUMBERS[luckyEl], `${key}|n`),
    },
    match: ANIMALS[pick(matches, `${key}|x`)],
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
    `🔮 ${dateLabel(r.date)} 오늘의 운세`,
    `${r.me.name}일주 · ${r.me.colorWord} ${r.me.animal}`,
    `“${r.headline}”`,
    `총운 ${s(r.total)}`,
    `연애 ${s(r.love.stars)} · 돈 ${s(r.money.stars)} · 공부·일 ${s(r.work.stars)}`,
    `행운 컬러 ${r.lucky.color.name} · 아이템 ${r.lucky.item} · 숫자 ${r.lucky.number}`,
  ].join('\n');
}
