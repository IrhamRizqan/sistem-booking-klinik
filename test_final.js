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
  console.log('--- STARTING SPRINT 10 FINAL REGRESSION TEST ---');
  
  const timestamp = Date.now();
  const usernameA = `patA_${timestamp}`;
  const usernameB = `patB_${timestamp}`;
  const docName = `Dr. Final_${timestamp}`;
  
  let pHeadersA, pHeadersB, aHeaders;
  let doctorId, scheduleId;
  let dateStr = new Date().toISOString().split('T')[0];
  let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let dayStr = days[new Date().getDay()];

  await runTest('1. Register Patient A & B', async () => {
    await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'Patient A', username: usernameA, password: 'password', confirmPassword: 'password' });
    await request({ ...BASE_OPTIONS, path: '/api/auth/register', method: 'POST' }, { name: 'Patient B', username: usernameB, password: 'password', confirmPassword: 'password' });
  });

  await runTest('2. Admin Login', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/auth/admin-login', method: 'POST' }, { username: 'admin', password: 'admin123' });
    if (res.status !== 200) throw new Error('Admin login failed');
    aHeaders = { ...BASE_OPTIONS.headers, 'Cookie': res.headers['set-cookie'][0].split(';')[0] };
  });

  await runTest('3. Create Doctor and Schedule', async () => {
    const dRes = await request({ ...BASE_OPTIONS, path: '/api/doctors', method: 'POST', headers: aHeaders }, { name: docName, specialization: 'Finals' });
    doctorId = dRes.data.data.id;

    const sRes = await request({ ...BASE_OPTIONS, path: '/api/schedules', method: 'POST', headers: aHeaders }, { doctor_id: doctorId, day: dayStr, start_time: '19:00', end_time: '20:00', quota: 5 });
    scheduleId = sRes.data.data.id;
  });

  await runTest('4. Login Patient A and Create Booking', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: usernameA, password: 'password' });
    pHeadersA = { ...BASE_OPTIONS.headers, 'Cookie': res.headers['set-cookie'][0].split(';')[0] };

    const bRes = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: pHeadersA }, { schedule_id: scheduleId, visit_date: dateStr, time_slot: '19:00-20:00', complaint: 'Fever A' });
    if (bRes.status !== 201) throw new Error('Booking A failed');
  });

  await runTest('5. Login Patient B and Create Booking (Queue Increment Check)', async () => {
    const res = await request({ ...BASE_OPTIONS, path: '/api/auth/login', method: 'POST' }, { username: usernameB, password: 'password' });
    pHeadersB = { ...BASE_OPTIONS.headers, 'Cookie': res.headers['set-cookie'][0].split(';')[0] };

    const bRes = await request({ ...BASE_OPTIONS, path: '/api/bookings', method: 'POST', headers: pHeadersB }, { schedule_id: scheduleId, visit_date: dateStr, time_slot: '19:00-20:00', complaint: 'Fever B' });
    if (bRes.status !== 201) throw new Error('Booking B failed');
    if (bRes.data.data.queue_number !== 2) throw new Error(`Queue should be 2, got ${bRes.data.data.queue_number}`);
  });

  let bookingIdA, bookingIdB;

  await runTest('6. Admin Queue Management (Calling -> On_Treatment -> Completed)', async () => {
    // Get queues
    const qRes = await request({ ...BASE_OPTIONS, path: `/api/queues?date=${dateStr}&doctor_id=${doctorId}`, method: 'GET', headers: aHeaders });
    
    const bA = qRes.data.data.find(q => q.patient.name === 'Patient A');
    const bB = qRes.data.data.find(q => q.patient.name === 'Patient B');
    bookingIdA = bA.id;
    bookingIdB = bB.id;

    // Call Patient A
    let res = await request({ ...BASE_OPTIONS, path: `/api/queues/${bookingIdA}/status`, method: 'PATCH', headers: aHeaders }, { status: 'Calling' });
    if(res.status !== 200) console.log(res.rawData);
    
    // Start Patient A
    res = await request({ ...BASE_OPTIONS, path: `/api/queues/${bookingIdA}/status`, method: 'PATCH', headers: aHeaders }, { status: 'On Treatment' });
    if(res.status !== 200) console.log(res.rawData);
    
    // Complete Patient A
    res = await request({ ...BASE_OPTIONS, path: `/api/queues/${bookingIdA}/status`, method: 'PATCH', headers: aHeaders }, { status: 'Completed' });
    if(res.status !== 200) console.log(res.rawData);
  });

  await runTest('7. Admin Queue Management (Call Patient B -> Skip Patient B)', async () => {
    await request({ ...BASE_OPTIONS, path: `/api/queues/${bookingIdB}/status`, method: 'PATCH', headers: aHeaders }, { status: 'Calling' });
    await request({ ...BASE_OPTIONS, path: `/api/queues/${bookingIdB}/status`, method: 'PATCH', headers: aHeaders }, { status: 'Skipped' });
  });

  await runTest('8. Patient Dashboard & History Verification', async () => {
    // Patient A should see completed in history
    const histA = await request({ ...BASE_OPTIONS, path: '/api/bookings/history', method: 'GET', headers: pHeadersA });
    if (histA.data.data[0].status !== 'Completed') throw new Error('A not completed');

    // Patient B should see skipped
    const histB = await request({ ...BASE_OPTIONS, path: '/api/bookings/history', method: 'GET', headers: pHeadersB });
    if (histB.data.data[0].status !== 'Skipped') throw new Error('B not skipped');
  });

  await runTest('9. Admin Dashboard Stats Check', async () => {
    const statRes = await request({ ...BASE_OPTIONS, path: `/api/dashboard/admin`, method: 'GET', headers: aHeaders });
    if (statRes.data.data.completedToday < 1) throw new Error('Completed stats not counting');
    if (statRes.data.data.skippedToday < 1) throw new Error('Skipped stats not counting');
  });

  await runTest('10. Admin Export Filtering Validated', async () => {
    // Export with filter for Doctor = Final
    const expRes = await request({ ...BASE_OPTIONS, path: `/api/archives/export/csv?doctor_id=${doctorId}`, method: 'GET', headers: aHeaders });
    const rows = expRes.rawData.split('\n').filter(r => r.includes(docName));
    if (rows.length !== 2) throw new Error(`Expected 2 exports for this doctor, got ${rows.length}`);
    
    // One should say 'Selesai', one should say 'Dilewati'
    if (!expRes.rawData.includes('Selesai') || !expRes.rawData.includes('Dilewati')) throw new Error('Status labels missing or not translated');
  });

  console.log('--- REGRESSION FINISHED ---');
}

main();
