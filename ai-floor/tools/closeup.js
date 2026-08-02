const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.goto('file://' + __dirname + '/../dist/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  // drive the camera directly to frame the people
  const shots = [
    { name: 'cu-staff.png', pos: [2, 9, 26], tgt: [0, 4.5, 12] },
    { name: 'cu-staff2.png', pos: [-16, 9, 24], tgt: [-11, 4.5, 11] },
    { name: 'cu-ceo.png', pos: [-16, 7.5, -5], tgt: [-22, 5.0, -12] },
    { name: 'cu-pm.png', pos: [2, 7.0, -10], tgt: [0, 5.4, -16.5] },
  ];
  for (const s of shots) {
    await page.evaluate(({ pos, tgt }) => {
      const c = window.__cam, ct = window.__ctl;
      c.position.set(pos[0], pos[1], pos[2]);
      ct.target.set(tgt[0], tgt[1], tgt[2]);
      ct.autoRotate = false; ct.update();
    }, s);
    await page.waitForTimeout(500);
    await page.screenshot({ path: __dirname + '/../shots/' + s.name });
  }
  console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})();
