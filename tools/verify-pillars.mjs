// 사주 계산(unse/js/saju.js)을 두 라이브러리와 비교한다.
//   lunar-javascript(6tail): 八字 연·월·일·시주(절기는 베이징 시각 기준이라 한국 시각에서 1시간을 뺀다)
//   korean-lunar-calendar(한국천문연구원 기준): 일진
import { createRequire } from 'node:module';
import { dayPillarIndex, pillar, addDays, tenGod, STEMS, fourPillars, HOURS, sunLongitude, kstToJD } from '../unse/js/saju.js';

const require = createRequire(import.meta.url);
const { Solar } = require('lunar-javascript');
const KoreanLunarCalendar = require('korean-lunar-calendar');

const HANJA_STEM = '甲乙丙丁戊己庚辛壬癸';
const HANJA_BRANCH = '子丑寅卯辰巳午未申酉戌亥';
const BR = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const toKorean = (gz) => STEMS[HANJA_STEM.indexOf(gz[0])] + BR[HANJA_BRANCH.indexOf(gz[1])];

let checked = 0;
const failures = [];

// 1) 일주: 1950~2050년을 13일 간격으로
let [y, m, d] = [1950, 1, 1];
while (y <= 2050) {
  const mine = pillar(dayPillarIndex(y, m, d)).name;
  const zh = toKorean(Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getDayInGanZhi());
  const cal = new KoreanLunarCalendar();
  cal.setSolarDate(y, m, d);
  const ko = cal.getKoreanGapja().day.replace(/일$/, '');
  if (mine !== zh || mine !== ko) failures.push(`일주 ${y}-${m}-${d}: 공식 ${mine}, lunar-javascript ${zh}, korean-lunar-calendar ${ko}`);
  checked++;
  [y, m, d] = addDays(y, m, d, 13);
}

// 2) 연·월·시주: 1950~2049년 무작위 출생 4,000건. 절기 경계 ±40분 안은 뺀다(저정밀 황경식의 오차 범위).
let s = 12345;
const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
let skipped = 0;
for (let i = 0; i < 4000; i++) {
  const t = Date.UTC(1950, 0, 1) + Math.floor(rnd() * 100 * 365.2425) * 86400000;
  const dt = new Date(t);
  const [yy, mm, dd] = [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  const h = HOURS[1 + Math.floor(rnd() * 12)]; // ja-late 제외
  const near = [-40, 40].some((dm) => Math.floor(sunLongitude(kstToJD(yy, mm, dd, h.minutes + dm)) / 15) !== Math.floor(sunLongitude(kstToJD(yy, mm, dd, h.minutes)) / 15));
  if (near) { skipped++; continue; }
  const c = fourPillars({ y: yy, m: mm, d: dd, hour: h.key });
  // lunar-javascript: 한국 시각 → 베이징 시각(-1시간), 1987·88 여름 시간이면 -1시간 더
  let bj = Date.UTC(yy, mm - 1, dd) + (h.minutes - 60) * 60000;
  if ((yy === 1987 && (mm > 5 || (mm === 5 && dd >= 10)) && (mm < 10 || (mm === 10 && dd < 11))) || (yy === 1988 && (mm > 5 || (mm === 5 && dd >= 8)) && (mm < 10 || (mm === 10 && dd < 9)))) bj -= 3600000;
  const b = new Date(bj);
  const e = Solar.fromYmdHms(b.getUTCFullYear(), b.getUTCMonth() + 1, b.getUTCDate(), b.getUTCHours(), b.getUTCMinutes(), 0).getLunar().getEightChar();
  const want = [toKorean(e.getYear()), toKorean(e.getMonth())];
  const got = [c.year.name, c.month.name];
  if (want.join() !== got.join()) failures.push(`연·월주 ${yy}-${mm}-${dd} ${h.key}: 공식 ${got}, lunar-javascript ${want}`);
  // 시주: 일간과 시지로 정하는 천간이 lunar-javascript와 같은지(한국 시각 그대로 시진 가운데)
  const mid = new Date(Date.UTC(yy, mm - 1, dd) + (h.minutes - 30) * 60000);
  const e2 = Solar.fromYmdHms(mid.getUTCFullYear(), mid.getUTCMonth() + 1, mid.getUTCDate(), mid.getUTCHours(), mid.getUTCMinutes(), 0).getLunar().getEightChar();
  if (toKorean(e2.getTime()) !== c.hour.name) failures.push(`시주 ${yy}-${mm}-${dd} ${h.key}: 공식 ${c.hour.name}, lunar-javascript ${toKorean(e2.getTime())}`);
  checked++;
}

// 3) 알려진 기준일
const anchors = [[1949, 10, 1, '갑자'], [1990, 5, 15, '경진'], [2017, 6, 24, '임오']];
for (const [ay, am, ad, want] of anchors) {
  const got = pillar(dayPillarIndex(ay, am, ad)).name;
  if (got !== want) failures.push(`기준일 ${ay}-${am}-${ad}: 공식 ${got}, 기대 ${want}`);
  checked++;
}
// manseryeok README 예시: 1990-05-15 14:30 → 경오 신사 경진 계미
const ex = fourPillars({ y: 1990, m: 5, d: 15, hour: 'mi' });
if ([ex.year, ex.month, ex.day, ex.hour].map((p) => p.name).join(' ') !== '경오 신사 경진 계미') failures.push(`예시 1990-05-15 미시: ${[ex.year, ex.month, ex.day, ex.hour].map((p) => p.name).join(' ')}`);

const sample = STEMS.map((_, i) => tenGod(0, i)).join(' ');
if (sample !== '비견 겁재 식신 상관 편재 정재 편관 정관 편인 정인') failures.push(`십신(갑): ${sample}`);

if (failures.length) {
  console.error(`실패 ${failures.length}/${checked}`);
  console.error(failures.slice(0, 25).join('\n'));
  process.exit(1);
}
console.log(`모두 일치: 일주·연월시주 ${checked}건 (절기 경계 ±40분 ${skipped}건 제외), 십신 표본`);
