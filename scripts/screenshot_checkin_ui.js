// Browser screenshot test – show check-in/check-out UI state visually
import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\venka\\.gemini\\antigravity-ide\\brain\\317cc6a2-27cc-48e2-a893-a22df0245c78';
const FRONTEND = 'http://localhost:5173';

async function setReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('Not found: ' + sel);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const ctx = browser.defaultBrowserContext();
  await ctx.overridePermissions(FRONTEND, ['geolocation']);

  const page = await browser.newPage();
  await page.setGeolocation({ latitude: 17.4927263, longitude: 78.413989 });

  try {
    // LOGIN as sravan
    console.log('Logging in as sravan...');
    await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="text"]', { timeout: 8000 });
    await setReactInput(page, 'input[type="text"]', 'sravan');
    await setReactInput(page, 'input[type="password"]', 'Sravan@123');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
    await page.waitForFunction(() => location.href.includes('/employee'), { timeout: 12000 });
    await page.waitForNetworkIdle({ timeout: 8000 });

    // Inject device ID
    await page.evaluate(() => {
      localStorage.setItem('attendance_device_id_v1', '7ee4fed5-f53c-4298-84a4-0540b4da1bf3');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot: Employee punch panel
    await page.screenshot({ path: path.join(artifactDir, 'checkin_ui_state.png'), fullPage: false });
    console.log('✅ Saved: checkin_ui_state.png');

    // Get page text to understand state
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page text snippet:', bodyText.substring(0, 400));

    // Look for today's attendance info on page
    const hasCheckedIn = bodyText.toLowerCase().includes('checked in') ||
                         bodyText.toLowerCase().includes('check in') ||
                         bodyText.toLowerCase().includes('punch') ||
                         bodyText.toLowerCase().includes('in time') ||
                         bodyText.toLowerCase().includes('16:05');

    console.log('Today attendance visible on page:', hasCheckedIn);

    // LOGIN as admin and check attendance records
    console.log('\nLogging in as admin...');
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="text"]', { timeout: 8000 });
    await setReactInput(page, 'input[type="text"]', 'admin');
    await setReactInput(page, 'input[type="password"]', 'Admin@12345!');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.querySelector('button[type="submit"]')?.click());
    await page.waitForFunction(() => location.href.includes('/admin'), { timeout: 12000 });
    await page.waitForNetworkIdle({ timeout: 8000 });

    await page.screenshot({ path: path.join(artifactDir, 'admin_after_checkin.png'), fullPage: false });
    console.log('✅ Saved: admin_after_checkin.png');

    // Try to navigate to attendance view
    const clicked = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('nav a, nav button, [role="menuitem"], aside a, aside button'));
      const att = items.find(el => el.textContent.toLowerCase().includes('attendance'));
      if (att) { att.click(); return att.textContent.trim(); }
      return null;
    });
    if (clicked) {
      console.log(`Clicked: ${clicked}`);
      await new Promise(r => setTimeout(r, 2000));
      await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
      await page.screenshot({ path: path.join(artifactDir, 'admin_attendance_view.png'), fullPage: false });
      console.log('✅ Saved: admin_attendance_view.png');
    }

  } catch (e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: path.join(artifactDir, 'ui_error.png') });
  } finally {
    await browser.close();
    console.log('\nDone. Screenshots saved to artifact dir.');
  }
}

run().catch(console.error);
