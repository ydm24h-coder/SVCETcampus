const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  try {
    console.log('Navigating to Login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[type="text"]');
    
    // Login as student
    await page.type('input[type="text"]', 's234567@svcet.edu.in');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation();
    console.log('Logged in successfully!');
    
    // Navigate to MCQ test directly (assuming ID 9999 or 1 exists)
    // Let's try to get ID from assessments context first, or just hit the route
    console.log('Navigating to MCQ...');
    await page.goto('http://localhost:5173/student/assessments/take/9999?type=MCQ');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if we are on the start screen
    const startBtn = await page.$('button.bg-blue-600');
    if (startBtn) {
      const text = await page.evaluate(el => el.textContent, startBtn);
      if (text.includes('Start Assessment') || text.includes('Start Test')) {
         console.log('Clicking Start...');
         await startBtn.click();
         await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Now click submit quiz
    console.log('Clicking Submit...');
    const buttons = await page.$$('button');
    let clicked = false;
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Submit') || text.includes('Submit Quiz')) {
        await btn.click();
        clicked = true;
        console.log('Clicked submit!');
        break;
      }
    }
    
    if (!clicked) {
       console.log('Submit button not found!');
       await page.screenshot({ path: 'mcq-error.png' });
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'mcq-result.png' });
    console.log('Saved screenshot to mcq-result.png');
    
  } catch(e) {
    console.log('Script Error:', e);
  } finally {
    await browser.close();
  }
})();
