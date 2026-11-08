// 운세 풀이. 모두 "그 시점의 간지(일진·월운·세운·대운·시진)가 내 사주 원국에 무엇이 되는지"로 정한다.
//   십신(그 천간 ↔ 내 일간), 12운성(내 일간이 그 지지에서 갖는 힘), 원국 지지와의 합·반합·충·형,
//   12신살(내 띠 기준), 천을·문창귀인(내 일간 기준), 용신(원국에 필요한 오행)과의 궁합.
// 같은 날 같은 원국이면 같은 결과가 나온다. 문장 고르기만 날짜+원국 해시로 정한다.
import {
  pillar, dayPillarIndex, addDays, tenGod, STEM_ELEMENT, BRANCH_ELEMENT, ELEMENT_NUMBERS, STAGES, STAGE_ENERGY, stage, relation, analyse,
  natalShinsal, sinsal12, isWonjin, stemsCombine, hourPillarsOf, monthYearNow, yearPillar, branchGod, ANIMALS, daeun as daeunPillars, pillarOf,
} from './saju.js';
import {
  STARS, KEYWORD, HEADLINE, DETAIL, LOVE, MONEY, WORK, MANTRA, LUCKY_COLORS, LUCKY_ITEMS, TAGLINE, GOD_GLOSS, STAGE_TEXT, PILLAR_ROLE,
  RELATION_TEXT, SHINSAL_TEXT, LOVE_DOHWA, LOVE_CLASH, WORK_MUNCHANG, DIRECTIONS, LUCKY_TIME, SINSAL12_TEXT, SINSAL12_ADJ, ORGAN, HEALTH,
  GAEUN_FOOD, GAEUN_ACTION, MONTH_TEXT, YEAR_TEXT, COMPAT_STEM, COMPAT_BRANCH, COMPAT_ZODIAC, COMPAT_LABEL, GROUP_OF, GROUP_MANY, GROUP_NONE,
  CAREER, LOVE_STYLE, MONEY_STYLE, ELEMENT_EXCESS, ELEMENT_LACK, DAEUN_TEXT, ILGAN_TEXT, NATAL_SHINSAL_TEXT,
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
const NOBLE = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 7: [2, 6], 8: [3, 5], 9: [3, 5] };
const MUNCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];

export function chartKey(chart) {
  return PILLARS.map((p) => (chart[p] ? chart[p].index : 'x')).join('-');
}

// 점수(0~100)와 별점(1~5)
const toScore = (raw) => clamp(Math.round(50 + (raw - 3) * 16), 28, 99);
export const toStars = (score) => clamp(Math.round((score - 20) / 16), 1, 5);

