// 화면 회귀 검사용 캡처. 같은 가짜 데이터, 같은 시각, 애니메이션 없이 모든 화면을 찍는다.
// 사용: npm run build && npx next start -p 3000 을 띄운 뒤 node tools/visual/capture.cjs <저장 폴더>
const { chromium, devices } = require('playwright-core'); const path = require('path'); const fs = require('fs');
const B = 'http://localhost:3000'; const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const PHOTO = path.join(__dirname, '..', '..', '..', 'fastapi', 'Sample_Image', 'original.JPG');
const ing = (s, my = '0.00') => [{ name: '비타민 C', amount: '1000.00', unit: 'mg', myAmount: my, totalAmount: String(1000 + Number(my)), status: s }, { name: '아연', amount: '8.50', unit: 'mg', myAmount: '0.00', totalAmount: '8.50', status: 'unknown' }];
const API = {
  '/api/v1/user/me': { name: '약속이' },
  '/api/v1/user/info': { userDataResponse: { email: 'demo@example.com', name: '약속이', ageGroup: 'TWENTY', gender: 'MALE' }, userDiseases: [{ id: 1, sickName: '고혈압' }], allDiseases: [{ id: 1, sickName: '고혈압' }, { id: 2, sickName: '당뇨' }], userProducts: [] },
  '/api/v1/intakes/today': [
    { userProductId: 1, productId: 11, productName: '메가도스C 비타민C 3000mg', nickname: '메가도스C 비타민C 3000mg', dailyDose: 1, doseAmount: 1, doseUnit: '정', taken: false },
    { userProductId: 2, productId: 12, productName: '고려은단 비타민C1000 이지+비타민D', nickname: '고려은단 비타민C1000 이지+비타민D', dailyDose: 1, doseAmount: 1, doseUnit: '정', taken: true },
    { userProductId: 3, productId: null, productName: null, nickname: '오메가3', dailyDose: 1, doseAmount: 2, doseUnit: '캡슐', taken: false }],
  '/api/v1/notification/info': { notifications: [
    { id: 1, userProductId: 1, nickname: '메가도스C 비타민C 3000mg', intakeTime: '09:00:00', enabled: true, intaken: false, category: 'AFTERMEAL', daysOfWeek: null },
    { id: 2, userProductId: 2, nickname: '고려은단 비타민C1000 이지+비타민D', intakeTime: '20:30:00', enabled: true, intaken: true, category: 'AFTERMEAL', daysOfWeek: '1,2,3,4,5' },
    { id: 3, userProductId: 3, nickname: '오메가3', intakeTime: '13:00:00', enabled: false, intaken: false, category: 'BEFOREMEAL', daysOfWeek: '6,7' }] },
  '/api/v1/notification/setting': { quietStart: '22:00:00', quietEnd: '07:00:00', enabled: true },
  '/api/v1/analyze': { reportData: { products: [
    { productId: 7, name: '메가도스C 비타민C 3000mg', box: [0.28, 0.18, 0.72, 0.82], ingredients: ing('warning', '1500.00'), intakeTime: '08:00:00', intakeCategory: 'AFTERMEAL' },
    { productId: 8, name: '고려은단 비타민C1000', box: [0.05, 0.5, 0.3, 0.95], ingredients: ing('safe'), intakeTime: null, intakeCategory: null }] } },
};
(async () => {
  const b = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}); const log = [];
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], colorScheme: scheme, reducedMotion: 'reduce' });
    await ctx.addCookies([{ name: 'ACCESS_TOKEN', value: 'dummy', url: B }]);
    await ctx.addInitScript(() => { localStorage.setItem('userName', '약속이'); localStorage.setItem('fcm_permission_dismissed', 'true'); });
    // 날짜만 고정한다. 애니메이션이 쓰는 performance.now는 그대로 흐른다 (Playwright 시계는 그것까지 멈춘다)
    await ctx.addInitScript(() => { const T = Date.parse('2026-11-25T08:30:00+09:00'); const D = Date; class F extends D { constructor(...a) { super(...(a.length ? a : [T])); } static now() { return T; } } globalThis.Date = F; });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push(`${scheme} 오류 ${e.message.slice(0, 100)}`));
    await p.route('**/api/v1/**', r => { const k = new URL(r.request().url()).pathname; const d = API[k]; return r.fulfill({ json: { success: true, data: d === undefined ? null : d } }); });
    const still = async () => { await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} .sc-summary{visibility:hidden!important}' }).catch(() => {}); await p.waitForTimeout(1200); };
    const shot = async (n, full = true) => { await still(); if (process.env.VDEBUG) console.log(scheme, n, new URL(p.url()).pathname, (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 40), await p.evaluate(() => [...document.querySelectorAll('.app-content *')].filter(e => getComputedStyle(e).opacity === '0').map(e => e.tagName + '.' + (e.className.baseVal ?? e.className).toString().slice(0, 40) + ' ' + (e.textContent || '').trim().slice(0, 15) + ' ' + Math.round(e.getBoundingClientRect().height)).join(' / '))); await p.screenshot({ path: path.join(OUT, `${scheme}-${n}.png`), fullPage: full }); };
    const go = async (u) => { await p.goto(B + u, { waitUntil: 'networkidle' }).catch(() => {}); };
    for (const [n, u] of [['login', '/login'], ['signup', '/signup'], ['find-password', '/find-password'], ['home', '/'], ['supplements', '/my-supplements'], ['reminders', '/reminders'], ['settings', '/settings'], ['mypage', '/mypage'], ['mypage-edit', '/mypage/edit'], ['settings-notification', '/settings/notification']]) {
      await p.context().clearCookies(); if (!['login', 'signup', 'find-password'].includes(n)) await ctx.addCookies([{ name: 'ACCESS_TOKEN', value: 'dummy', url: B }]);
      await go(u); await shot(n);
    }
    await go('/my-supplements'); await p.locator('text=메가도스C').first().click().catch(() => log.push('상세 못 엶')); await shot('supplement-detail', false);
    await go('/reminders'); await p.locator('.al-item').first().click().catch(() => log.push('알림 수정 못 엶')); await shot('alarm-edit', false);
    await go('/camera'); await shot('camera', false);
    await p.setInputFiles('input[type=file]', PHOTO); await shot('scan-review', false);
    await p.getByRole('button', { name: '분석 시작' }).click(); await p.locator('.sc-result').waitFor({ timeout: 10000 }).catch(() => log.push('결과 안 나옴')); await shot('scan-result');
    await p.getByRole('button', { name: /리포트 보기/ }).click(); await p.locator('.rp-page').waitFor({ timeout: 10000 }).catch(() => log.push('리포트 안 열림')); await shot('report');
    await p.locator('.rp-btn').click(); await shot('report-warning', false);
    await ctx.close();
  }
  console.log(log.length ? log.join('\n') : '오류 없음'); await b.close();
})();
