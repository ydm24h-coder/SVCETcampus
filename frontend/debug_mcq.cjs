const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  console.log('Navigating to MCQ...');
  await page.goto('http://localhost:5173/student/assessments/take/9999?type=MCQ').catch(e => console.log('Nav Error:', e.message));
  console.log('Wait 2 seconds...');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click start button if it exists
  const startBtn = await page.$('button.bg-blue-600');
  if (startBtn) {
    console.log('Clicking Start...');
    await startBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Click submit button
  console.log('Clicking Submit Quiz...');
  const submitBtns = await page.$$('button');
  for (let btn of submitBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Submit Quiz') || text.includes('Submit')) {
      await btn.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'mcq-submit.png' });
  console.log('Saved mcq-submit.png');
  await browser.close();
})();
