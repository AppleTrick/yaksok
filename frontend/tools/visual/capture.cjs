// 화면 회귀 검사용 캡처. 같은 가짜 데이터, 같은 시각, 애니메이션 없이 모든 화면을 찍는다.
// 사용: npm run build && npx next start -p 3000 을 띄운 뒤 node tools/visual/capture.cjs <저장 폴더>
const { chromium, devices } = require('playwright-core'); const path = require('path'); const fs = require('fs');
const { prepare, route, walk } = require('./scenario.cjs');
const B = 'http://localhost:3000'; const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}); const log = [];
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], colorScheme: scheme, reducedMotion: 'reduce' });
    await prepare(ctx, B);
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push(`${scheme} 오류 ${e.message.slice(0, 100)}`));
    await route(p);
    const still = async () => { await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} .sc-summary,.sc-ai{visibility:hidden!important}' }).catch(() => {}); await p.waitForTimeout(1200); };
    const shot = async (n, full = true) => { await still(); await p.screenshot({ path: path.join(OUT, `${scheme}-${n}.png`), fullPage: full }); };
    await walk(p, ctx, B, shot, log);
    await ctx.close();
  }
  console.log(log.length ? log.join(String.fromCharCode(10)) : '오류 없음'); await b.close();
})();
