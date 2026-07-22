async function runTests() {
  const BACKEND_URL = 'http://localhost:8081';
  const FRONTEND_URL = 'http://localhost:5173';

  console.log('=== END-TO-END TEST AUTOMATION ===\n');

  // 1. Verify Frontend
  try {
    const feResponse = await fetch(FRONTEND_URL);
    if (feResponse.ok) {
      console.log(`✅ Frontend is active on ${FRONTEND_URL}`);
    } else {
      console.log(`❌ Frontend returned status ${feResponse.status} on ${FRONTEND_URL}`);
    }
  } catch (err) {
    console.error(`❌ Failed to connect to Frontend at ${FRONTEND_URL}:`, err.message);
  }

  // 2. Verify Backend connection
  let backendActive = false;
  try {
    const beResponse = await fetch(`${BACKEND_URL}/api/settings/attendance`);
    // Any HTTP status response (like 401 Unauthorized or 200 OK) means the server is reachable and active.
    if (beResponse.status === 200 || beResponse.status === 401) {
      console.log(`✅ Backend server is active on ${BACKEND_URL} (status ${beResponse.status})`);
      backendActive = true;
    } else {
      console.log(`❌ Backend returned unexpected status ${beResponse.status}`);
    }
  } catch (err) {
    console.error(`❌ Failed to connect to Backend at ${BACKEND_URL}:`, err.message);
  }

  if (!backendActive) {
    console.log('\nStopping tests: Backend is not reachable.');
    process.exit(1);
  }

  console.log('\n--- TESTING ADMIN LOGIN & ENDPOINTS ---');
  let adminToken = '';
  try {
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@12345!' }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      adminToken = data.token;
      console.log(`✅ Admin login successful! Token type: JWT`);
      console.log(`   Role: ${data.role}`);
    } else {
      const errText = await loginRes.text();
      console.error(`❌ Admin login failed: ${loginRes.status} - ${errText}`);
    }
  } catch (err) {
    console.error(`❌ Admin login request error:`, err.message);
  }

  if (adminToken) {
    const adminEndpoints = [
      { path: '/api/auth/me', name: 'Admin Me Info' },
      { path: '/api/admin/employees', name: 'Admin Employees List' },
      { path: '/api/admin/office-location', name: 'Admin Office Locations' },
      { path: '/api/admin/settings/attendance', name: 'Admin Attendance Settings' },
      { path: '/api/admin/company-roles', name: 'Admin Company Roles' },
    ];

    for (const ep of adminEndpoints) {
      try {
        const res = await fetch(`${BACKEND_URL}${ep.path}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`✅ ${ep.name} (${ep.path}) working! Status: ${res.status}`);
          if (ep.path === '/api/admin/employees') {
            console.log(`   Found ${data.length} registered employees.`);
          }
        } else {
          console.error(`❌ ${ep.name} (${ep.path}) failed: ${res.status}`);
        }
      } catch (err) {
        console.error(`❌ Error fetching ${ep.name}:`, err.message);
      }
    }
  }

  console.log('\n--- TESTING EMPLOYEE LOGIN & ENDPOINTS ---');
  let employeeToken = '';
  try {
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sravan', password: 'Sravan@123' }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      employeeToken = data.token;
      console.log(`✅ Employee login successful! Token type: JWT`);
      console.log(`   Employee ID: ${data.employeeId}, Name: ${data.name}`);
    } else {
      const errText = await loginRes.text();
      console.error(`❌ Employee login failed: ${loginRes.status} - ${errText}`);
    }
  } catch (err) {
    console.error(`❌ Employee login request error:`, err.message);
  }

  if (employeeToken) {
    const employeeEndpoints = [
      { path: '/api/auth/me', name: 'Employee Me Info' },
      { path: '/api/employee/profile', name: 'Employee Profile' },
      { path: '/api/employee/attendance?month=2026-06', name: 'Employee Attendance (June 2026)' },
      { path: '/api/employee/attendance/summary?month=2026-06', name: 'Employee Attendance Summary' },
      { path: '/api/employee/leave-requests', name: 'Employee Leave Requests' },
      { path: '/api/employee/breaks/today', name: 'Employee Breaks Today' },
    ];

    for (const ep of employeeEndpoints) {
      try {
        const res = await fetch(`${BACKEND_URL}${ep.path}`, {
          headers: { 'Authorization': `Bearer ${employeeToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`✅ ${ep.name} (${ep.path}) working! Status: ${res.status}`);
          if (ep.path === '/api/employee/profile') {
            console.log(`   Profile details: ${data.name} - ${data.employeeNumber}`);
          }
        } else {
          console.error(`❌ ${ep.name} (${ep.path}) failed: ${res.status}`);
        }
      } catch (err) {
        console.error(`❌ Error fetching ${ep.name}:`, err.message);
      }
    }
  }

  console.log('\n=== END-TO-END TEST AUTOMATION COMPLETED ===');
}

runTests();
