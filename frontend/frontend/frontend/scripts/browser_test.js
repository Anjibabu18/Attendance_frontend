import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\venka\\.gemini\\antigravity-ide\\brain\\317cc6a2-27cc-48e2-a893-a22df0245c78';

async function setReactInputValue(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Element not found: ${sel}`);
    
    // Call native setter on HTMLInputElement prototype to bypass React interceptor
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(el, val);
    
    // Dispatch input event to notify React
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
}

async function runBrowserTest() {
  console.log('=== BROWSER END-TO-END VALIDATION ===\n');

  console.log('Launching local Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  });

  let page;
  try {
    page = await browser.newPage();

    // Log page console messages to node terminal
    page.on('console', msg => {
      console.log(`[browser-console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    // 1. Visit homepage
    console.log('Navigating to homepage: http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    // Capture homepage screenshot
    const homeScreenshotPath = path.join(artifactDir, 'homepage.png');
    await page.screenshot({ path: homeScreenshotPath });
    console.log(`✅ Captured homepage screenshot: ${homeScreenshotPath}`);

    // Click on Open portal
    console.log('Clicking "Open portal" to navigate to login...');
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    
    // Find the button containing "Open portal" or "Login"
    let loginBtn;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Open portal') || text.includes('Login')) {
        loginBtn = btn;
        break;
      }
    }
    if (loginBtn) {
      await loginBtn.click();
    } else {
      console.log('Button not found, navigating directly to http://localhost:5173/login');
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    }

    // Wait for the login form to fully render
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    console.log(`Current URL: ${page.url()}`);

    // 2. Perform Employee Login
    console.log('\n--- Logging in as Employee: sravan ---');
    await setReactInputValue(page, 'input[type="text"]', 'sravan');
    await setReactInputValue(page, 'input[type="password"]', 'Sravan@123');

    // Wait a brief moment for React state to synchronize
    await new Promise(r => setTimeout(r, 500));

    // Verify input values and button status
    const userVal1 = await page.evaluate(() => document.querySelector('input[type="text"]').value);
    const passVal1 = await page.evaluate(() => document.querySelector('input[type="password"]').value);
    const btnDisabled1 = await page.evaluate(() => document.querySelector('button[type="submit"]').disabled);
    console.log(`Inputs filled: Username="${userVal1}", PasswordLength=${passVal1.length}`);
    console.log(`Submit button disabled: ${btnDisabled1}`);

    // Submit form programmatically via DOM click
    console.log('Submitting Employee login...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    // Wait for employee dashboard
    console.log('Waiting for routing to employee dashboard...');
    await page.waitForFunction(() => window.location.href.includes('/employee'), { timeout: 10000 });
    await page.waitForNetworkIdle();
    console.log(`Successfully reached dashboard: ${page.url()}`);

    // Capture employee dashboard screenshot
    const empScreenshotPath = path.join(artifactDir, 'employee_dashboard.png');
    await page.screenshot({ path: empScreenshotPath });
    console.log(`✅ Captured Employee Dashboard screenshot: ${empScreenshotPath}`);

    // Navigate back to login (clear storage and load login page directly)
    console.log('\nLogging out and preparing for admin login...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Wait for the login form to fully render again
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });

    // 3. Perform Admin Login
    console.log('\n--- Logging in as Admin: admin ---');
    await setReactInputValue(page, 'input[type="text"]', 'admin');
    await setReactInputValue(page, 'input[type="password"]', 'Admin@12345!');

    // Wait a brief moment for React state to synchronize
    await new Promise(r => setTimeout(r, 500));

    // Verify input values and button status
    const userVal2 = await page.evaluate(() => document.querySelector('input[type="text"]').value);
    const passVal2 = await page.evaluate(() => document.querySelector('input[type="password"]').value);
    const btnDisabled2 = await page.evaluate(() => document.querySelector('button[type="submit"]').disabled);
    console.log(`Inputs filled: Username="${userVal2}", PasswordLength=${passVal2.length}`);
    console.log(`Submit button disabled: ${btnDisabled2}`);

    // Submit form programmatically via DOM click
    console.log('Submitting Admin login...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    // Wait for admin dashboard
    console.log('Waiting for routing to admin dashboard...');
    await page.waitForFunction(() => window.location.href.includes('/admin'), { timeout: 10000 });
    await page.waitForNetworkIdle();
    console.log(`Successfully reached admin dashboard: ${page.url()}`);

    // Capture admin dashboard screenshot
    const adminScreenshotPath = path.join(artifactDir, 'admin_dashboard.png');
    await page.screenshot({ path: adminScreenshotPath });
    console.log(`✅ Captured Admin Dashboard screenshot: ${adminScreenshotPath}`);

  } catch (err) {
    console.error('❌ Error during E2E browser automation:', err);
    if (page) {
      try {
        const errScreenshotPath = path.join(artifactDir, 'error.png');
        await page.screenshot({ path: errScreenshotPath });
        console.log(`Saved error screenshot to: ${errScreenshotPath}`);
        
        // Output body html for additional debugging
        const html = await page.content();
        console.log('--- ERROR PAGE HTML ---');
        console.log(html.substring(0, 1000) + '... (truncated)');
        console.log('------------------------');
      } catch (screenshotErr) {
        console.error('Failed to take error screenshot:', screenshotErr.message);
      }
    }
  } finally {
    await browser.close();
    console.log('\n=== BROWSER END-TO-END VALIDATION COMPLETED ===');
  }
}

runBrowserTest();