// 어떤 간지 하나(일진·월운·세운·대운·시진)가 원국에 미치는 영향
function evaluate(chart, info, p) {
  const me = chart.day;
  const god = tenGod(me.stem, p.stem);
  const st = stage(me.stem, p.branch);
  const energy = STAGE_ENERGY[st];
  const relations = PILLARS.filter((k) => chart[k]).map((k) => ({ pillar: k, type: relation(p.branch, chart[k].branch) })).filter((r) => r.type !== 'none');
  const has = (k, t) => relations.some((r) => r.pillar === k && r.type === t);
  const favor = [STEM_ELEMENT[p.stem], BRANCH_ELEMENT[p.branch]].reduce((s, e) => s + (e === info.yong || e === info.hee ? 1 : e === info.gi ? -1 : 0), 0);
  const nobles = [];
  if (NOBLE[me.stem].includes(p.branch)) nobles.push('천을귀인');
  if (MUNCHANG[me.stem] === p.branch) nobles.push('문창귀인');
  const s12 = sinsal12(chart.year.branch, p.branch);
  const adj = SINSAL12_ADJ[s12];
  const harmonyAny = relations.some((r) => r.type === 'harmony' || r.type === 'trio');
  const clashAny = relations.some((r) => r.type === 'clash' || r.type === 'punish');
  const energyAdj = (energy - 3) * 0.25;
  const base = STARS[god];
  const raw = {
    total: base.total + energyAdj + favor * 0.5 + (nobles.includes('천을귀인') ? 0.5 : 0) + (harmonyAny ? 0.25 : 0) - (clashAny ? 0.5 : 0) + (adj.total || 0),
    love: base.love + favor * 0.25 + (adj.love || 0) + (has('day', 'harmony') || has('day', 'trio') ? 0.5 : 0) - (has('day', 'clash') || has('day', 'punish') ? 0.75 : 0),
    money: base.money + favor * 0.5 + (adj.money || 0) - (has('month', 'clash') ? 0.25 : 0),
    work: base.work + energyAdj + (adj.work || 0) + (nobles.includes('문창귀인') ? 0.75 : 0) + (has('month', 'harmony') || has('month', 'trio') ? 0.5 : 0) - (has('month', 'clash') || has('month', 'punish') ? 0.5 : 0),
    health: 3.4 + energyAdj * 2 + favor * 0.25 + (adj.health || 0) - ((god === '편관' || god === '정관') && !info.strong ? 0.75 : 0) - (has('day', 'clash') || has('day', 'punish') ? 0.5 : 0),
  };
  return { god, stage: STAGES[st], energy, relations, has, favor, nobles, s12, raw };
}

// 오늘의 운세(하루)
export function reading(chart, [y, m, d]) {
  const me = chart.day;
  const info = analyse(chart);
  const today = pillar(dayPillarIndex(y, m, d));
  const e = evaluate(chart, info, today);
  const key = `${y}-${m}-${d}|${chartKey(chart)}`;
  const jitter = (cat) => ((hash(`${key}|${cat}`) % 5) - 2) * 0.08;
  const score = toScore(e.raw.total + jitter('t'));
  const cat = (k) => toScore(e.raw[k] + jitter(k));

  let loveText = pick(LOVE[e.god], `${key}|l`);
  if (e.s12 === '년살') loveText = pick(LOVE_DOHWA, `${key}|ld`);
  else if (e.has('day', 'clash') || e.has('day', 'punish')) loveText = pick(LOVE_CLASH, `${key}|lc`);
  const workText = e.nobles.includes('문창귀인') ? pick(WORK_MUNCHANG, `${key}|wm`) : pick(WORK[e.god], `${key}|w`);
  const healthScore = cat('health');
  const weakEl = (e.god === '편관' || e.god === '정관') ? STEM_ELEMENT[me.stem] : info.counts.indexOf(Math.min(...info.counts));
  const healthLevel = healthScore >= 70 ? 'good' : healthScore >= 50 ? 'normal' : 'caution';
  const healthText = `${pick(HEALTH[healthLevel], `${key}|h`)}. ${ORGAN[weakEl]} 쪽을 아껴 주세요`;

  const hours = hourPillarsOf(today.stem).map((h) => {
    const he = evaluate(chart, info, h.pillar);
    return { key: h.key, branch: h.branch, label: h.label, pillar: h.pillar, score: toScore((he.raw.total + e.raw.total) / 2) };
  });
  // 추천은 깨어 있는 시간(진시~해시)에서 고른다
  const best = [...hours].filter((h) => h.branch >= 4).sort((a, b) => b.score - a.score)[0];

  const yong = info.yong;
  const badges = [...e.nobles, e.s12];
  return {
    date: [y, m, d],
    today,
    chart,
    me,
    info,
    god: e.god,
    gloss: GOD_GLOSS[e.god],
    stage: e.stage,
    s12: e.s12,
    nobles: e.nobles,
    shinsal: badges,
    natal: natalShinsal(chart),
    keyword: KEYWORD[e.god],
    tagline: TAGLINE[me.name],
    score,
    grade: grade(score),
    headline: pick(HEADLINE[e.god], `${key}|h`),
    detail: pick(DETAIL[e.god], `${key}|d`),
    notes: [
      STAGE_TEXT[e.stage],
      SINSAL12_TEXT[e.s12],
      ...e.relations.map((r) => RELATION_TEXT[r.type](PILLAR_ROLE[r.pillar])),
      ...e.nobles.map((s) => SHINSAL_TEXT[s]),
    ],
    total: toStars(score),
    love: { score: cat('love'), stars: toStars(cat('love')), text: loveText },
    money: { score: cat('money'), stars: toStars(cat('money')), text: pick(MONEY[e.god], `${key}|m`) },
    work: { score: cat('work'), stars: toStars(cat('work')), text: workText },
    health: { score: healthScore, stars: toStars(healthScore), text: healthText },
    hours,
    best,
    lucky: {
      element: yong,
      color: pick(LUCKY_COLORS[yong], `${key}|c`),
      direction: DIRECTIONS[yong],
      number: pick(ELEMENT_NUMBERS[yong], `${key}|n`),
      time: LUCKY_TIME[yong],
      item: pick(LUCKY_ITEMS[yong], `${key}|i`),
      food: GAEUN_FOOD[yong],
      action: GAEUN_ACTION[yong],
    },
    mantra: pick(MANTRA, `${key}|t`),
  };
}

