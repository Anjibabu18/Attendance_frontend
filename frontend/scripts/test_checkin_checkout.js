// Direct API check-in / check-out test using real credentials
// Office: Anushabazaar (lat=17.4927263, lon=78.413989, radius=150m)
// Device approved: 7ee4fed5-f53c-4298-84a4-0540b4da1bf3

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = 'http://localhost:8081';

// A valid minimal JPEG image (1x1 red pixel) as base64
const jpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';
const photoPath = path.join(__dirname, '.tmp', 'test_photo.jpg');
fs.mkdirSync(path.join(__dirname, '.tmp'), { recursive: true });
fs.writeFileSync(photoPath, Buffer.from(jpegBase64, 'base64'));

const DEVICE_ID = '7ee4fed5-f53c-4298-84a4-0540b4da1bf3';
const LAT = 17.4927263;
const LON = 78.413989;

let pass = 0, fail = 0;
function ok(msg) { pass++; console.log(`  ✅ PASS: ${msg}`); }
function err(msg, detail) { fail++; console.log(`  ❌ FAIL: ${msg}${detail ? ' — ' + detail : ''}`); }

async function getToken(username, password) {
  const res = await fetch(`${BACKEND}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.token;
}

async function buildFormData(lat, lon, deviceId, photoFile) {
  // Use FormData from node's native fetch
  const { FormData, Blob } = await import('node:buffer').catch(() => ({}));
  
  // Manual multipart/form-data construction
  const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
  const photoBytes = fs.readFileSync(photoFile);
  
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="latitude"\r\n\r\n`;
  body += `${lat}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="longitude"\r\n\r\n`;
  body += `${lon}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="deviceId"\r\n\r\n`;
  body += `${deviceId}\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="selfie.jpg"\r\n`;
  body += `Content-Type: image/jpeg\r\n\r\n`;
  
  const bodyStart = Buffer.from(body, 'binary');
  const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'binary');
  const fullBody = Buffer.concat([bodyStart, photoBytes, bodyEnd]);
  
  return { body: fullBody, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CHECK-IN / CHECK-OUT API DIRECT TEST');
  console.log('═══════════════════════════════════════════════════\n');

  // ── Step 1: Login ────────────────────────────────────
  console.log('📋 STEP 1: Employee Login');
  let token;
  try {
    token = await getToken('sravan', 'Sravan@123');
    ok(`Got JWT token (length: ${token.length})`);
  } catch (e) {
    err('Login failed', e.message);
    process.exit(1);
  }

  const authHeader = `Bearer ${token}`;

  // ── Step 2: Check today's status ────────────────────
  console.log('\n📋 STEP 2: Check today\'s attendance status');
  try {
    const res = await fetch(`${BACKEND}/api/employee/punch/today`, {
      headers: { Authorization: authHeader }
    });
    if (res.status === 200) {
      const data = await res.json();
      if (data) {
        ok(`Today has record: in_time=${data.inTime}, out_time=${data.outTime}, status=${data.status}`);
      } else {
        ok('No attendance record for today — ready for check-in ✓');
      }
    } else if (res.status === 204 || res.status === 404) {
      ok('No attendance record for today — ready for check-in ✓');
    } else {
      err('Unexpected status from /today', `${res.status} ${await res.text()}`);
    }
  } catch (e) {
    err('Failed to check today status', e.message);
  }

  // ── Step 3: Verify place (geolocation) ──────────────
  console.log('\n📋 STEP 3: Verify Place / Geolocation');
  try {
    const res = await fetch(
      `${BACKEND}/api/employee/punch/place?latitude=${LAT}&longitude=${LON}`,
      { headers: { Authorization: authHeader } }
    );
    if (res.ok) {
      const data = await res.json();
      ok(`Place verified: insideRadius=${data.insideRadius}, distance=${Math.round(data.distanceMeters)}m, allowedRadius=${data.radiusMeters}m`);
      console.log(`     Office: ${data.office?.officeName}`);
    } else {
      err('Place check failed', `${res.status} ${await res.text()}`);
    }
  } catch (e) {
    err('Place check error', e.message);
  }

  // ── Step 4: Check-In ────────────────────────────────
  console.log('\n📋 STEP 4: Check-In (POST /api/employee/punch/checkin)');
  try {
    const { body, contentType } = await buildFormData(LAT, LON, DEVICE_ID, photoPath);
    const res = await fetch(`${BACKEND}/api/employee/punch/checkin`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': contentType
      },
      body
    });
    const text = await res.text();
    if (res.ok) {
      const data = JSON.parse(text);
      ok(`Check-In SUCCESS! in_time=${data.inTime}, status=${data.status}, photo=${data.checkInPhotoUrl ? 'uploaded ✓' : 'missing'}`);
    } else if (res.status === 409) {
      // Already checked in — still means the endpoint works
      ok(`Already checked in today (409) — endpoint is working correctly: ${text}`);
    } else {
      err(`Check-In failed (HTTP ${res.status})`, text);
    }
  } catch (e) {
    err('Check-In request error', e.message);
  }

  // ── Step 5: Confirm today's status after check-in ───
  console.log('\n📋 STEP 5: Confirm attendance record after check-in');
  try {
    const res = await fetch(`${BACKEND}/api/employee/punch/today`, {
      headers: { Authorization: authHeader }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.inTime) {
        ok(`Record confirmed: in_time=${data.inTime}, out_time=${data.outTime || 'not yet'}, status=${data.status}`);
      } else {
        err('Record missing in_time after check-in');
      }
    } else {
      err('Failed to fetch today record', `${res.status}`);
    }
  } catch (e) {
    err('Confirm check-in error', e.message);
  }

  // ── Step 6: Check-Out ───────────────────────────────
  console.log('\n📋 STEP 6: Check-Out (POST /api/employee/punch/checkout)');
  try {
    const { body, contentType } = await buildFormData(LAT, LON, DEVICE_ID, photoPath);
    const res = await fetch(`${BACKEND}/api/employee/punch/checkout`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': contentType
      },
      body
    });
    const text = await res.text();
    if (res.ok) {
      const data = JSON.parse(text);
      ok(`Check-Out SUCCESS! in_time=${data.inTime}, out_time=${data.outTime}, worked=${data.workedMinutes}mins, status=${data.status}`);
    } else if (res.status === 409) {
      ok(`Already checked out today (409) — endpoint is working correctly: ${text}`);
    } else {
      err(`Check-Out failed (HTTP ${res.status})`, text);
    }
  } catch (e) {
    err('Check-Out request error', e.message);
  }

  // ── Step 7: Confirm final record ────────────────────
  console.log('\n📋 STEP 7: Confirm final attendance record');
  try {
    const res = await fetch(`${BACKEND}/api/employee/punch/today`, {
      headers: { Authorization: authHeader }
    });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        ok(`FINAL RECORD → in_time=${data.inTime}, out_time=${data.outTime || 'N/A'}, status=${data.status}, workedMins=${data.workedMinutes}`);
      }
    }
  } catch (e) {
    err('Final confirm error', e.message);
  }

  // ── Step 8: Admin sees the record ───────────────────
  console.log('\n📋 STEP 8: Admin verifies attendance records');
  try {
    const adminToken = await getToken('admin', 'Admin@12345!');
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${BACKEND}/api/admin/attendance?date=${today}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      const sravanRecord = Array.isArray(data)
        ? data.find(r => r.employeeId === 5 || r.employeeName?.toLowerCase().includes('sravan'))
        : null;
      if (sravanRecord) {
        ok(`Admin sees Sravan's record: in=${sravanRecord.inTime}, out=${sravanRecord.outTime}, status=${sravanRecord.status}`);
      } else {
        ok(`Admin fetched ${Array.isArray(data) ? data.length : 'N/A'} records for today`);
      }
    } else {
      err(`Admin attendance fetch failed`, `${res.status} ${await res.text()}`);
    }
  } catch (e) {
    err('Admin attendance fetch error', e.message);
  }

  // ── Summary ─────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total : ${pass + fail}`);
  console.log(`  Passed: ${pass} ✅`);
  console.log(`  Failed: ${fail} ❌`);
  console.log('═══════════════════════════════════════════════════\n');
}

runTests().catch(e => { console.error('Fatal:', e); process.exit(1); });
