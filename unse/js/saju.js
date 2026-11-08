// 사주 계산: 일주(날짜의 간지), 십신, 지지 관계. 브라우저와 node(tools/)가 함께 쓴다.

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

// 내 일지와 오늘 지지의 관계
export function branchRelation(a, b) {
  if (a === b) return 'same';
  if (SIX_HARMONY.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 'harmony';
  if (Math.abs(a - b) === 6) return 'clash';
  if (THREE_HARMONY.some((g) => g.includes(a) && g.includes(b))) return 'trio';
  return 'none';
}

// 나와 잘 맞는 띠: 육합 짝과 삼합 짝
export function goodMatches(branch) {
  const out = [];
  for (const [x, y] of SIX_HARMONY) {
    if (x === branch) out.push(y);
    if (y === branch) out.push(x);
  }
  for (const g of THREE_HARMONY) if (g.includes(branch)) for (const b of g) if (b !== branch) out.push(b);
  return out;
}

// 오늘의 행운 오행: 나와 오늘 사이를 잇는 오행(통관)
export function luckyElement(me, other) {
  const em = STEM_ELEMENT[me];
  const eo = STEM_ELEMENT[other];
  if (em === eo) return generates(em); // 기운이 넘치면 내보낸다
  if (generates(em) === eo) return generatedBy(em); // 내보낸 만큼 채운다
  if (controls(em) === eo) return generates(em); // 나 → 식상 → 재
  if (controls(eo) === em) return generatedBy(em); // 관 → 인성 → 나
  return generates(em); // 받은 만큼 표현한다
}

// 생일 → 일주. 음력이면 양력으로 바꾼 뒤 계산한다. lateNight는 밤 11시 30분 이후 출생(자시는 다음 날로 본다).
export function birthPillar({ y, m, d, lunar = false, leap = false, lateNight = false }, lunarToSolar) {
  let [sy, sm, sd] = [y, m, d];
  if (lunar) {
    const s = lunarToSolar(y, m, d, leap);
    if (!s) return null;
    [sy, sm, sd] = s;
  }
  if (lateNight) [sy, sm, sd] = addDays(sy, sm, sd, 1);
  return { solar: [sy, sm, sd], ...pillar(dayPillarIndex(sy, sm, sd)) };
}

export function isValidSolar(y, m, d) {
  if (!(y >= 1900 && y <= 2050 && m >= 1 && m <= 12 && d >= 1)) return false;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
