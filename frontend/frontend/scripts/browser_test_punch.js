import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\venka\\.gemini\\antigravity-ide\\brain\\317cc6a2-27cc-48e2-a893-a22df0245c78';
const dummyImgPath = path.join(artifactDir, 'dummy.png');

// Create a valid 1x1 transparent PNG
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
fs.writeFileSync(dummyImgPath, Buffer.from(base64Png, 'base64'));

async function setReactInputValue(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Element not found: ${sel}`);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
}

async function runPunchTest() {
  console.log('=== BROWSER E2E ATTENDANCE PUNCH VALIDATION ===\n');

  console.log('Launching local Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  });

  // Grant geolocation permission to localhost
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:5173', ['geolocation']);

  let page;
  try {
    page = await browser.newPage();

    // Mock geolocation to office coordinates (17.4927263, 78.413989)
    await page.setGeolocation({ latitude: 17.4927263, longitude: 78.413989 });

    // Log page console messages
    page.on('console', msg => {
      console.log(`[browser-console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    // 1. Login as Employee
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    console.log('Filling employee credentials...');
    await setReactInputValue(page, 'input[type="text"]', 'sravan');
    await setReactInputValue(page, 'input[type="password"]', 'Sravan@123');
    await new Promise(r => setTimeout(r, 500));

    console.log('Submitting login...');
    await page.evaluate(() => {
      document.querySelector('button[type="submit"]').click();
    });

    await page.waitForFunction(() => window.location.href.includes('/employee'), { timeout: 10000 });
    console.log('Successfully logged in.');

    // 2. Set approved device ID in localStorage
    console.log('Injecting approved device ID into localStorage...');
    await page.evaluate(() => {
      localStorage.setItem('attendance_device_id_v1', '7ee4fed5-f53c-4298-84a4-0540b4da1bf3');
    });

    // Reload page so it picks up the device ID from localStorage
    console.log('Reloading dashboard to apply device ID...');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    // 3. Verify place
    console.log('Clicking "Verify place" to check geolocation...');
    await page.evaluate(() => {
      // Find button containing "Verify place"
      const buttons = Array.from(document.querySelectorAll('button'));
      const verifyBtn = buttons.find(b => b.textContent.includes('Verify place'));
      if (verifyBtn) verifyBtn.click();
    });

    // Wait for geofence verification response
    await new Promise(r => setTimeout(r, 2000));
    const locationStatusScreenshot = path.join(artifactDir, 'location_verified.png');
    await page.screenshot({ path: locationStatusScreenshot });
    console.log(`✅ Captured location status screenshot: ${locationStatusScreenshot}`);

    // 4. Locate check-in and check-out file inputs
    const fileInputs = await page.$$('input[type="file"]');
    let checkInInput;
    let checkOutInput;
    for (const input of fileInputs) {
      const parentText = await page.evaluate(el => el.parentElement.textContent, input);
      if (parentText.includes('Check in')) {
        checkInInput = input;
      } else if (parentText.includes('Check out')) {
        checkOutInput = input;
      }
    }

    if (!checkInInput) {
      throw new Error('Check-in file input not found');
    }

    // 5. Try Check-In
    const isCheckInDisabled = await page.evaluate(el => el.parentElement.disabled, checkInInput);
    if (isCheckInDisabled) {
      console.log('⚠️ Check-in button is disabled. Already checked in today? Checking database status...');
    } else {
      console.log('Uploading photo to perform Check-In...');
      await checkInInput.uploadFile(dummyImgPath);

      // Wait for punch response to process
      console.log('Waiting for Check-In completion...');
      await new Promise(r => setTimeout(r, 5000));

      const checkInScreenshot = path.join(artifactDir, 'checkin_attempt.png');
      await page.screenshot({ path: checkInScreenshot });
      console.log(`✅ Captured Check-In result screenshot: ${checkInScreenshot}`);
    }

    // 6. Try Check-Out
    // Re-locate inputs in case of page updates
    const fileInputs2 = await page.$$('input[type="file"]');
    for (const input of fileInputs2) {
      const parentText = await page.evaluate(el => el.parentElement.textContent, input);
      if (parentText.includes('Check out')) {
        checkOutInput = input;
      }
    }

    if (checkOutInput) {
      const isCheckOutDisabled = await page.evaluate(el => el.parentElement.disabled, checkOutInput);
      if (isCheckOutDisabled) {
        console.log('⚠️ Check-out button is disabled.');
      } else {
        console.log('Uploading photo to perform Check-Out...');
        await checkOutInput.uploadFile(dummyImgPath);

        // Wait for punch response to process
        console.log('Waiting for Check-Out completion...');
        await new Promise(r => setTimeout(r, 5000));

        const checkOutScreenshot = path.join(artifactDir, 'checkout_attempt.png');
        await page.screenshot({ path: checkOutScreenshot });
        console.log(`✅ Captured Check-Out result screenshot: ${checkOutScreenshot}`);
      }
    } else {
      console.log('Check-out button not available.');
    }

  } catch (err) {
    console.error('❌ Error during E2E browser punch automation:', err);
    if (page) {
      const errScreenshot = path.join(artifactDir, 'punch_error.png');
      await page.screenshot({ path: errScreenshot });
      console.log(`Saved error screenshot to: ${errScreenshot}`);
    }
  } finally {
    await browser.close();
    console.log('\n=== BROWSER E2E ATTENDANCE PUNCH VALIDATION COMPLETED ===');
  }
}

runPunchTest();
