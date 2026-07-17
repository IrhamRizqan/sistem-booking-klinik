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
  console.log('--- STARTING SPRINT 6 TESTS ---');

  // 1. Setup Data & Sessions
  const adminRes = await request({ ...BASE_OPTIONS, path: '/api/auth/admin-login', method: 'POST' }, { username: 'admin', password: 'admin123' });
  const adminCookie = adminRes.headers['set-cookie'] ? adminRes.headers['set-cookie'][0].split(';')[0] : '';
  const adminHeaders = { ...BASE_OPTIONS.headers, 'Cookie': adminCookie };

  const username1 = 'pat_q1_' + Date.now();
  await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P1', username: username1, password: 'password', confirmPassword: 'password', phone: '123' });
  const p1Res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: username1, password: 'password' });
  const p1Headers = { ...BASE_OPTIONS.headers, 'Cookie': p1Res.headers['set-cookie'][0].split(';')[0] };

  const username2 = 'pat_q2_' + Date.now();
  await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P2', username: username2, password: 'password', confirmPassword: 'password', phone: '123' });
  const p2Res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: username2, password: 'password' });
  const p2Headers = { ...BASE_OPTIONS.headers, 'Cookie': p2Res.headers['set-cookie'][0].split(';')[0] };

  // Create Doctor and Schedule
  const dRes = await request({ ...BASE_OPTIONS, path: '/api/doctors', method: 'POST', headers: adminHeaders }, { name: 'Dr. Queue', specialization: 'Queueing' });
  const doctorId = dRes.data.data.id;
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const futureDayStr = days[futureDate.getDay()];
  const dateStr = futureDate.toISOString().split('T')[0];

  const sRes = await request({ ...BASE_OPTIONS, path: '/api/schedules', method: 'POST', headers: adminHeaders }, {
    doctor_id: doctorId, day: futureDayStr, start_time: '14:00', end_time: '15:00', quota: 5
  });
  const scheduleId = sRes.data.data.id;

  // Bookings
  const b1Res = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: p1Headers }, {
    schedule_id: scheduleId, visit_date: dateStr, time_slot: '14:00-15:00', complaint: 'test1'
  });
  const booking1Id = b1Res.data.data.id;

  const b2Res = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: p2Headers }, {
    schedule_id: scheduleId, visit_date: dateStr, time_slot: '14:00-15:00', complaint: 'test2'
  });
  const booking2Id = b2Res.data.data.id;

  // TESTS
  await runTest('Admin authentication required for queues', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/queues', method: 'GET' });
    if (res.status !== 401) throw new Error('Expected 401');
  });

  await runTest('Admin can retrieve queue list and it is ordered', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues?date=${dateStr}&doctor_id=${doctorId}&time_slot=14:00-15:00`, method: 'GET', headers: adminHeaders });
    if (res.status !== 200) throw new Error('Failed to fetch queues');
    if (res.data.data.length < 2) throw new Error('Expected at least 2 queues');
    if (res.data.data[0].queue_number >= res.data.data[1].queue_number) throw new Error('Queues not ordered correctly');
  });

  await runTest('CONFIRMED -> COMPLETED is rejected', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking1Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Completed' });
    if (res.status !== 400 || !res.data.message.includes('Cannot transition')) throw new Error('Expected rejection');
  });

  await runTest('CONFIRMED -> CALLING works', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking1Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Calling' });
    if (res.status !== 200 || res.data.data.status !== 'Calling') throw new Error('Transition failed');
  });

  await runTest('Two CALLING bookings for same slot are prevented', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking2Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Calling' });
    if (res.status !== 400 || !res.data.message.includes('Another patient')) throw new Error('Expected conflict rejection');
  });

  await runTest('CALLING -> ON_TREATMENT works', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking1Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'On Treatment' });
    if (res.status !== 200 || res.data.data.status !== 'On Treatment') throw new Error('Transition failed');
  });

  await runTest('ON_TREATMENT -> COMPLETED works', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking1Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Completed' });
    if (res.status !== 200 || res.data.data.status !== 'Completed') throw new Error('Transition failed');
  });

  await runTest('COMPLETED cannot transition again', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking1Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Calling' });
    if (res.status !== 400) throw new Error('Expected rejection');
  });

  await runTest('CALLING -> SKIPPED works', async () => {
    // Make booking 2 Calling
    await request({ ...BASE_OPTIONS, path: `/api/queues/${booking2Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Calling' });
    // Skip it
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking2Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Skipped' });
    if (res.status !== 200 || res.data.data.status !== 'Skipped') throw new Error('Transition failed');
  });

  await runTest('SKIPPED cannot transition again', async () => {
    const res = await request({ ...BASE_OPTIONS, path: `/api/queues/${booking2Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Calling' });
    if (res.status !== 400) throw new Error('Expected rejection');
  });

  console.log('--- TESTS FINISHED ---');
}

main();
