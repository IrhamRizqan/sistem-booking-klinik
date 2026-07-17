const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAdminDashboard = async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
  const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);

  const totalDoctors = await prisma.doctor.count();
  
  const todayBookingsQuery = {
    where: {
      visit_date: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  };

  const statusCounts = await prisma.booking.groupBy({
    by: ['status'],
    where: todayBookingsQuery.where,
    _count: { status: true }
  });

  let totalBookingsToday = 0, waitingToday = 0, callingToday = 0, onTreatmentToday = 0, completedToday = 0, skippedToday = 0;

  statusCounts.forEach(item => {
    totalBookingsToday += item._count.status;
    switch (item.status) {
      case 'Confirmed': waitingToday = item._count.status; break;
      case 'Calling': callingToday = item._count.status; break;
      case 'On Treatment': onTreatmentToday = item._count.status; break;
      case 'Completed': completedToday = item._count.status; break;
      case 'Skipped': skippedToday = item._count.status; break;
    }
  });

  const todayQueue = await prisma.booking.findMany({
    where: todayBookingsQuery.where,
    include: {
      patient: { select: { name: true } },
      schedule: { include: { doctor: { select: { name: true } } } }
    },
    orderBy: { queue_number: 'asc' }
  });

  return {
    stats: {
      totalDoctors,
      todayBookings: totalBookingsToday,
      waiting: waitingToday,
      calling: callingToday,
      onTreatment: onTreatmentToday,
      completed: completedToday,
      skipped: skippedToday
    },
    todayQueue
  };
};

const getPatientActiveBooking = async (patientId) => {
  // Find the most relevant active booking (Skipped might be returned if we need to show them the skipped state, but Completed is definitely ignored as active)
  // We'll prioritize anything not Completed, ordered by visit date (newest first).
  const activeBooking = await prisma.booking.findFirst({
    where: {
      patient_id: patientId,
      status: { notIn: ['Completed'] }
    },
    include: {
      schedule: {
        include: { doctor: { select: { name: true, specialization: true } } }
      }
    },
    orderBy: {
      visit_date: 'asc'
    }
  });

  if (!activeBooking) return null;

  let currentQueueNumber = null;
  let currentQueueStatus = null;

  // If the patient's booking is Confirmed, Calling, or On Treatment, let's find the current active queue for their exact slot
  if (['Confirmed', 'Calling', 'On Treatment'].includes(activeBooking.status)) {
    let activeQueue = await prisma.booking.findFirst({
      where: {
        visit_date: activeBooking.visit_date,
        time_slot: activeBooking.time_slot,
        schedule_id: activeBooking.schedule_id,
        status: { in: ['Calling', 'On Treatment'] }
      },
      orderBy: {
        // Prioritize Calling over On Treatment to accurately show what's immediately being called
        status: 'asc' // C comes before O, so Calling is first
      },
      select: {
        queue_number: true,
        status: true
      }
    });

    // If no one is currently calling or on treatment, show the last completed/skipped queue
    if (!activeQueue) {
      activeQueue = await prisma.booking.findFirst({
        where: {
          visit_date: activeBooking.visit_date,
          time_slot: activeBooking.time_slot,
          schedule_id: activeBooking.schedule_id,
          status: { in: ['Completed', 'Skipped'] }
        },
        orderBy: {
          queue_number: 'desc'
        },
        select: {
          queue_number: true,
          status: true
        }
      });
    }

    if (activeQueue) {
      currentQueueNumber = activeQueue.queue_number;
      currentQueueStatus = activeQueue.status;
    }
  }

  // To protect privacy, we strip all non-essential properties
  return {
    booking: {
      booking_code: activeBooking.booking_code,
      queue_number: activeBooking.queue_number,
      visit_date: activeBooking.visit_date,
      time_slot: activeBooking.time_slot,
      status: activeBooking.status,
      doctor_name: activeBooking.schedule.doctor.name,
      specialization: activeBooking.schedule.doctor.specialization
    },
    current_queue: currentQueueNumber,
    current_queue_status: currentQueueStatus
  };
};

module.exports = {
  getAdminDashboard,
  getPatientActiveBooking
};
