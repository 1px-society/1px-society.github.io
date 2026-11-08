// 일주 공식(unse/js/saju.js)을 두 라이브러리와 비교한다.
//   lunar-javascript(중국 6tail): 八字 일주
//   korean-lunar-calendar(한국천문연구원 기준): 일진
import { createRequire } from 'node:module';
import { dayPillarIndex, pillar, addDays, tenGod, STEMS } from '../unse/js/saju.js';

const require = createRequire(import.meta.url);
const { Solar } = require('lunar-javascript');
const KoreanLunarCalendar = require('korean-lunar-calendar');

const HANJA_STEM = '甲乙丙丁戊己庚辛壬癸';
const HANJA_BRANCH = '子丑寅卯辰巳午未申酉戌亥';
const toKorean = (gz) => STEMS[HANJA_STEM.indexOf(gz[0])] + ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'][HANJA_BRANCH.indexOf(gz[1])];

let checked = 0;
const failures = [];

// 1950~2050년을 13일 간격으로 훑는다(약 2,800일)
let [y, m, d] = [1950, 1, 1];
while (y <= 2050) {
  const mine = pillar(dayPillarIndex(y, m, d)).name;
  const zh = toKorean(Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getDayInGanZhi());
  const cal = new KoreanLunarCalendar();
  cal.setSolarDate(y, m, d);
  const ko = cal.getKoreanGapja().day.replace(/일$/, '');
  if (mine !== zh || mine !== ko) failures.push(`${y}-${m}-${d}: 공식 ${mine}, lunar-javascript ${zh}, korean-lunar-calendar ${ko}`);
  checked++;
  [y, m, d] = addDays(y, m, d, 13);
}

// 알려진 기준일
const anchors = [
  [1949, 10, 1, '갑자'],
  [1990, 5, 15, '경진'], // manseryeok README 예시
  [2017, 6, 24, '임오'], // korean-lunar-calendar README 예시
];
for (const [ay, am, ad, want] of anchors) {
  const got = pillar(dayPillarIndex(ay, am, ad)).name;
  if (got !== want) failures.push(`기준일 ${ay}-${am}-${ad}: 공식 ${got}, 기대 ${want}`);
  checked++;
}

// 십신 표본: 갑목 일간 기준
const sample = STEMS.map((_, i) => tenGod(0, i)).join(' ');
const want = '비견 겁재 식신 상관 편재 정재 편관 정관 편인 정인';
if (sample !== want) failures.push(`십신(갑): ${sample} ≠ ${want}`);

if (failures.length) {
  console.error(`실패 ${failures.length}/${checked}`);
  console.error(failures.slice(0, 20).join('\n'));
  process.exit(1);
}
console.log(`일주 ${checked}일 모두 일치 (공식 = lunar-javascript = korean-lunar-calendar), 십신 표본 일치`);
