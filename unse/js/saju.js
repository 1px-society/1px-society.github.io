// 사주 계산: 사주팔자(연·월·일·시주), 십신, 12운성, 신살, 합·충·형, 용신. 브라우저와 node(tools/)가 함께 쓴다.

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
export const ROMAN_STEM = ['gap', 'eul', 'byeong', 'jeong', 'mu', 'gi', 'gyeong', 'sin', 'im', 'gye'];
export const ROMAN_BRANCH = ['ja', 'chuk', 'in', 'myo', 'jin', 'sa', 'o', 'mi', 'sin', 'yu', 'sul', 'hae'];

// 오행: 0 목, 1 화, 2 토, 3 금, 4 수
export const ELEMENTS = ['목', '화', '토', '금', '수'];
export const ELEMENT_COLOR_WORD = ['푸른', '붉은', '노란', '하얀', '검은'];
export const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
// 하도(河圖) 수: 목 3·8, 화 2·7, 토 5·10, 금 4·9, 수 1·6
export const ELEMENT_NUMBERS = [[3, 8], [2, 7], [5, 10], [4, 9], [1, 6]];

const generates = (e) => (e + 1) % 5; // 목→화→토→금→수→목
const controls = (e) => (e + 2) % 5; // 목→토, 화→금, 토→수, 금→목, 수→화
const generatedBy = (e) => (e + 4) % 5;

export function julianDayNumber(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

// 0 = 갑자. 1949-10-01이 갑자일이다.
export function dayPillarIndex(y, m, d) {
  return (((julianDayNumber(y, m, d) + 49) % 60) + 60) % 60;
}

export function pillar(index) {
  const stem = index % 10;
  const branch = index % 12;
  const element = STEM_ELEMENT[stem];
  return {
    index,
    stem,
    branch,
    element,
    name: STEMS[stem] + BRANCHES[branch],
    animal: ANIMALS[branch],
    colorWord: ELEMENT_COLOR_WORD[element],
    id: `${ROMAN_STEM[stem]}-${ROMAN_BRANCH[branch]}`,
  };
}

export function pillarById(id) {
  for (let i = 0; i < 60; i++) if (pillar(i).id === id) return pillar(i);
  return null;
}

export function addDays(y, m, d, n) {
  const t = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

// 한국 날짜(KST) 기준 오늘
export function todayKST(now = Date.now()) {
  const t = new Date(now + 9 * 3600000);
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

export function msUntilNextKSTMidnight(now = Date.now()) {
  const t = now + 9 * 3600000;
  return 86400000 - (t % 86400000);
}

// 십신: 내 일간(me)에서 본 오늘 천간(other)
export const TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];

export function tenGod(me, other) {
  const em = STEM_ELEMENT[me];
  const eo = STEM_ELEMENT[other];
  const samePolarity = me % 2 === other % 2;
  let k;
  if (em === eo) k = 0;
  else if (generates(em) === eo) k = 2;
  else if (controls(em) === eo) k = 4;
  else if (controls(eo) === em) k = 6;
  else k = 8; // generates(eo) === em
  return TEN_GODS[k + (samePolarity ? 0 : 1)];
}

const SIX_HARMONY = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const THREE_HARMONY = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];

export function isValidSolar(y, m, d) {
  if (!(y >= 1900 && y <= 2050 && m >= 1 && m <= 12 && d >= 1)) return false;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

// --- 사주팔자(연·월·일·시주) --------------------------------------------------------

export const HANJA_STEMS = '甲乙丙丁戊己庚辛壬癸';
export const HANJA_BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
export const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
// 지지의 본기(지장간 정기): 子癸 丑己 寅甲 卯乙 辰戊 巳丙 午丁 未己 申庚 酉辛 戌戊 亥壬
export const BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];
export const ELEMENT_HANJA = ['木', '火', '土', '金', '水'];
const controlledBy = (e) => (e + 3) % 5; // e를 극하는 오행

// 태어난 시: 시진(한국 표준시는 경도 135° 기준이라 30분 늦춰 23:30부터 자시). ja-late는 밤 23:30~24:00(다음 날 일주).
export const HOURS = [
  { key: 'ja-late', branch: 0, label: '자시 · 밤 23:30~24:00', minutes: 23 * 60 + 45, nextDay: true },
  { key: 'ja', branch: 0, label: '자시 · 00:00~01:29', minutes: 45 },
  { key: 'chuk', branch: 1, label: '축시 · 01:30~03:29', minutes: 150 },
  { key: 'in', branch: 2, label: '인시 · 03:30~05:29', minutes: 270 },
  { key: 'myo', branch: 3, label: '묘시 · 05:30~07:29', minutes: 390 },
  { key: 'jin', branch: 4, label: '진시 · 07:30~09:29', minutes: 510 },
  { key: 'sa', branch: 5, label: '사시 · 09:30~11:29', minutes: 630 },
  { key: 'o', branch: 6, label: '오시 · 11:30~13:29', minutes: 750 },
  { key: 'mi', branch: 7, label: '미시 · 13:30~15:29', minutes: 870 },
  { key: 'sin', branch: 8, label: '신시 · 15:30~17:29', minutes: 990 },
  { key: 'yu', branch: 9, label: '유시 · 17:30~19:29', minutes: 1110 },
  { key: 'sul', branch: 10, label: '술시 · 19:30~21:29', minutes: 1230 },
  { key: 'hae', branch: 11, label: '해시 · 21:30~23:29', minutes: 1350 },
];

// 간지 번호(0=갑자)를 천간·지지로 찾기: index ≡ stem (mod 10), index ≡ branch (mod 12)
export function pillarOf(stem, branch) {
  return pillar((((6 * stem - 5 * branch) % 60) + 60) % 60);
}

// 태양의 겉보기 황경(도). Meeus, Astronomical Algorithms 25장 저정밀식(오차 약 0.01°, 절기 시각으로 수 분).
export function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const rad = Math.PI / 180;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * rad;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
  return ((lambda % 360) + 360) % 360;
}

