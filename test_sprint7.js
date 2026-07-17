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
  console.log('--- STARTING SPRINT 7 TESTS ---');

  // 1. Setup Sessions
  const adminRes = await request({ ...BASE_OPTIONS, path: '/api/auth/admin-login', method: 'POST' }, { username: 'admin', password: 'admin123' });
  const adminCookie = adminRes.headers['set-cookie'][0].split(';')[0];
  const adminHeaders = { ...BASE_OPTIONS.headers, 'Cookie': adminCookie };

  const username1 = 'pat_d1_' + Date.now();
  await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P1', username: username1, password: 'password', confirmPassword: 'password', phone: '123' });
  const p1Res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: username1, password: 'password' });
  const p1Headers = { ...BASE_OPTIONS.headers, 'Cookie': p1Res.headers['set-cookie'][0].split(';')[0] };

  const username2 = 'pat_d2_' + Date.now();
  await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'P2', username: username2, password: 'password', confirmPassword: 'password', phone: '123' });
  const p2Res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: username2, password: 'password' });
  const p2Headers = { ...BASE_OPTIONS.headers, 'Cookie': p2Res.headers['set-cookie'][0].split(';')[0] };

  // Setup Data
  const dRes = await request({ ...BASE_OPTIONS, path: '/api/doctors', method: 'POST', headers: adminHeaders }, { name: 'Dr. Dashboard', specialization: 'Dash' });
  const doctorId = dRes.data.data.id;
  
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayStr = days[today.getDay()];
  const dateStr = today.toISOString().split('T')[0];

  const sRes = await request({ ...BASE_OPTIONS, path: '/api/schedules', method: 'POST', headers: adminHeaders }, {
    doctor_id: doctorId, day: todayDayStr, start_time: '14:00', end_time: '15:00', quota: 5
  });
  const scheduleId = sRes.data.data.id;

  // TESTS
  await runTest('Admin Dashboard requires auth', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/dashboard/admin', method: 'GET' });
    if (res.status !== 401) throw new Error('Expected 401');
  });

  await runTest('Patient Dashboard requires auth', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/dashboard/patient/active', method: 'GET' });
    if (res.status !== 401) throw new Error('Expected 401');
  });

  await runTest('Patient empty state works', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/dashboard/patient/active', method: 'GET', headers: p1Headers });
    if (res.data.data !== null) throw new Error('Expected null data for empty state');
  });

  await runTest('Admin gets accurate initial counts', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/dashboard/admin', method: 'GET', headers: adminHeaders });
    if (typeof res.data.data.stats.totalDoctors !== 'number') throw new Error('Stats missing');
  });

  // Create bookings
  const b1Res = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: p1Headers }, {
    schedule_id: scheduleId, visit_date: dateStr, time_slot: '14:00-15:00', complaint: 'test1'
  });
  const b2Res = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: p2Headers }, {
    schedule_id: scheduleId, visit_date: dateStr, time_slot: '14:00-15:00', complaint: 'test2'
  });
  const booking1Id = b1Res.data.data.id;

  await runTest('Patient retrieves active booking correctly (Privacy intact)', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/dashboard/patient/active', method: 'GET', headers: p1Headers });
    if (!res.data.data.booking) throw new Error('Booking missing');
    if (res.data.data.booking.patient_id) throw new Error('Patient ID leaked (Privacy violation)');
    if (res.data.data.booking.id) throw new Error('Booking ID leaked');
    if (res.data.data.current_queue !== null) throw new Error('Current queue should be null initially');
  });

  await runTest('Queue Monitoring tracks CALLING accurately', async () => {
    // Admin moves P1 to Calling
    await request({ ...BASE_OPTIONS, path: `/api/queues/${booking1Id}/status`, method: 'PATCH', headers: adminHeaders }, { status: 'Calling' });

    // P2 checks their dashboard, they should see P1's queue number in current_queue, but NOTHING else about P1
    const res = await request({ ...BASE_OPTIONS, path: '/api/dashboard/patient/active', method: 'GET', headers: p2Headers });
    
    if (res.data.data.current_queue !== b1Res.data.data.queue_number) {
        throw new Error(`Expected current queue to be ${b1Res.data.data.queue_number}`);
    }
  });

  console.log('--- TESTS FINISHED ---');
}

main();
