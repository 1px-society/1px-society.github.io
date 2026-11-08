// 12지 동물 얼굴 픽셀 아트(16×16). 몸 색은 일간의 오행 색으로 바꿔 칠한다.
//   . 투명  o 외곽선  b 몸  l 밝은 몸  d 어두운 몸  w 흰색  k 눈  m 입·콧구멍(외곽선 색)  p 볼  n 분홍(코·귀 안)  y 뿔·부리  r 볏  s 살구색 얼굴

const SPRITES = {
  // 쥐
  0: [
    '................',
    '..ooo......ooo..',
    '.obbbo....obbbo.',
    '.obnbo....obnbo.',
    '.obbboooooobbbo.',
    '..oobllbbbbboo..',
    '..obllbbbbbbbo..',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obpbbbbbbbbpbo.',
    '.obbbbbnnbbbbbo.',
    '..obbbbmmbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
  ],
  // 소
  1: [
    '................',
    '.yy..........yy.',
    '.oyy........yyo.',
    '..oyy......yyo..',
    '...oyoooooooyo..',
    '..oobllbbbbboo..',
    '.obbllbbbbbbbbo.',
    'obbbbbbbbbbbbbbo',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obllllllllllbo.',
    '.oblnllllllnlbo.',
    '.obllllllllllbo.',
    '..obllllllllbo..',
    '...oooooooooo...',
    '................',
  ],
  // 호랑이
  2: [
    '................',
    '..oo........oo..',
    '.obbo......obbo.',
    '.obnboooooobnbo.',
    '.obbbdbddbdbbbo.',
    '..obllbddbbbbo..',
    '.obllbbbbbbbbbo.',
    '.odbbbbbbbbbbdo.',
    '.obbwkbbbbwkbbo.',
    '.odbkkbbbbkkbdo.',
    '.obpbbwwwwbbpbo.',
    '.odbbwwnnwwbbdo.',
    '..obbwwmmwwbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
  ],
  // 토끼
  3: [
    '...oo......oo...',
    '..obbo....obbo..',
    '..onbo....obno..',
    '..onbo....obno..',
    '..onbo....obno..',
    '..obbooooooobbo.',
    '..obllbbbbbbbo..',
    '.obllbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbmmbbbbmmbbo.',
    '.obpbbbnnbbbpbo.',
    '..obbbbmmbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
  ],
  // 용
  4: [
    '.y..y......y..y.',
    '.yy.y......y.yy.',
    '..yyy......yyy..',
    '...yy......yy...',
    '...yoooooooooy..',
    '..oobllbbbbboo..',
    'yobllbbbbbbbbboy',
    '.obbbbbbbbbbbbo.',
    'yobbwkbbbbwkbboy',
    '.obbkkbbbbkkbbo.',
    '.obllllllllllbo.',
    'yoblmllllllmlboy',
    '.obllllllllllbo.',
    '..obwbbbbbbwbo..',
    '...oooooooooo...',
    '................',
  ],
  // 뱀
  5: [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...oobbddbboo...',
    '..obbbdlldbbbo..',
    '.obllbbddbbbbbo.',
    '.obllbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obpbbbbbbbbpbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '...oooonnoooo...',
    '.......nn.......',
    '......n..n......',
  ],
  // 말
  6: [
    '...o........o...',
    '..obo......obo..',
    '..obo.oooo.obo..',
    '..oboddddddobo..',
    '...odddddddddo..',
    '..obddddddddbo..',
    '.obllbbbbbbbbbo.',
    '.obllbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obpllllllllpbo.',
    '.obllnllllnllbo.',
    '..obllllllllbo..',
    '...obllllllbo...',
    '....oooooooo....',
    '................',
  ],
  // 양
  7: [
    '................',
    '....oooooooo....',
    '...owwlwwlwwo...',
    '..owwwwwwwwwwo..',
    '.owlwwlwwlwwlwo.',
    '.owwwwwwwwwwwwo.',
    'yyobbbbbbbbbboyy',
    'yobllbbbbbbbbboy',
    'yobbwkbbbbwkbboy',
    '.obbkkbbbbkkbbo.',
    '.obpbbbbbbbbpbo.',
    '.obbbbbnnbbbbbo.',
    '..obbbbmmbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
  ],
  // 원숭이
  8: [
    '................',
    '................',
    '....oooooooo....',
    '...obbbbbbbbo...',
    '..obllbbbbbbbo..',
    '.obllbbbbbbbbbo.',
    'oobbssssssssbboo',
    'nobsswksswkssbon',
    'nobsskksskkssbon',
    'oobssssssssssboo',
    '.obpsssssssspbo.',
    '.obssssnnssssbo.',
    '..obssmmmmssbo..',
    '...obssssssbo...',
    '....oooooooo....',
    '................',
  ],
  // 닭
  9: [
    '......r..r......',
    '.....rrrrrr.....',
    '......rrrr......',
    '....oooooooo....',
    '...obllbbbbbo...',
    '..obllbbbbbbbo..',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obpbbbyybbbpbo.',
    '.obbbbyyyybbbbo.',
    '..obbbbrrbbbbo..',
    '...obbbrrbbbo...',
    '....oooooooo....',
    '................',
  ],
  // 개
  10: [
    '................',
    '................',
    '....oooooooo....',
    '..oobllbbbbboo..',
    '.oddbllbbbbbddo.',
    'odddbbbbbbbbdddo',
    'oddobbbbbbbbbddo',
    'oddobwkbbwkbbddo',
    'oddobkkbbkkbbddo',
    '.oo.obbbbbbbo.o.',
    '...obllllllbo...',
    '...oblmmmmlbo...',
    '...obllnnllbo...',
    '....obllllbo....',
    '.....oooooo.....',
    '................',
  ],
  // 돼지
  11: [
    '................',
    '..o..........o..',
    '..oo........oo..',
    '..ono......ono..',
    '..onnooooooonno.',
    '..obllbbbbbbbo..',
    '.obllbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obpbonnnnobpbo.',
    '.obbbnmnnmnbbbo.',
    '..obbonnnnobbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '................',
  ],
};

