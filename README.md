# 1px-society.github.io

1px(@1px.society)의 정적 페이지. 서버 없이 GitHub Pages로 돈다.

## /unse — 오늘의 운세

생년월일(양력·음력)과 태어난 시진으로 사주팔자를 뽑고, 오늘 일진이 그 원국에 무엇이 되는지로 오늘의 운세를 정한다. 같은 날 같은 원국이면 같은 운세가 나온다. 생일은 브라우저 localStorage에만 둔다.

- 원국: 연주는 입춘, 월주는 12절(태양 황경 315°부터 30°마다), 일주는 율리우스 적일 mod 60(1949-10-01 = 갑자), 시주는 시진과 일간. 시진은 한국 표준시 30분 보정(자시 23:30~01:29), 밤 23:30 이후 자시는 다음 날 일주. 1987·1988년 여름 시간을 반영한다.
- 원국 풀이: 십신, 오행 분포, 신강·신약(월지 3, 일지 1.5, 나머지 1 가중), 억부 용신, 원국 신살(천을귀인·문창·도화·역마·화개).
- 운세는 모두 "그 시점의 간지가 원국에 무엇이 되는지"로 정한다: 십신, 일간의 12운성, 원국 지지와의 합·반합·충·형(연=바깥 관계, 월=학교·직장·집, 일=나와 연인, 시=미래), 12신살(띠 기준), 천을·문창귀인, 용신 궁합.
  - 오늘: 0~100점과 등급, 연애·재물·공부/일·건강 점수, 12시진별 흐름, 30일 점수와 좋은 날(데이트·시험·돈), 개운법(용신 오행의 색·방향·숫자·시간·음식·행동)
  - 이번 달(월운)·올해(세운)·다음 해 신년운세와 월별 점수
  - 궁합: 일간(천간합·상생·비화·상극), 일지(합·충·형·원진), 서로 채워 주는 용신, 띠(연지)
  - 평생 풀이: 일간 성격, 십신 분포(많은·없는 것), 연애 스타일(일지 십신), 직업, 재물, 오행 체질, 원국 신살
  - 대운: 순행(양남·음녀)·역행, 시작 나이 = 절기까지 날수 ÷ 3, 10년마다 점수

| 파일 | 내용 |
|---|---|
| `unse/js/saju.js` | 사주 계산(태양 황경은 Meeus 저정밀식) |
| `unse/js/fortune.js` | 오늘의 운세 고르기 |
| `unse/js/data.js` | 문장 은행, 12운성·합충·신살 풀이, 일간·일주 소개 |
| `unse/js/card.js` | 결과 카드(피드 1080×1350, 스토리 1080×1920, OG 1200×630) |
| `unse/js/charts.js` | SVG 막대·선 차트(시간대, 30일, 월별, 대운) |
| `unse/app.min.js` | 위 파일을 묶은 번들(esbuild). 페이지는 이것만 읽는다 |
| `unse/js/sprites.js` | 12지 동물 픽셀 아트(16×16), 오행 색 |
| `unse/vendor/korean-lunar-calendar.mjs` | 음력→양력(한국천문연구원 기준, MIT) |
| `unse/fonts/` | Galmuri11(SIL OFL 1.1)을 사이트 글자만 남겨 줄인 것(원본은 `tools/fonts-src/`). 본문은 Pretendard(jsDelivr) |

친구 링크(`/unse/r/<일주>/`)는 일주 배지만 보여 준다. 생일이 드러나지 않게 원국은 링크와 공유 이미지(오늘의 운세 카드, 궁합 카드)에 넣지 않는다.

## 검색·배포

- `unse/index.html`: 제목·설명·키워드, OG, JSON-LD(WebApplication, FAQPage), 보이는 소개·FAQ 본문, manifest.
- `robots.txt`(/tools/, /unse/r/ 제외), `sitemap.xml`(빌드가 날짜를 넣는다), `404.html`(→ /unse/).
- 친구 링크 페이지 60개는 `noindex, follow`.
- 빌드가 index.html의 `app.min.js`·`app.css`·`fonts.css` 참조에 내용 해시(`?v=`)를 붙여, 배포 뒤 옛 파일이 남지 않게 한다.
- 검색 등록(사용자 계정 필요): Google Search Console, 네이버 서치어드바이저에 사이트를 등록하고 sitemap.xml을 제출한다. 확인 메타 태그는 `unse/index.html` 머리에 넣는다.
- main에는 PR로 반영한다(GitHub Pages가 main의 루트를 띄운다). 이 레포의 push는 hoon0601의 gh 인증을 쓴다(`git config --local credential...`).

## 명령

```bash
npm install            # 검증·빌드 도구(lunar-javascript, korean-lunar-calendar, playwright-core)
npm run verify         # 일주와 연·월·시주를 두 라이브러리와 비교(1950~2050년)
npm run build          # 번들(unse/app.min.js), unse/og/*.png, unse/r/<일주>/index.html, sitemap.xml, ?v= 해시(Chrome 필요)
PYFTSUBSET=<pyftsubset 경로> npm run build   # 폰트도 다시 줄일 때(fonttools)
node tools/serve.mjs   # http://127.0.0.1:4810/unse/
node tools/shot.mjs /unse/ out.png 390 844 tools/flow.json   # 휴대폰 크기 스크린샷
```

`unse/js/`나 `unse/index.html`을 고치면 `npm run build`로 번들과 결과 페이지 60개를 다시 만든다.
