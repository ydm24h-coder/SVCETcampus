const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log('Navigating...');
  await page.goto('http://localhost:5173/student/assessments/take/1?type=Code').catch(e => console.log('Nav Error:', e.message));
  console.log('Wait 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Saved screenshot.png');
  await browser.close();
})();