// 한국 시각(분) → 율리우스일(UT). 1987·1988년 여름 시간은 1시간 앞당겨져 있었다.
export function kstToJD(y, m, d, minutes) {
  let ut = Date.UTC(y, m - 1, d) + (minutes - 9 * 60) * 60000;
  if (inKoreanDST(y, m, d, minutes)) ut -= 3600000;
  return ut / 86400000 + 2440587.5;
}

function inKoreanDST(y, m, d, minutes) {
  const t = y * 1e8 + m * 1e6 + d * 1e4 + minutes;
  const windows = [[1987, 5, 10, 120, 1987, 10, 11, 180], [1988, 5, 8, 120, 1988, 10, 9, 180]];
  return windows.some(([y1, m1, d1, t1, y2, m2, d2, t2]) => t >= y1 * 1e8 + m1 * 1e6 + d1 * 1e4 + t1 && t < y2 * 1e8 + m2 * 1e6 + d2 * 1e4 + t2);
}

// 생일(양력, 시진 선택) → 네 기둥. hourKey가 없으면 시주는 null이고 정오로 연·월주를 정한다.
export function fourPillars({ y, m, d, lunar = false, leap = false, hour = null }, lunarToSolar) {
  let [sy, sm, sd] = [y, m, d];
  if (lunar) {
    const s = lunarToSolar(y, m, d, leap);
    if (!s) return null;
    [sy, sm, sd] = s;
  }
  const h = HOURS.find((x) => x.key === hour) || null;
  const minutes = h ? h.minutes : 12 * 60;
  const jd = kstToJD(sy, sm, sd, minutes);
  const lambda = sunLongitude(jd);

  // 연주: 입춘(황경 315°) 전이면 전해
  let sajuYear = sy;
  if (sm <= 2 && lambda >= 270 && lambda < 315) sajuYear -= 1;
  const yearP = pillar((((sajuYear - 4) % 60) + 60) % 60);

  // 월주: 입춘부터 30°마다 한 달(寅月부터)
  const k = Math.floor((((lambda - 315) % 360) + 360) % 360 / 30);
  const monthP = pillarOf(((yearP.stem % 5) * 2 + 2 + k) % 10, (2 + k) % 12);

  // 일주: 밤 23:30 이후 자시는 다음 날
  const [dy, dm, dd] = h && h.nextDay ? addDays(sy, sm, sd, 1) : [sy, sm, sd];
  const dayP = pillar(dayPillarIndex(dy, dm, dd));

  const hourP = h ? pillarOf(((dayP.stem % 5) * 2 + h.branch) % 10, h.branch) : null;
  return { solar: [sy, sm, sd], year: yearP, month: monthP, day: dayP, hour: hourP, lambda, jd };
}

