const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getQueues = async (filters, sort = 'desc') => {
  const where = {};
  
  if (filters.visit_date) {
    const visitDateStr = filters.visit_date.includes('T') ? filters.visit_date.split('T')[0] : filters.visit_date;
    where.visit_date = new Date(`${visitDateStr}T00:00:00.000Z`);
  }

  if (filters.doctor_id) {
    where.schedule = { doctor_id: parseInt(filters.doctor_id, 10) };
  }

  if (filters.time_slot) {
    where.time_slot = filters.time_slot;
  }

  const orderBy = [];
  if (sort === 'asc') {
    orderBy.push({ visit_date: 'asc' });
    orderBy.push({ queue_number: 'asc' });
  } else {
    orderBy.push({ visit_date: 'desc' });
    orderBy.push({ queue_number: 'desc' });
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
    orderBy
  });
};

const updateQueueStatus = async (bookingId, newStatus) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId, 10) },
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
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: newStatus },
    include: {
      patient: { select: { name: true } },
      schedule: { include: { doctor: { select: { name: true } } } }
    }
  });

  if (newStatus === 'Calling') {
    // Auto-skip after 3 minutes if patient hasn't arrived
    setTimeout(async () => {
      try {
        const currentBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
        if (currentBooking && currentBooking.status === 'Calling') {
          await prisma.booking.update({
             where: { id: booking.id },
             data: { status: 'Skipped' }
          });
          console.log(`Booking ID ${booking.id} automatically skipped after 3 minutes.`);
        }
      } catch (err) {
        console.error('Failed to auto-skip booking:', err);
      }
    }, 3 * 60 * 1000); // 3 minutes
  }

  return updatedBooking;
};

module.exports = {
  getQueues,
  updateQueueStatus
};
