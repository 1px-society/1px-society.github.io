// Galmuri11을 사이트에 실제로 쓰는 글자만 남겨 줄인다(원본 약 670KB).
//   PYFTSUBSET=<fonttools의 pyftsubset 경로> node tools/subset-fonts.mjs
// 원본은 tools/fonts-src/, 결과는 unse/fonts/. 문장이나 화면 글자를 바꾸면 다시 돌린다(npm run build가 함께 돌린다).
import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const tool = process.env.PYFTSUBSET || 'pyftsubset';

async function textOf(dir, exts) {
  let out = '';
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) continue;
    if (exts.some((e) => name.endsWith(e))) out += await readFile(p, 'utf8');
  }
  return out;
}

const text = (await textOf(join(ROOT, 'unse', 'js'), ['.js'])) + (await readFile(join(ROOT, 'unse', 'index.html'), 'utf8'))
  + Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('') + '·…“”‘’→←↓↑★☆♥✦✚◎✓※〜~';
const chars = [...new Set([...text])].filter((c) => c.codePointAt(0) >= 32).join('');
await writeFile(join(ROOT, 'tools', 'fonts-src', 'chars.txt'), chars);
for (const name of ['Galmuri11', 'Galmuri11-Bold']) {
  execFileSync(tool, [join(ROOT, 'tools', 'fonts-src', `${name}.woff2`), `--text-file=${join(ROOT, 'tools', 'fonts-src', 'chars.txt')}`,
    '--flavor=woff2', '--layout-features=*', `--output-file=${join(ROOT, 'unse', 'fonts', `${name}.woff2`)}`]);
}
const sizes = await Promise.all(['Galmuri11', 'Galmuri11-Bold'].map(async (n) => `${n} ${Math.round((await stat(join(ROOT, 'unse', 'fonts', `${n}.woff2`))).size / 1024)}KB`));
console.log(`글자 ${chars.length}개 → ${sizes.join(', ')}`);