export function grade(score) {
  if (score >= 90) return '대길(大吉)';
  if (score >= 78) return '길(吉)';
  if (score >= 62) return '소길(小吉)';
  if (score >= 48) return '평(平)';
  return '조심';
}

// 30일 달력: 날마다 점수와 좋은 일
export function calendar(chart, start, days = 30) {
  const info = analyse(chart);
  const out = [];
  let d = start;
  for (let i = 0; i < days; i++) {
    const p = pillar(dayPillarIndex(...d));
    const e = evaluate(chart, info, p);
    const key = `${d[0]}-${d[1]}-${d[2]}|${chartKey(chart)}`;
    const score = toScore(e.raw.total + ((hash(`${key}|t`) % 5) - 2) * 0.08);
    const tags = [];
    if (toScore(e.raw.love) >= 75) tags.push('데이트');
    if (toScore(e.raw.work) >= 75) tags.push('시험·면접');
    if (toScore(e.raw.money) >= 75) tags.push('돈·계약');
    out.push({ date: d, pillar: p, score, tags, god: e.god });
    d = addDays(...d, 1);
  }
  return out;
}

// 이번 달·올해·다음 해 운세
export function period(chart, p, kind, when = kind === 'year' ? '올해' : '이번 달') {
  const info = analyse(chart);
  const e = evaluate(chart, info, p);
  const score = toScore(e.raw.total);
  return {
    pillar: p,
    god: e.god,
    stage: e.stage,
    score,
    grade: grade(score),
    text: (kind === 'year' ? YEAR_TEXT : MONTH_TEXT)[e.god],
    notes: [STAGE_TEXT[e.stage].replace('오늘', when).replace('날', kind === 'year' ? '해' : '달').replace('해이에요', '해예요'), ...e.relations.map((r) => RELATION_TEXT[r.type](PILLAR_ROLE[r.pillar]).replace('오늘 일진', kind === 'year' ? `${when} 세운` : `${when} 월운`))],
    love: toStars(toScore(e.raw.love)),
    money: toStars(toScore(e.raw.money)),
    work: toStars(toScore(e.raw.work)),
    health: toStars(toScore(e.raw.health)),
  };
}

export function nowPeriods(chart, now = Date.now()) {
  const { year, month, sajuYear } = monthYearNow(now);
  const next = yearPillar(sajuYear + 1);
  // 다음 해 12달(寅月~丑月)
  const months = Array.from({ length: 12 }, (_, k) => {
    const mp = pillarOf(((next.stem % 5) * 2 + 2 + k) % 10, (2 + k) % 12);
    const r = period(chart, mp, 'month');
    return { k, label: `${['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '1'][k]}월`, ...r };
  });
  return {
    month: period(chart, month, 'month'),
    year: { sajuYear, ...period(chart, year, 'year') },
    next: { sajuYear: sajuYear + 1, ...period(chart, next, 'year', `${sajuYear + 1}년`), months },
  };
}

