// 테마를 고친 뒤 npm run astryx:check 로 확인한다.
// 앱이 읽는 복사본(src/themes/yaksok)은 편집기가 쓴다. 그 안의 파일을 손으로 고치면 편집기가
// 복사본 갱신을 조용히 멈춰, 원본의 새 색이 앱에 들어가지 않는다 (2026-11-28 운영에서 겪음).
// 이 검사는 원본과 복사본의 바탕색·기준색이 같은지 본다. 다르면 복사본을 지우고 editor show를 다시 돌린다.
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pick = (css, name) => (css.match(new RegExp(`--${name}:[^;]+`)) || [''])[0].trim();
const src = read('themes/yaksok/yaksok.css'); const app = read('src/themes/yaksok/yaksok.css');
const bad = ['color-background-body', 'color-accent', 'color-info', 'radius-container'].filter((k) => pick(src, k) !== pick(app, k));
if (bad.length) {
  console.error('앱 복사본이 테마 원본과 다르다:', bad.join(', '));
  console.error('고치는 법: src/themes/yaksok/의 yaksok.js·yaksok.css·yaksok.fonts.css·*.d.ts를 지우고 npx astryx experimental theme editor show yaksok');
  process.exit(1);
}
console.log('앱 복사본이 테마 원본과 같다');
