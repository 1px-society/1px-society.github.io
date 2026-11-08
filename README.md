# 1px-society.github.io

1px(@1px.society)의 정적 페이지. 서버 없이 GitHub Pages로 돈다.

## /unse — 오늘의 운세

생일 하나로 일주(태어난 날의 간지)를 구하고, 오늘 일진과의 관계(십신, 지지의 합·충)로 오늘의 운세를 고른다. 같은 날 같은 일주면 같은 운세가 나온다. 생일은 브라우저 localStorage에만 둔다.

- `unse/js/saju.js` 일주·십신·지지 관계 계산. 일주는 율리우스 적일 mod 60(1949-10-01 = 갑자).
- `unse/js/data.js` 운세 문장 은행(십신 10 × 총운·연애·돈·공부), 행운 컬러·아이템, 일주 60개 소개.
- `unse/js/fortune.js` 오늘의 운세 고르기(날짜+일주 해시).
- `unse/js/card.js` 결과 카드(피드 1080×1350, 스토리 1080×1920, OG 1200×630).
- `unse/js/sprites.js` 12지 동물 픽셀 아트(16×16), 오행 색.
- `unse/vendor/korean-lunar-calendar.mjs` 음력→양력(한국천문연구원 기준, MIT).
- `unse/fonts/` Galmuri11(SIL OFL 1.1). 본문은 Pretendard(jsDelivr).

## 명령

```bash
npm install            # 검증·빌드 도구(lunar-javascript, korean-lunar-calendar, playwright-core)
npm run verify         # 일주 공식을 두 라이브러리와 비교(1950~2050년)
npm run build          # unse/og/*.png와 unse/r/<일주>/index.html 생성(Chrome 필요)
node tools/serve.mjs   # http://127.0.0.1:4810/unse/
node tools/shot.mjs /unse/ out.png 390 844 tools/flow.json   # 휴대폰 크기 스크린샷
```

`unse/index.html`을 고치면 `npm run build`로 결과 페이지 60개를 다시 만든다.