// 궁합
export function compat(a, b) {
  const sa = a.day.stem, sb = b.day.stem;
  const ea = STEM_ELEMENT[sa], eb = STEM_ELEMENT[sb];
  let stemType = 'clash';
  if (stemsCombine(sa, sb)) stemType = 'combine';
  else if (ea === eb) stemType = 'same';
  else if ((ea + 1) % 5 === eb || (eb + 1) % 5 === ea) stemType = 'feed';
  let br = relation(a.day.branch, b.day.branch);
  if (br === 'none' && isWonjin(a.day.branch, b.day.branch)) br = 'wonjin';
  const ia = analyse(a), ib = analyse(b);
  const giveA = ib.counts[ia.yong]; // b가 a에게 필요한 기운을 가진 만큼
  const giveB = ia.counts[ib.yong];
  let zodiac = 'none';
  const ya = a.year.branch, yb = b.year.branch;
  const zr = relation(ya, yb);
  if (zr === 'harmony' || zr === 'trio') zodiac = 'good';
  else if (zr === 'clash') zodiac = 'clash';
  else if (isWonjin(ya, yb)) zodiac = 'wonjin';
  const stemPts = { combine: 32, feed: 26, same: 22, clash: 16 }[stemType];
  const brPts = { harmony: 28, trio: 24, none: 18, punish: 11, wonjin: 10, clash: 8 }[br];
  const fill = Math.min(20, (giveA + giveB) * 5);
  const zPts = { good: 10, none: 7, wonjin: 4, clash: 3 }[zodiac];
  const score = clamp(stemPts + brPts + fill + zPts + 10, 35, 99);
  const label = COMPAT_LABEL.find(([min]) => score >= min)[1];
  const STEM_SHORT = { combine: '천간합 · 첫눈에 끌리는 사이', feed: '상생 · 챙겨 주고 기대는 사이', same: '비화 · 친구 같은 사이', clash: '상극 · 끌리지만 부딪히는 사이' };
  const BRANCH_SHORT = { harmony: '육합 · 생활 리듬이 찰떡', trio: '삼합 · 같은 목표를 향한 팀', clash: '충 · 생활 습관이 정반대', punish: '형 · 서로 말투 조심', wonjin: '원진 · 괜히 서운한 순간 주의', none: '무난 · 추억이 궁합을 키워요' };
  const ZODIAC_SHORT = { good: '서로 끌어 주는 사이', clash: '정반대라 배울 게 많은 사이', wonjin: '미워도 금방 풀리는 사이', none: '무난한 사이' };
  const elName = ['나무', '불', '흙', '쇠', '물'];
  return {
    score,
    label,
    short: [
      ['성격', STEM_SHORT[stemType]],
      ['생활', BRANCH_SHORT[br]],
      ['채움', giveA + giveB >= 3 ? `서로에게 필요한 기운 ${giveA + giveB}개 · 빈자리를 채워 줘요` : giveA + giveB >= 1 ? `서로에게 필요한 기운 ${giveA + giveB}개 · 한쪽이 더 채워 줘요` : '닮은 기운끼리 · 함께 만드는 습관이 중요해요'],
      ['띠', `${ANIMALS[ya]}띠 × ${ANIMALS[yb]}띠 · ${ZODIAC_SHORT[zodiac]}`],
    ],
    sections: [
      { title: '성격 궁합 (일간)', text: COMPAT_STEM[stemType] },
      { title: '생활 궁합 (일지)', text: COMPAT_BRANCH[br] },
      {
        title: '서로 채워 주는 기운',
        text: `내게 필요한 ${elName[ia.yong]} 기운을 상대가 ${giveA}개, 상대에게 필요한 ${elName[ib.yong]} 기운을 내가 ${giveB}개 갖고 있어요. ${giveA + giveB >= 3 ? '서로의 빈자리를 잘 채워 주는 사이예요.' : giveA + giveB >= 1 ? '한쪽이 조금 더 채워 주는 사이예요.' : '서로 채워 주는 기운은 적어서, 함께 만드는 습관이 중요해요.'}`,
      },
      { title: '띠 궁합 (연지)', text: COMPAT_ZODIAC[zodiac](ANIMALS[ya], ANIMALS[yb]) },
    ],
  };
}

