const http = require('http');

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json, rawData: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, rawData: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const BASE_OPTIONS = {
  hostname: 'localhost',
  port: 3000,
  headers: {
    'Content-Type': 'application/json'
  }
};

const runTest = async (name, testFn) => {
  try {
    await testFn();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.log(`[FAIL] ${name}`);
    console.error('       ' + (error.message || error));
  }
};

async function main() {
  console.log('--- STARTING SPRINT 9 TESTS ---');

  // 1. Setup Sessions
  const adminRes = await request({ ...BASE_OPTIONS, path: '/api/auth/admin-login', method: 'POST' }, { username: 'admin', password: 'admin123' });
  const adminCookie = adminRes.headers['set-cookie'][0].split(';')[0];
  const adminHeaders = { ...BASE_OPTIONS.headers, 'Cookie': adminCookie };

  const username1 = 'pat_e1_' + Date.now();
  await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P1 Export', username: username1, password: 'password', confirmPassword: 'password', phone: '123' });
  const p1Res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: username1, password: 'password' });
  const p1Headers = { ...BASE_OPTIONS.headers, 'Cookie': p1Res.headers['set-cookie'][0].split(';')[0] };

  // Setup Data
  const dRes = await request({ ...BASE_OPTIONS, path: '/api/doctors', method: 'POST', headers: adminHeaders }, { name: 'Dr. Export', specialization: 'Exports' });
  const doctorId = dRes.data.data.id;
  
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayStr = days[today.getDay()];
  const dateStr = today.toISOString().split('T')[0];

  const sRes = await request({ ...BASE_OPTIONS, path: '/api/schedules', method: 'POST', headers: adminHeaders }, {
    doctor_id: doctorId, day: todayDayStr, start_time: '18:00', end_time: '19:00', quota: 5
  });
  const scheduleId = sRes.data.data.id;

  // Create 3 bookings using 3 different patients to bypass the "1 per day" limit
  for(let i=0; i<3; i++) {
      const u = 'pat_loop_' + i + '_' + Date.now();
      await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P_Loop_' + i, username: u, password: 'password', confirmPassword: 'password', phone: '123' });
      const pRes = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: u, password: 'password' });
      const pHead = { ...BASE_OPTIONS.headers, 'Cookie': pRes.headers['set-cookie'][0].split(';')[0] };

      await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: pHead }, {
        schedule_id: scheduleId, visit_date: dateStr, time_slot: '18:00-19:00', complaint: 'test_export'
      });
  }

  // TESTS
  await runTest('Unauthenticated PDF export rejected', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/archives/export/pdf', method: 'GET' });
    if (res.status !== 401) throw new Error('Expected 401');
  });

  await runTest('Unauthenticated CSV export rejected', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/archives/export/csv', method: 'GET' });
    if (res.status !== 401) throw new Error('Expected 401');
  });

  await runTest('Patient cannot access PDF export', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/archives/export/pdf', method: 'GET', headers: p1Headers });
    if (res.status !== 401) throw new Error('Expected 401 for patient');
  });

  await runTest('Admin CSV export has correct headers and BOM', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/archives/export/csv', method: 'GET', headers: adminHeaders });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.headers['content-type'].includes('text/csv')) throw new Error('Incorrect content type');
    if (!res.rawData.startsWith('\uFEFF')) throw new Error('Missing UTF-8 BOM');
    if (!res.rawData.includes('Dr. Export')) throw new Error('Missing data in CSV');
  });

  await runTest('Admin PDF export returns application/pdf', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/archives/export/pdf', method: 'GET', headers: adminHeaders });
    if (res.status !== 200) throw new Error('Expected 200');
    if (res.headers['content-type'] !== 'application/pdf') throw new Error('Incorrect content type');
    if (!res.rawData.startsWith('%PDF-')) throw new Error('Does not appear to be a PDF binary');
  });

  await runTest('Combined filters affect CSV correctly (Export respects filters)', async () => {
    // There are 3 bookings exactly matching Dr. Export
    const res = await request({ ...BASE_OPTIONS, path: `/api/archives/export/csv?doctor_id=${doctorId}`, method: 'GET', headers: adminHeaders });
    const rowCount = res.rawData.split('\n').filter(r => r.includes('Dr. Export')).length;
    if (rowCount !== 3) throw new Error(`Expected 3 rows matching Dr. Export, got ${rowCount}`);
  });

  await runTest('Export ignores pagination params (Retrieves all matching)', async () => {
    // If I hit archive with limit 1, I only get 1
    const resArchive = await request({ ...BASE_OPTIONS, path: `/api/archives/bookings?doctor_id=${doctorId}&limit=1`, method: 'GET', headers: adminHeaders });
    if (resArchive.data.data.length !== 1) throw new Error('Archive pagination limit failed');

    // But if I hit export with limit 1, it should ignore the limit and return all 3
    const resExport = await request({ ...BASE_OPTIONS, path: `/api/archives/export/csv?doctor_id=${doctorId}&limit=1`, method: 'GET', headers: adminHeaders });
    const rowCount = resExport.rawData.split('\n').filter(r => r.includes('Dr. Export')).length;
    if (rowCount !== 3) throw new Error(`Export restricted by limit, got ${rowCount}`);
  });

  console.log('--- TESTS FINISHED ---');
}

main();
