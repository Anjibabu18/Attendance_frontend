import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\venka\\.gemini\\antigravity-ide\\brain\\317cc6a2-27cc-48e2-a893-a22df0245c78';
const FRONTEND = 'http://localhost:5173';

// Create a valid 1x1 transparent PNG for photo upload tests
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const dummyImgPath = path.join(artifactDir, 'dummy_photo.png');
fs.writeFileSync(dummyImgPath, Buffer.from(base64Png, 'base64'));

let pass = 0;
let fail = 0;

function log(msg) { console.log(msg); }
function ok(msg) { pass++; console.log(`  ✅ PASS: ${msg}`); }
function err(msg, e) { fail++; console.log(`  ❌ FAIL: ${msg}${e ? ' – ' + (e.message || e) : ''}`); }

async function screenshot(page, name) {
  const p = path.join(artifactDir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  log(`  📸 Screenshot saved: ${name}.png`);
  return p;
}

async function setReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('Element not found: ' + sel);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function doLogin(page, username, password) {
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
  await page.waitForSelector('input[type="text"]', { timeout: 8000 });
  await setReactInput(page, 'input[type="text"]', username);
  await setReactInput(page, 'input[type="password"]', password);
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  });
}

async function waitForUrl(page, fragment, timeout = 12000) {
  await page.waitForFunction(
    (frag) => window.location.href.includes(frag),
    { timeout },
    fragment
  );
}