// 평생 풀이
export function life(chart) {
  const info = analyse(chart);
  const me = chart.day.stem;
  const groups = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const k of PILLARS) {
    const p = chart[k];
    if (!p) continue;
    if (k !== 'day') groups[GROUP_OF[tenGod(me, p.stem)]] += 1;
    groups[GROUP_OF[branchGod(me, p.branch)]] += k === 'month' ? 1.5 : 1;
  }
  const order = Object.entries(groups).sort((x, y) => y[1] - x[1]);
  const top = order[0][0];
  const none = order.filter(([, n]) => n === 0).map(([g]) => g);
  const money = groups.재성 >= 2.5 ? 'many' : groups.재성 >= 1 ? 'some' : 'none';
  const maxEl = info.counts.indexOf(Math.max(...info.counts));
  const lack = info.counts.map((n, e) => (n === 0 ? e : -1)).filter((e) => e >= 0);
  return {
    groups,
    sections: [
      { title: '타고난 성격', items: [ILGAN_TEXT[me], GROUP_MANY[top], ...none.slice(0, 1).map((g) => GROUP_NONE[g])] },
      { title: '연애·결혼', items: [LOVE_STYLE[branchGod(me, chart.day.branch)]] },
      { title: '직업·적성', items: [CAREER[top], ...(order[1][1] > 0 ? [CAREER[order[1][0]].replace('맞는 일', '이것도 잘 맞아요')] : [])] },
      { title: '재물', items: [MONEY_STYLE[money]] },
      { title: '오행 체질·건강', items: [ELEMENT_EXCESS[maxEl], ...lack.map((e) => ELEMENT_LACK[e]), `약해지기 쉬운 곳: ${ORGAN[lack.length ? lack[0] : info.counts.indexOf(Math.min(...info.counts))]}`] },
      { title: '타고난 신살', items: natalShinsal(chart).length ? natalShinsal(chart).map((s) => NATAL_SHINSAL_TEXT[s]) : ['큰 신살 없이 무난하고 균형 잡힌 사주예요.'] },
    ],
  };
}

// 대운: 성별이 있을 때만
export function daeunReading(chart, gender, birthYear) {
  const d = daeunPillars(chart, gender);
  if (!d) return null;
  const info = analyse(chart);
  const thisYear = new Date(Date.now() + 9 * 3600000).getUTCFullYear();
  const age = thisYear - birthYear;
  return {
    ...d,
    list: d.list.map((x) => {
      const e = evaluate(chart, info, x.pillar);
      return { ...x, god: e.god, score: toScore(e.raw.total), text: DAEUN_TEXT[e.god], now: age >= x.age && age < x.age + 10 };
    }),
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
    `${r.me.name}일주 · ${r.me.colorWord} ${r.me.animal} · 오늘 ${r.score}점 ${r.grade}`,
    `“${r.headline}”`,
    `연애 ${s(r.love.stars)} · 재물 ${s(r.money.stars)} · 공부·일 ${s(r.work.stars)} · 건강 ${s(r.health.stars)}`,
    `행운 컬러 ${r.lucky.color.name} · 방향 ${r.lucky.direction} · 숫자 ${r.lucky.number}`,
  ].join('\n');
}
