const http = require('http');

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
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
  console.log('--- STARTING SPRINT 8 TESTS ---');

  // 1. Setup Sessions
  const adminRes = await request({ ...BASE_OPTIONS, path: '/api/auth/admin-login', method: 'POST' }, { username: 'admin', password: 'admin123' });
  const adminCookie = adminRes.headers['set-cookie'][0].split(';')[0];
  const adminHeaders = { ...BASE_OPTIONS.headers, 'Cookie': adminCookie };

  const username1 = 'pat_h1_' + Date.now();
  await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P1 History', username: username1, password: 'password', confirmPassword: 'password', phone: '123' });
  const p1Res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: username1, password: 'password' });
  const p1Headers = { ...BASE_OPTIONS.headers, 'Cookie': p1Res.headers['set-cookie'][0].split(';')[0] };

  const username2 = 'pat_h2_' + Date.now();
  await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P2 Archive', username: username2, password: 'password', confirmPassword: 'password', phone: '123' });
  const p2Res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: username2, password: 'password' });
  const p2Headers = { ...BASE_OPTIONS.headers, 'Cookie': p2Res.headers['set-cookie'][0].split(';')[0] };

  // Setup Data
  const dRes = await request({ ...BASE_OPTIONS, path: '/api/doctors', method: 'POST', headers: adminHeaders }, { name: 'Dr. Archive', specialization: 'Archivology' });
  const doctorId = dRes.data.data.id;
  
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayStr = days[today.getDay()];
  const dateStr = today.toISOString().split('T')[0];

  const sRes = await request({ ...BASE_OPTIONS, path: '/api/schedules', method: 'POST', headers: adminHeaders }, {
    doctor_id: doctorId, day: todayDayStr, start_time: '16:00', end_time: '17:00', quota: 5
  });
  const scheduleId = sRes.data.data.id;

  // Bookings
  const b1Res = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: p1Headers }, {
    schedule_id: scheduleId, visit_date: dateStr, time_slot: '16:00-17:00', complaint: 'test1'
  });
  const booking1Code = b1Res.data.data.booking_code;

  const b2Res = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: p2Headers }, {
    schedule_id: scheduleId, visit_date: dateStr, time_slot: '16:00-17:00', complaint: 'test2'
  });

  // TESTS
  await runTest('Patient History unauthenticated access rejected', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/bookings/history', method: 'GET' });
    if (res.status !== 401) throw new Error('Expected 401');
  });

  await runTest('Admin Archive unauthenticated access rejected', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/archives/bookings', method: 'GET' });
    if (res.status !== 401) throw new Error('Expected 401');
  });

  await runTest('Patient retrieves own history accurately', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/bookings/history', method: 'GET', headers: p1Headers });
    if (res.data.data.length !== 1) throw new Error('Expected 1 booking');
    if (res.data.data[0].booking_code !== booking1Code) throw new Error('Booking code mismatch');
  });

  await runTest('Patient cannot retrieve another patient history', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/bookings/history', method: 'GET', headers: p2Headers });
    if (res.data.data.some(b => b.booking_code === booking1Code)) throw new Error('Privacy violation');
  });

  await runTest('Patient Pagination Metadata works', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/bookings/history?page=1&limit=5', method: 'GET', headers: p1Headers });
    if (!res.data.pagination) throw new Error('Missing pagination');
    if (res.data.pagination.limit !== 5) throw new Error('Limit mismatch');
  });

  await runTest('Admin Search by Booking Code works', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/archives/bookings?search=${booking1Code}`, method: 'GET', headers: adminHeaders });
    if (res.data.data.length !== 1) throw new Error('Expected exactly 1 booking found via search');
  });

  await runTest('Admin Search by Patient Name works', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/archives/bookings?search=P1%20History`, method: 'GET', headers: adminHeaders });
    if (res.data.data.length < 1) {
      console.log('Got data:', res.data);
      throw new Error('Expected at least 1 booking found via search');
    }
  });

  await runTest('Admin Combined Filters work', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/archives/bookings?date=${dateStr}&doctor_id=${doctorId}&status=Confirmed`, method: 'GET', headers: adminHeaders });
    if (res.data.data.length < 2) throw new Error('Expected at least 2 matching bookings for combined filters');
  });

  await runTest('Empty state search returns 200 with empty array', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/archives/bookings?search=NONEXISTENT_CODE`, method: 'GET', headers: adminHeaders });
    if (res.status !== 200) throw new Error('Expected 200 OK');
    if (res.data.data.length !== 0) throw new Error('Expected empty array');
  });

  console.log('--- TESTS FINISHED ---');
}

main();