// --- 원국 풀이: 십신, 오행 분포, 신강·신약, 용신 ---------------------------------------

export function branchGod(dayStem, branch) {
  return tenGod(dayStem, BRANCH_MAIN_STEM[branch]);
}

export function analyse(chart) {
  const me = chart.day.stem;
  const em = STEM_ELEMENT[me];
  const slots = [
    ['year', 'stem', 1], ['year', 'branch', 1], ['month', 'stem', 1], ['month', 'branch', 3],
    ['day', 'branch', 1.5], ['hour', 'stem', 1], ['hour', 'branch', 1],
  ];
  const counts = [0, 0, 0, 0, 0];
  counts[em] += 1;
  let mine = 1;
  let others = 0;
  for (const [p, part, w] of slots) {
    const pl = chart[p];
    if (!pl) continue;
    const e = part === 'stem' ? STEM_ELEMENT[pl.stem] : BRANCH_ELEMENT[pl.branch];
    counts[e] += 1;
    if (e === em || e === generatedBy(em)) mine += w;
    else others += w;
  }
  const strong = mine >= others;
  const order = strong ? [generates(em), controls(em), controlledBy(em)] : [generatedBy(em), em];
  let yong = order[0];
  for (const e of order) if (counts[e] < counts[yong]) yong = e;
  return {
    counts,
    total: counts.reduce((a, b) => a + b, 0),
    strong,
    ratio: mine / (mine + others),
    yong,
    hee: generatedBy(yong),
    gi: controlledBy(yong),
  };
}

// 12운성: 일간이 그 지지에서 얼마나 힘이 있나
export const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
export const STAGE_ENERGY = [4, 3, 4, 5, 5, 3, 2, 2, 2, 1, 2, 3];
const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
export function stage(stem, branch) {
  const s = STAGE_START[stem];
  return stem % 2 === 0 ? (branch - s + 12) % 12 : (s - branch + 12) % 12;
}

// 신살
const NOBLE = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 7: [2, 6], 8: [3, 5], 9: [3, 5] };
const MUNCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
function trio(branch) {
  if ([8, 0, 4].includes(branch)) return { dohwa: 9, yeokma: 2, hwagae: 4 };
  if ([2, 6, 10].includes(branch)) return { dohwa: 3, yeokma: 8, hwagae: 10 };
  if ([5, 9, 1].includes(branch)) return { dohwa: 6, yeokma: 11, hwagae: 1 };
  return { dohwa: 0, yeokma: 5, hwagae: 7 };
}

// 그 지지가 이 원국에 어떤 신살이 되는지(일간·일지·연지 기준)
export function shinsalOf(chart, branch) {
  const out = [];
  if (NOBLE[chart.day.stem].includes(branch)) out.push('천을귀인');
  if (MUNCHANG[chart.day.stem] === branch) out.push('문창귀인');
  const a = trio(chart.day.branch);
  const b = trio(chart.year.branch);
  if (a.dohwa === branch || b.dohwa === branch) out.push('도화');
  if (a.yeokma === branch || b.yeokma === branch) out.push('역마');
  if (a.hwagae === branch || b.hwagae === branch) out.push('화개');
  return out;
}

// 원국에 이미 있는 신살
export function natalShinsal(chart) {
  const set = new Set();
  for (const p of ['year', 'month', 'day', 'hour']) {
    const pl = chart[p];
    if (!pl) continue;
    for (const s of shinsalOf(chart, pl.branch)) {
      if ((s === '도화' || s === '역마' || s === '화개') && (p === 'day' || p === 'year')) {
        // 자기 자신을 기준으로 잡은 경우는 빼고, 다른 기둥 기준으로 맞으면 넣는다
        const other = p === 'day' ? trio(chart.year.branch) : trio(chart.day.branch);
        const key = { 도화: 'dohwa', 역마: 'yeokma', 화개: 'hwagae' }[s];
        if (other[key] !== pl.branch) continue;
      }
      set.add(s);
    }
  }
  return [...set];
}

