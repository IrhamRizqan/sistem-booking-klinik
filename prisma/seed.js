require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admins...');
  const admins = [
    { username: 'admin', password: 'admin' },
    { username: 'frontdesk', password: 'frontdesk123' },
    { username: 'irham', password: 'irham123' },
  ];
  
  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    await prisma.admin.upsert({
      where: { username: admin.username },
      update: { password: hashedPassword },
      create: { username: admin.username, password: hashedPassword },
    });
  }

  console.log('Seeding patients (users)...');
  const patients = [
    { username: 'tester', password: 'tester', name: 'Tester' },
    { username: 'olip', password: 'olip123', name: 'Olip' },
    { username: 'lia', password: 'lia123', name: 'Lia' },
    { username: 'otek', password: 'otek123', name: 'Otek' },
    { username: 'silah', password: 'silah123', name: 'Silah' },
    { username: 'gia', password: 'gia123', name: 'Gia' },
    { username: 'rasat', password: 'rasat123', name: 'Rasat' },
    { username: 'ambong', password: 'ambong123', name: 'Ambong' },
  ];

  for (const patient of patients) {
    const hashedPassword = await bcrypt.hash(patient.password, 10);
    await prisma.patient.upsert({
      where: { username: patient.username },
      update: { password: hashedPassword },
      create: { username: patient.username, password: hashedPassword, name: patient.name },
    });
  }

  console.log('Cleaning up existing doctors and schedules...');
  await prisma.schedule.deleteMany({});
  await prisma.doctor.deleteMany({});

  console.log('Seeding doctors and schedules...');
  const drIrham = await prisma.doctor.create({
    data: {
      name: 'Dr. Irham Rizqan Zakiy',
      specialization: 'Dokter Gigi dan Anak',
    }
  });

  const drRashad = await prisma.doctor.create({
    data: {
      name: 'Dr. Rashad Shaquille Taofik',
      specialization: 'Dokter Umum',
    }
  });

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']; // Or Monday, Tuesday etc if the app uses English for days?
  // Wait, let's use English days as required by bookingService.js Rule 6:
  // "const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];"
  const englishDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (const day of englishDays) {
    await prisma.schedule.create({
      data: {
        doctor_id: drIrham.id,
        day: day,
        start_time: '12:00',
        end_time: '15:00',
        quota: 5,
      }
    });

    await prisma.schedule.create({
      data: {
        doctor_id: drRashad.id,
        day: day,
        start_time: '10:00',
        end_time: '16:00',
        quota: 6,
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
