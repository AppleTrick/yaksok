// 여러 휴대폰 형태에서 모든 화면을 찍고, 깨진 곳을 자동으로 찾는다.
// 사용: next start를 띄운 뒤 node tools/visual/responsive.cjs <저장 폴더> [화면 크기 이름,...]
// 결과: <폴더>/<크기>/<화면>.png, <폴더>/report.json, 화면에 요약
const { chromium } = require('playwright-core'); const path = require('path'); const fs = require('fs');
const { prepare, route, walk } = require('./scenario.cjs');
const B = 'http://localhost:3000'; const OUT = process.argv[2];

// 실제로 많이 쓰이는 형태를 고른다. 폭이 가장 좁은 것부터.
const VIEWPORTS = {
  fold: { width: 280, height: 653, label: '접는 폰 바깥 화면' },
  se: { width: 320, height: 568, label: '작은 폰 (iPhone SE 1세대)' },
  android: { width: 360, height: 780, label: '보통 안드로이드' },
  iphone: { width: 390, height: 844, label: 'iPhone 13·14' },
  max: { width: 430, height: 932, label: '큰 폰 (Pro Max)' },
  land: { width: 844, height: 390, label: '휴대폰 가로' },
  tablet: { width: 768, height: 1024, label: '태블릿·펼친 폴드' },
};
const pick = (process.argv[3] || Object.keys(VIEWPORTS).join(',')).split(',');

// 브라우저 안에서 돈다. 깨짐 종류별로 찾은 것을 돌려준다.
function inspect() {
  const W = innerWidth, H = innerHeight;
  const vis = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0 && r.width > 0 && r.height > 0; };
  const name = (e) => `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''} "${(e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 14)}"`;
  const clipped = (e) => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true; } return false; };
  const inFixed = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true; return false; };
  const all = [...document.querySelectorAll('body *')].filter(vis);
  const out = { hscroll: document.documentElement.scrollWidth > W + 1 ? document.documentElement.scrollWidth - W : 0, offscreen: [], cut: [], small: [], tiny: [], covered: [] };
  for (const e of all) {
    const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    if (s.position !== 'fixed' && (r.right > W + 1 || r.left < -1) && !clipped(e) && e.children.length === 0) out.offscreen.push(name(e));
    const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText && /(hidden|clip)/.test(s.overflow) && s.textOverflow !== 'ellipsis' && !/-webkit-box/.test(s.display) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2)) out.cut.push(name(e));
    if (e.matches('button, a[href], input:not([type=hidden]), select, [role=button], [role=switch]') && !e.closest('[aria-hidden=true]')) {
      const t = e.matches('input[type=checkbox], input[type=radio]') ? e.parentElement.getBoundingClientRect() : r;
      if (Math.min(t.width, t.height) < 32) out.small.push(`${name(e)} ${Math.round(t.width)}×${Math.round(t.height)}`);
    }
    if (hasText && parseFloat(s.fontSize) < 11) out.tiny.push(`${name(e)} ${s.fontSize}`);
  }
  // 탭바·고정 버튼 밑에 깔리는 것: 맨 아래까지 내린 뒤, 고정 요소와 겹치는 일반 요소
  const fixed = all.filter(e => getComputedStyle(e).position === 'fixed' && e.getBoundingClientRect().bottom >= H - 2 && e.getBoundingClientRect().height < H * 0.6);
  const bars = fixed.map(e => e.getBoundingClientRect());
  for (const e of all) {
    if (e.children.length || !e.matches('button, a, input, select, p, span, h1, h2, h3, h4, label, li, strong, small')) continue;
    if (fixed.some(f => f.contains(e) || e.contains(f))) continue;
    if (inFixed(e)) continue; // 모달·시트 안은 탭바 위에 떠 있다
    const r = e.getBoundingClientRect();
    if (bars.some(b => r.bottom > b.top + 2 && r.top < b.bottom && r.right > b.left && r.left < b.right)) out.covered.push(name(e));
  }
  for (const k of ['offscreen', 'cut', 'small', 'tiny', 'covered']) out[k] = [...new Set(out[k])];
  return out;
}

(async () => {
  const b = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {});
  const report = {}; const log = [];
  for (const vp of pick) {
    const v = VIEWPORTS[vp]; fs.mkdirSync(path.join(OUT, vp), { recursive: true });
    const ctx = await b.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, isMobile: v.width < 700 || vp === 'land', hasTouch: true, colorScheme: 'light', reducedMotion: 'reduce' });
    await prepare(ctx, B);
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push(`${vp} 오류 ${e.message.slice(0, 100)}`));
    await route(p);
    const shot = async (n, full = true) => {
      await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' }).catch(() => {});
      await p.waitForTimeout(900);
      const top = await p.evaluate(inspect);
      await p.evaluate(() => { const s = document.scrollingElement; s.scrollTop = s.scrollHeight; document.querySelectorAll('*').forEach(e => { if (e.scrollHeight > e.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)) e.scrollTop = e.scrollHeight; }); });
      await p.waitForTimeout(150);
      const bottom = await p.evaluate(inspect);
      const r = { ...top, covered: bottom.covered }; // 맨 아래까지 내려도 가려지는 것만 문제다
      await p.evaluate(() => { document.scrollingElement.scrollTop = 0; });
      (report[vp] ??= {})[n] = r;
      await p.screenshot({ path: path.join(OUT, vp, `${n}.png`) }); // 사람이 실제로 보는 첫 화면
    };
    await walk(p, ctx, B, shot, log);
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  const kinds = { hscroll: '가로로 밀림', offscreen: '화면 밖으로 나감', cut: '글자 잘림', small: '누르기 작음(<32px)', tiny: '글자 너무 작음(<11px)', covered: '고정 막대에 가려짐' };
  for (const vp of pick) {
    const rows = Object.entries(report[vp] || {}).map(([n, r]) => [n, Object.keys(kinds).map(k => k === 'hscroll' ? (r.hscroll ? 1 : 0) : r[k].length)]);
    const total = rows.reduce((t, [, c]) => t + c.reduce((a, x) => a + x, 0), 0);
    console.log(`\n[${vp}] ${VIEWPORTS[vp].label} ${VIEWPORTS[vp].width}×${VIEWPORTS[vp].height}  문제 ${total}`);
    for (const [n, c] of rows) if (c.some(Boolean)) console.log(`  ${n.padEnd(22)} ${Object.keys(kinds).map((k, i) => c[i] ? `${kinds[k]} ${c[i]}` : '').filter(Boolean).join(', ')}`);
  }
  console.log(log.length ? '\n' + [...new Set(log)].join('\n') : '\n오류 없음'); await b.close();
})();
