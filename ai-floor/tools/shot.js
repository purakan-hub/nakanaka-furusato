const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.goto('file://' + __dirname + '/../dist/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: __dirname + '/../shots/shot1.png' });
  // big drag to orbit around behind the far walls
  await page.mouse.move(640, 400); await page.mouse.down();
  await page.mouse.move(1180, 380, { steps: 30 }); await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: __dirname + '/../shots/shot2.png' });
  // orbit further
  await page.mouse.move(640, 400); await page.mouse.down();
  await page.mouse.move(180, 420, { steps: 30 }); await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: __dirname + '/../shots/shot3.png' });
  console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})();