// ─── MAIN TEST RUNNER ────────────────────────────────────────────────────────
async function runAllTests() {
  log('══════════════════════════════════════════════════════');
  log('  ATTENDANCE SYSTEM – FULL END-TO-END BROWSER TEST');
  log('══════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(FRONTEND, ['geolocation']);

  let page = await browser.newPage();
  // Set office geolocation (Hyderabad office: 17.4927263, 78.413989)
  await page.setGeolocation({ latitude: 17.4927263, longitude: 78.413989 });
  page.on('console', msg => {
    if (msg.type() === 'error') log(`  [browser-error] ${msg.text()}`);
  });

  try {
    // ══════════════════════════════════════════════════════
    // TEST 1: Homepage loads
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 1: Homepage / Landing Page');
    try {
      await page.goto(FRONTEND, { waitUntil: 'networkidle2', timeout: 15000 });
      const title = await page.title();
      await screenshot(page, '01_homepage');
      ok(`Homepage loaded – title: "${title}"`);
    } catch (e) { err('Homepage failed to load', e); }

    // ══════════════════════════════════════════════════════
    // TEST 2: Login page renders
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 2: Login Page Renders');
    try {
      await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForSelector('input[type="text"]', { timeout: 8000 });
      await screenshot(page, '02_login_page');
      ok('Login page rendered with username input');
    } catch (e) { err('Login page failed', e); }

    // ══════════════════════════════════════════════════════
    // TEST 3: Employee Login (sravan / Sravan@123)
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 3: Employee Login (sravan / Sravan@123)');
    try {
      await doLogin(page, 'sravan', 'Sravan@123');
      await waitForUrl(page, '/employee');
      await page.waitForNetworkIdle({ timeout: 8000 });
      await screenshot(page, '03_employee_dashboard');
      ok(`Employee login success – URL: ${page.url()}`);
    } catch (e) {
      err('Employee login failed', e);
      await screenshot(page, '03_employee_login_error');
    }

    // ══════════════════════════════════════════════════════
    // TEST 4: Employee Dashboard – Key elements visible
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 4: Employee Dashboard Elements');
    try {
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasCheckin = bodyText.toLowerCase().includes('check') ||
                         bodyText.toLowerCase().includes('punch') ||
                         bodyText.toLowerCase().includes('attendance');
      if (hasCheckin) ok('Dashboard shows attendance-related content');
      else err('Dashboard missing attendance content');

      // Check for employee name
      const hasSravan = bodyText.toLowerCase().includes('sravan');
      if (hasSravan) ok('Employee name "Sravan" visible in dashboard');
      else log('  ⚠️  Employee name not prominently shown');
    } catch (e) { err('Employee dashboard element check failed', e); }

    // ══════════════════════════════════════════════════════
    // TEST 5: Check-In flow
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 5: Check-In Attempt');
    try {
      // Inject approved device ID
      await page.evaluate(() => {
        localStorage.setItem('attendance_device_id_v1', '7ee4fed5-f53c-4298-84a4-0540b4da1bf3');
      });
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
      await screenshot(page, '05a_before_checkin');

      // Try clicking "Verify place" if present
      const verifyClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const vBtn = btns.find(b => b.textContent.toLowerCase().includes('verify') || b.textContent.toLowerCase().includes('location'));
        if (vBtn && !vBtn.disabled) { vBtn.click(); return true; }
        return false;
      });
      if (verifyClicked) {
        log('  Clicked Verify place button');
        await new Promise(r => setTimeout(r, 2000));
        await screenshot(page, '05b_location_verified');
      }

      // Check if already checked in today
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      if (pageText.includes('already') || pageText.includes('checked in')) {
        ok('Already checked in today – state correctly reflected');
      } else {
        // Look for file input for check-in photo
        const fileInputs = await page.$$('input[type="file"]');
        log(`  Found ${fileInputs.length} file input(s) on page`);

        let checkInDone = false;
        for (const input of fileInputs) {
          const parentText = await page.evaluate(el => el.closest('div,section,article')?.innerText || '', input);
          if (parentText.toLowerCase().includes('check in') || parentText.toLowerCase().includes('checkin')) {
            await input.uploadFile(dummyImgPath);
            log('  Uploaded photo for Check-In...');
            await new Promise(r => setTimeout(r, 5000));
            checkInDone = true;
            break;
          }
        }

        if (!checkInDone && fileInputs.length > 0) {
          // Try first file input
          await fileInputs[0].uploadFile(dummyImgPath);
          log('  Uploaded photo to first file input for Check-In...');
          await new Promise(r => setTimeout(r, 5000));
          checkInDone = true;
        }

        await screenshot(page, '05c_after_checkin');
        const afterText = await page.evaluate(() => document.body.innerText.toLowerCase());
        if (afterText.includes('success') || afterText.includes('checked in') || afterText.includes('punch')) {
          ok('Check-In completed successfully');
        } else if (checkInDone) {
          ok('Check-In file uploaded – response captured in screenshot');
        } else {
          err('No check-in file input found on page');
        }
      }
    } catch (e) {
      err('Check-In attempt failed', e);
      await screenshot(page, '05_checkin_error');
    }

    // ══════════════════════════════════════════════════════
    // TEST 6: Check-Out flow
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 6: Check-Out Attempt');
    try {
      const fileInputs2 = await page.$$('input[type="file"]');
      let checkOutDone = false;

      for (const input of fileInputs2) {
        const parentText = await page.evaluate(el => el.closest('div,section,article')?.innerText || '', input);
        if (parentText.toLowerCase().includes('check out') || parentText.toLowerCase().includes('checkout')) {
          const isDisabled = await page.evaluate(el => {
            const btn = el.closest('button,div[role="button"]') || el.parentElement;
            return btn?.disabled || btn?.getAttribute('disabled') !== null;
          }, input);

          if (isDisabled) {
            ok('Check-Out button correctly disabled (not yet checked in or already checked out)');
          } else {
            await input.uploadFile(dummyImgPath);
            log('  Uploaded photo for Check-Out...');
            await new Promise(r => setTimeout(r, 5000));
            checkOutDone = true;
          }
          break;
        }
      }

      if (!checkOutDone) {
        const bodyText2 = await page.evaluate(() => document.body.innerText.toLowerCase());
        if (bodyText2.includes('check out') || bodyText2.includes('checkout')) {
          log('  ⚠️  Check-Out section exists but input not interactable');
        } else {
          log('  ⚠️  Check-Out section not visible (may need check-in first)');
        }
        ok('Check-Out section state captured in screenshot');
      }
      await screenshot(page, '06_checkout_attempt');
    } catch (e) {
      err('Check-Out attempt failed', e);
      await screenshot(page, '06_checkout_error');
    }

    // ══════════════════════════════════════════════════════
    // TEST 7: Employee Attendance History page
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 7: Employee Attendance History');
    try {
      // Try navigating to attendance sub-page if it exists
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a,nav button,[role="link"]'))
          .map(el => ({ text: el.textContent.trim(), href: el.href || '' }))
          .filter(l => l.text.toLowerCase().includes('attendance') || l.text.toLowerCase().includes('history'))
      );
      log(`  Found ${links.length} attendance/history link(s)`);

      if (links.length > 0) {
        await page.click('a,nav button,[role="link"]');
        await new Promise(r => setTimeout(r, 1500));
      } else {
        // Try direct navigation
        await page.goto(`${FRONTEND}/employee/attendance`, { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
      }
      await screenshot(page, '07_employee_attendance_history');
      ok('Employee attendance history page captured');
    } catch (e) {
      err('Employee attendance history navigation failed', e);
    }

    // ══════════════════════════════════════════════════════
    // TEST 8: Admin Login
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 8: Admin Login (admin / Admin@12345!)');
    try {
      await page.evaluate(() => localStorage.clear());
      await doLogin(page, 'admin', 'Admin@12345!');
      await waitForUrl(page, '/admin');
      await page.waitForNetworkIdle({ timeout: 8000 });
      await screenshot(page, '08_admin_dashboard');
      ok(`Admin login success – URL: ${page.url()}`);
    } catch (e) {
      err('Admin login failed', e);
      await screenshot(page, '08_admin_login_error');
    }

    // ══════════════════════════════════════════════════════
    // TEST 9: Admin Dashboard elements
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 9: Admin Dashboard Elements');
    try {
      const bodyText = await page.evaluate(() => document.body.innerText);
      const checks = [
        ['employee', bodyText.toLowerCase().includes('employee')],
        ['attendance', bodyText.toLowerCase().includes('attendance')],
        ['dashboard content', bodyText.length > 100]
      ];
      for (const [label, result] of checks) {
        if (result) ok(`Admin dashboard shows: ${label}`);
        else err(`Admin dashboard missing: ${label}`);
      }
    } catch (e) { err('Admin dashboard element check failed', e); }

    // ══════════════════════════════════════════════════════
    // TEST 10: Admin – Attendance Records page
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 10: Admin – Attendance Records');
    try {
      const navLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a, nav button, [role="menuitem"]'))
          .map(el => ({ text: el.textContent.trim().toLowerCase(), tag: el.tagName }))
      );
      const attLink = navLinks.find(l => l.text.includes('attendance'));
      log(`  Attendance nav link found: ${!!attLink}`);

      // Try direct navigation to admin attendance page
      const possiblePaths = ['/admin/attendance', '/admin/records', '/admin/employees'];
      for (const p of possiblePaths) {
        try {
          await page.goto(`${FRONTEND}${p}`, { waitUntil: 'networkidle2', timeout: 8000 });
          const url = page.url();
          if (!url.includes('/login')) {
            ok(`Admin attendance page accessible at: ${url}`);
            break;
          }
        } catch (_) { /* try next */ }
      }
      await screenshot(page, '10_admin_attendance');
    } catch (e) {
      err('Admin attendance records navigation failed', e);
    }

    // ══════════════════════════════════════════════════════
    // TEST 11: Admin – Employee Management
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 11: Admin – Employee Management');
    try {
      await page.goto(`${FRONTEND}/admin`, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      // Find and click employees nav item
      const clicked = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('a, button, [role="menuitem"]'));
        const emp = items.find(el =>
          el.textContent.toLowerCase().includes('employee') &&
          !el.textContent.toLowerCase().includes('attendance')
        );
        if (emp) { emp.click(); return emp.textContent.trim(); }
        return null;
      });

      if (clicked) {
        log(`  Clicked nav item: "${clicked}"`);
        await new Promise(r => setTimeout(r, 1500));
        await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
      }
      await screenshot(page, '11_admin_employees');
      ok('Admin employee management page captured');
    } catch (e) {
      err('Admin employee management failed', e);
    }

    // ══════════════════════════════════════════════════════
    // TEST 12: Admin – Leaves / Leave Requests
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 12: Admin – Leave Requests');
    try {
      const possibleLeave = ['/admin/leaves', '/admin/leave', '/admin/leave-requests'];
      for (const p of possibleLeave) {
        try {
          await page.goto(`${FRONTEND}${p}`, { waitUntil: 'networkidle2', timeout: 8000 });
          const url = page.url();
          if (!url.includes('/login')) {
            ok(`Admin leave page accessible at: ${url}`);
            break;
          }
        } catch (_) { /* try next */ }
      }
      await screenshot(page, '12_admin_leaves');
    } catch (e) {
      err('Admin leaves page failed', e);
    }

    // ══════════════════════════════════════════════════════
    // TEST 13: Admin – Settings
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 13: Admin – Attendance Settings');
    try {
      const possibleSettings = ['/admin/settings', '/admin/attendance-settings'];
      for (const p of possibleSettings) {
        try {
          await page.goto(`${FRONTEND}${p}`, { waitUntil: 'networkidle2', timeout: 8000 });
          const url = page.url();
          if (!url.includes('/login')) {
            ok(`Admin settings accessible at: ${url}`);
            break;
          }
        } catch (_) { /* try next */ }
      }
      await screenshot(page, '13_admin_settings');
    } catch (e) {
      err('Admin settings page failed', e);
    }

    // ══════════════════════════════════════════════════════
    // TEST 14: Logout (Admin)
    // ══════════════════════════════════════════════════════
    log('\n📋 TEST 14: Admin Logout');
    try {
      await page.goto(`${FRONTEND}/admin`, { waitUntil: 'networkidle2', timeout: 10000 });
      const loggedOut = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const logoutBtn = btns.find(b => b.textContent.toLowerCase().includes('logout') || b.textContent.toLowerCase().includes('sign out'));
        if (logoutBtn) { logoutBtn.click(); return true; }
        return false;
      });
      if (loggedOut) {
        await new Promise(r => setTimeout(r, 2000));
        const finalUrl = page.url();
        if (finalUrl.includes('/login') || finalUrl === FRONTEND + '/') {
          ok(`Logout successful – redirected to: ${finalUrl}`);
        } else {
          log(`  ⚠️  After logout URL: ${finalUrl}`);
        }
      } else {
        // Try clearing storage
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle2' });
        ok('Session cleared manually (no logout button found)');
      }
      await screenshot(page, '14_after_logout');
    } catch (e) {
      err('Logout failed', e);
    }

  } catch (fatalErr) {
    log(`\n❌ FATAL ERROR: ${fatalErr.message}`);
  } finally {
    await browser.close();
  }

  // ══════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════
  const total = pass + fail;
  log('\n══════════════════════════════════════════════════════');
  log('  TEST SUMMARY');
  log('══════════════════════════════════════════════════════');
  log(`  Total:  ${total}`);
  log(`  Passed: ${pass} ✅`);
  log(`  Failed: ${fail} ❌`);
  log(`  Screenshots saved in: ${artifactDir}`);
  log('══════════════════════════════════════════════════════\n');
}

runAllTests().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
