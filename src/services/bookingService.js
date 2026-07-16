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
  const visitDateObj = new Date(visit_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  thirtyDaysFromNow.setHours(23, 59, 59, 999);

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
    where: { id: parseInt(schedule_id) }
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  // 4. Validate Quota and Generate Queue Number
  const currentSlotBookings = await prisma.booking.count({
    where: {
      schedule_id: parseInt(schedule_id),
      visit_date: visitDateObj,
      time_slot: time_slot
    }
  });

  if (currentSlotBookings >= schedule.quota) {
    throw new Error('The selected time slot is full (Quota reached)');
  }

  const queue_number = currentSlotBookings + 1;
  let booking_code;
  let isUnique = false;

  // Ensure unique booking code
  while (!isUnique) {
    booking_code = generateBookingCode();
    const existingCode = await prisma.booking.findUnique({ where: { booking_code } });
    if (!existingCode) {
      isUnique = true;
    }
  }

  // 5. Create Booking
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

module.exports = {
  createBooking
};