// 오늘 지지와 원국 지지의 관계
const PUNISH = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]];
export function relation(a, b) {
  if (Math.abs(a - b) === 6) return 'clash';
  if (a === b && [4, 6, 9, 11].includes(a)) return 'punish';
  if (PUNISH.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 'punish';
  if (SIX_HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 'harmony';
  if (a !== b && THREE_HARMONY.some((g) => g.includes(a) && g.includes(b))) return 'trio';
  return 'none';
}

// --- 12신살(연지 삼합 기준), 원진, 천간합 -------------------------------------------

export const SINSAL12 = ['겁살', '재살', '천살', '지살', '년살', '월살', '망신살', '장성살', '반안살', '역마살', '육해살', '화개살'];
const HWAGAE_OF = (b) => ([8, 0, 4].includes(b) ? 4 : [2, 6, 10].includes(b) ? 10 : [5, 9, 1].includes(b) ? 1 : 7);
// 기준 지지(보통 연지)에서 본 그 지지의 12신살
export function sinsal12(base, branch) {
  return SINSAL12[(branch - (HWAGAE_OF(base) + 1) + 24) % 12];
}

// 원진: 子未 丑午 寅酉 卯申 辰亥 巳戌
const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
export function isWonjin(a, b) {
  return WONJIN.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

// 천간합: 甲己 乙庚 丙辛 丁壬 戊癸
export function stemsCombine(a, b) {
  return Math.abs(a - b) === 5;
}

// 오늘의 시진 12개(자시부터): 오늘 일간으로 시간의 천간을 정한다
export function hourPillarsOf(dayStem) {
  return HOURS.slice(1).map((h) => ({ ...h, pillar: pillarOf(((dayStem % 5) * 2 + h.branch) % 10, h.branch) }));
}

// 지금 이 순간(한국 시각)의 월주·연주
export function monthYearNow(now = Date.now()) {
  const t = new Date(now + 9 * 3600000);
  const [y, m, d] = [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
  const minutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  const lambda = sunLongitude(kstToJD(y, m, d, minutes));
  let sajuYear = y;
  if (m <= 2 && lambda >= 270 && lambda < 315) sajuYear -= 1;
  const yearP = pillar((((sajuYear - 4) % 60) + 60) % 60);
  const k = Math.floor((((lambda - 315) % 360) + 360) % 360 / 30);
  const monthP = pillarOf(((yearP.stem % 5) * 2 + 2 + k) % 10, (2 + k) % 12);
  return { year: yearP, month: monthP, sajuYear };
}

export function yearPillar(sajuYear) {
  return pillar((((sajuYear - 4) % 60) + 60) % 60);
}

export const ELEMENT_OF = { stem: (s) => STEM_ELEMENT[s], branch: (b) => BRANCH_ELEMENT[b] };

// --- 대운: 순행(양남·음녀)은 다음 절기, 역행(음남·양녀)은 지난 절기까지의 날수 ÷ 3 = 대운이 시작되는 나이 ---
function termIndex(jd) {
  return Math.floor((((sunLongitude(jd) - 15) % 360) + 360) % 360 / 30);
}
function nextTermJD(jd, dir) {
  const k = termIndex(jd);
  let a = jd;
  let b = jd + dir * 0.5;
  for (let i = 0; i < 80 && termIndex(b) === k; i++) { a = b; b += dir * 0.5; }
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    if (termIndex(mid) === k) a = mid; else b = mid;
  }
  return b;
}
export function daeun(chart, gender) {
  if (!gender || !chart.jd) return null;
  const yangYear = chart.year.stem % 2 === 0;
  const forward = (yangYear && gender === 'M') || (!yangYear && gender === 'F');
  const days = Math.abs(nextTermJD(chart.jd, forward ? 1 : -1) - chart.jd);
  const startAge = Math.max(1, Math.round(days / 3));
  const list = [];
  for (let i = 1; i <= 10; i++) {
    const idx = (((chart.month.index + (forward ? i : -i)) % 60) + 60) % 60;
    list.push({ age: startAge + (i - 1) * 10, pillar: pillar(idx) });
  }
  return { forward, startAge, list };
}
