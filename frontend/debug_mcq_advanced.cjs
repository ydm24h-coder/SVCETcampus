const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('NETWORK ERROR:', response.url(), response.status());
    }
  });

  try {
    console.log('Navigating to http://localhost:5173/login');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Check if we need to login
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      console.log('Logging in...');
      await page.type('input[type="text"]', 's234567@svcet.edu.in');
      await page.type('input[type="password"]', 'password123');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);
      console.log('Logged in successfully!');
    }

    // Now go to Assessment list to find a valid ID
    console.log('Navigating to assessments list...');
    await page.goto('http://localhost:5173/student/assessments', { waitUntil: 'networkidle0' });
    
    // Find an MCQ test and click it
    console.log('Looking for an MCQ test...');
    await page.screenshot({ path: 'assessments_list.png' });
    
    // Let's just grab the first Start button
    const startLinks = await page.$$('a[href*="/student/assessments/take/"]');
    if (startLinks.length > 0) {
      // Find one that contains 'type=MCQ'
      let targetHref = null;
      for (const link of startLinks) {
        const href = await page.evaluate(el => el.getAttribute('href'), link);
        if (href.includes('type=MCQ')) {
          targetHref = href;
          break;
        }
      }
      
      if (!targetHref) {
         // just take the first one and append MCQ if needed, but the list should have it
         targetHref = await page.evaluate(el => el.getAttribute('href'), startLinks[0]);
      }
      
      console.log('Found test URL:', targetHref);
      await page.goto(`http://localhost:5173${targetHref}`, { waitUntil: 'networkidle0' });
    } else {
      console.log('Could not find any assessments to take!');
      return;
    }

    await page.screenshot({ path: 'test_start.png' });
    
    // Click Start Assessment
    console.log('Clicking Start Assessment...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Acknowledge & Start') || text.includes('Start Assessment')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }

    await page.screenshot({ path: 'test_running.png' });
    
    // Answer a question just in case
    console.log('Answering a question...');
    const radios = await page.$$('input[type="radio"]');
    if (radios.length > 0) {
      await radios[0].click();
    }
    
    // Click Submit
    console.log('Looking for Submit button...');
    const allButtons = await page.$$('button');
    let submitClicked = false;
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      // Let's try the top header submit
      if (text === 'Submit' || text === 'Submit Quiz') {
        console.log('Clicking button with text:', text);
        await btn.click();
        submitClicked = true;
        break;
      }
    }
    
    if (!submitClicked) {
      console.log('Could not find Submit button!');
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'test_result.png' });
    console.log('Done!');
    
  } catch(e) {
    console.log('Script Error:', e);
  } finally {
    await browser.close();
  }
})();
