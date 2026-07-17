const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getQueues = async (filters) => {
  const where = {};
  
  if (filters.visit_date) {
    const visitDateStr = filters.visit_date.includes('T') ? filters.visit_date.split('T')[0] : filters.visit_date;
    where.visit_date = new Date(`${visitDateStr}T00:00:00.000Z`);
  }

  if (filters.doctor_id) {
    where.schedule = { doctor_id: parseInt(filters.doctor_id) };
  }

  if (filters.time_slot) {
    where.time_slot = filters.time_slot;
  }

  return await prisma.booking.findMany({
    where,
    include: {
      patient: {
        select: { name: true, phone: true }
      },
      schedule: {
        include: {
          doctor: { select: { name: true, specialization: true } }
        }
      }
    },
    orderBy: { queue_number: 'asc' }
  });
};

const updateQueueStatus = async (bookingId, newStatus) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { schedule: true }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const currentStatus = booking.status;

  // Validation Rules
  if (newStatus === 'Calling') {
    if (currentStatus !== 'Confirmed') {
      throw new Error(`Cannot transition from ${currentStatus} to Calling`);
    }

    // Check for another Calling booking for same date, doctor, and slot
    const existingCalling = await prisma.booking.findFirst({
      where: {
        visit_date: booking.visit_date,
        time_slot: booking.time_slot,
        schedule: { doctor_id: booking.schedule.doctor_id },
        status: 'Calling',
        id: { not: booking.id }
      }
    });

    if (existingCalling) {
      throw new Error('Another patient is currently being called for this time slot. Please resolve it first.');
    }
  } 
  else if (newStatus === 'On Treatment' || newStatus === 'Skipped') {
    if (currentStatus !== 'Calling') {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
  } 
  else if (newStatus === 'Completed') {
    if (currentStatus !== 'On Treatment') {
      throw new Error(`Cannot transition from ${currentStatus} to Completed`);
    }
  } 
  else {
    throw new Error('Invalid or forbidden status transition');
  }

  // Update status
  return await prisma.booking.update({
    where: { id: booking.id },
    data: { status: newStatus },
    include: {
      patient: { select: { name: true } },
      schedule: { include: { doctor: { select: { name: true } } } }
    }
  });
};

module.exports = {
  getQueues,
  updateQueueStatus
};
