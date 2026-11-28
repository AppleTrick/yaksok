// 테마 편집기가 src/themes/yaksok/yaksok.fonts.css를 다시 쓰면 한글 Pretendard 줄이 사라진다.
// (편집기는 Fontsource판만 알아보는데, Fontsource판에는 한글이 없다.) 테마를 고친 뒤 npm run astryx:fonts로 되살린다.
const fs = require('fs'); const path = require('path');
const file = path.join(__dirname, '..', 'src', 'themes', 'yaksok', 'yaksok.fonts.css');
fs.writeFileSync(file, '/* 한글이 들어 있는 Pretendard. 쓰는 글자 조각만 받는다. tools/astryx-fonts.cjs가 쓴다 */\n@import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";\n');
console.log('글꼴 줄을 넣었다:', path.relative(process.cwd(), file));
