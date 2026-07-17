const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const generateBookingCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 chars
  return `BKG-${dateStr}-${randomChars}`;
};

const createBooking = async (patientId, data) => {
  const { schedule_id, visit_date, time_slot, complaint } = data;

  // 1. Validate visit_date
  const visitDateStr = visit_date.includes('T') ? visit_date.split('T')[0] : visit_date;
  const visitDateObj = new Date(`${visitDateStr}T00:00:00.000Z`);

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(`${todayStr}T00:00:00.000Z`);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);

  if (visitDateObj < today) {
    throw new Error('Visit date cannot be in the past');
  }

  if (visitDateObj > thirtyDaysFromNow) {
    throw new Error('Booking is limited to a maximum of 30 days ahead');
  }

  // 2. Check duplicate booking per patient per date
  const existingPatientBooking = await prisma.booking.findUnique({
    where: {
      patient_id_visit_date: {
        patient_id: parseInt(patientId),
        visit_date: visitDateObj
      }
    }
  });

  if (existingPatientBooking) {
    throw new Error('You already have a booking for this visit date');
  }

  // 3. Fetch Schedule to get Quota
  const schedule = await prisma.schedule.findUnique({
    where: { id: parseInt(schedule_id) },
    include: { doctor: true }
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  // Rule 6: Visit date must match schedule day
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const visitDayOfWeek = days[visitDateObj.getUTCDay()];
  if (visitDayOfWeek !== schedule.day) {
    throw new Error(`Visit date (${visitDayOfWeek}) does not match schedule day (${schedule.day})`);
  }

  // Rule 5: Time slot must belong to schedule
  const { generateSlots } = require('./scheduleService');
  const validSlots = generateSlots(schedule.start_time, schedule.end_time);
  if (!validSlots.includes(time_slot)) {
    throw new Error('Invalid time slot for this schedule');
  }

  // 4. Validate Quota
  const bookingsForSchedule = await prisma.booking.count({
    where: {
      schedule_id: parseInt(schedule_id),
      visit_date: visitDateObj,
      time_slot: time_slot
    }
  });

  if (bookingsForSchedule >= schedule.quota) {
    throw new Error('The selected time slot is full (Quota reached)');
  }

  // 5. Generate Queue Number (Unique per doctor, visit date, and time slot)
  const bookingsForDoctor = await prisma.booking.count({
    where: {
      schedule: { doctor_id: schedule.doctor_id },
      visit_date: visitDateObj,
      time_slot: time_slot
    }
  });

  const queue_number = bookingsForDoctor + 1;
  
  // 6. Generate Booking Code
  let booking_code;
  let isUnique = false;

  while (!isUnique) {
    booking_code = generateBookingCode();
    const existingCode = await prisma.booking.findUnique({ where: { booking_code } });
    if (!existingCode) {
      isUnique = true;
    }
  }

  // 7. Create Booking
  const booking = await prisma.booking.create({
    data: {
      patient_id: parseInt(patientId),
      schedule_id: parseInt(schedule_id),
      visit_date: visitDateObj,
      time_slot,
      complaint,
      booking_code,
      queue_number,
      status: 'Confirmed'
    }
  });

  return booking;
};

const getHistory = async (patientId, filters, page = 1, limit = 10) => {
  const where = { patient_id: parseInt(patientId) };

  if (filters.date) {
    const visitDateStr = filters.date.includes('T') ? filters.date.split('T')[0] : filters.date;
    where.visit_date = new Date(`${visitDateStr}T00:00:00.000Z`);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.doctor_id) {
    where.schedule = { doctor_id: parseInt(filters.doctor_id) };
  }

  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        schedule: {
          include: { doctor: { select: { name: true, specialization: true } } }
        }
      },
      orderBy: { visit_date: 'desc' }, // Recent bookings first
      skip: offset,
      take: limit
    }),
    prisma.booking.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: totalPages === 0 ? 1 : totalPages
    }
  };
};

module.exports = {
  createBooking,
  getHistory
};