// 오행별 몸 색: [몸, 밝은 몸, 어두운 몸, 외곽선, 눈, 뿔·부리]
export const PALETTES = [
  { b: '#3cc6a6', l: '#93ead4', d: '#1f8f7a', o: '#1c2b33', k: '#1c2b33', y: '#ffc83d' }, // 목 푸른
  { b: '#ff6066', l: '#ffa3a6', d: '#c93c49', o: '#2e1a26', k: '#2e1a26', y: '#ffc83d' }, // 화 붉은
  { b: '#ffcc45', l: '#ffe79a', d: '#d99a1e', o: '#3a2a12', k: '#3a2a12', y: '#ff8a3d' }, // 토 노란
  { b: '#ebe6f6', l: '#ffffff', d: '#bab1d2', o: '#2a2440', k: '#2a2440', y: '#ffc83d' }, // 금 하얀
  { b: '#3d4166', l: '#6d73a3', d: '#262946', o: '#0f1020', k: '#ffd84d', y: '#ffc83d' }, // 수 검은
];

const FIXED = { w: '#ffffff', p: '#ff9db8', n: '#ff8fab', r: '#ff4d6d', s: '#ffd9b8' };

export function spriteRows(branch) {
  const rows = SPRITES[branch];
  if (!rows || rows.length !== 16 || rows.some((r) => r.length !== 16)) throw new Error(`sprite ${branch} is not 16×16`);
  return rows;
}

// 픽셀 하나를 size px 정사각형으로 그린다.
export function drawSprite(ctx, branch, element, x, y, size) {
  const pal = PALETTES[element];
  const rows = spriteRows(branch);
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const ch = rows[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = ch === 'm' ? pal.o : pal[ch] || FIXED[ch];
      ctx.fillRect(Math.round(x + c * size), Math.round(y + r * size), Math.ceil(size), Math.ceil(size));
    }
  }
}

export function spriteCanvas(branch, element, size = 8) {
  const c = document.createElement('canvas');
  c.width = c.height = 16 * size;
  drawSprite(c.getContext('2d'), branch, element, 0, 0, size);
  return c;
}

// 1px 로고(빨간 블록 얼굴)
const LOGO = [
  '..........',
  '.bbbbbbbb.',
  '.bbbbbbbbd',
  '.bkbbbbkbd',
  '.bkbbbbkbd',
  '.pbbbbbbpd',
  '.bbbkkbbbd',
  '.bbbbbbbbd',
  '..dddddddd',
  '..........',
];
export function drawLogo(ctx, x, y, size) {
  const pal = { b: '#e84c3d', d: '#b8352b', k: '#1d1b2c', p: '#f6b5ad' };
  for (let r = 0; r < LOGO.length; r++)
    for (let c = 0; c < LOGO[r].length; c++) {
      const ch = LOGO[r][c];
      if (ch === '.') continue;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(Math.round(x + c * size), Math.round(y + r * size), Math.ceil(size), Math.ceil(size));
    }
}
