# 1px-society.github.io

1px(@1px.society)의 정적 페이지. 서버 없이 GitHub Pages로 돈다.

## /unse — 오늘의 운세

생년월일(양력·음력)과 태어난 시진으로 사주팔자를 뽑고, 오늘 일진이 그 원국에 무엇이 되는지로 오늘의 운세를 정한다. 같은 날 같은 원국이면 같은 운세가 나온다. 생일은 브라우저 localStorage에만 둔다.

- 원국: 연주는 입춘, 월주는 12절(태양 황경 315°부터 30°마다), 일주는 율리우스 적일 mod 60(1949-10-01 = 갑자), 시주는 시진과 일간. 시진은 한국 표준시 30분 보정(자시 23:30~01:29), 밤 23:30 이후 자시는 다음 날 일주. 1987·1988년 여름 시간을 반영한다.
- 원국 풀이: 십신, 오행 분포, 신강·신약(월지 3, 일지 1.5, 나머지 1 가중), 억부 용신, 원국 신살(천을귀인·문창·도화·역마·화개).
- 오늘의 운세: 오늘 천간의 십신, 일간의 12운성, 오늘 지지와 원국 지지의 합·반합·충·형(연=바깥 관계, 월=학교·직장·집, 일=나와 연인, 시=미래), 오늘 드는 신살, 오늘 오행과 용신의 궁합. 행운 색·방향·숫자(하도)·시간은 용신 오행에서 나온다.

| 파일 | 내용 |
|---|---|
| `unse/js/saju.js` | 사주 계산(태양 황경은 Meeus 저정밀식) |
| `unse/js/fortune.js` | 오늘의 운세 고르기 |
| `unse/js/data.js` | 문장 은행, 12운성·합충·신살 풀이, 일간·일주 소개 |
| `unse/js/card.js` | 결과 카드(피드 1080×1350, 스토리 1080×1920, OG 1200×630) |
| `unse/js/sprites.js` | 12지 동물 픽셀 아트(16×16), 오행 색 |
| `unse/vendor/korean-lunar-calendar.mjs` | 음력→양력(한국천문연구원 기준, MIT) |
| `unse/fonts/` | Galmuri11(SIL OFL 1.1). 본문은 Pretendard(jsDelivr) |

친구 링크(`/unse/r/<일주>/`)는 일주 배지만 보여 준다. 생일이 드러나지 않게 원국은 링크와 공유 이미지에 넣지 않는다.

## 명령

```bash
npm install            # 검증·빌드 도구(lunar-javascript, korean-lunar-calendar, playwright-core)
npm run verify         # 일주와 연·월·시주를 두 라이브러리와 비교(1950~2050년)
npm run build          # unse/og/*.png와 unse/r/<일주>/index.html 생성(Chrome 필요)
node tools/serve.mjs   # http://127.0.0.1:4810/unse/
node tools/shot.mjs /unse/ out.png 390 844 tools/flow.json   # 휴대폰 크기 스크린샷
```

`unse/index.html`을 고치면 `npm run build`로 결과 페이지 60개를 다시 만든다.
