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
  // 1. Try to find an ongoing active booking first (Confirmed, Calling, On Treatment)
  let activeBooking = await prisma.booking.findFirst({
    where: {
      patient_id: patientId,
      status: { in: ['Confirmed', 'Calling', 'On Treatment'] }
    },
    include: {
      schedule: {
        include: { doctor: { select: { name: true, specialization: true } } }
      }
    },
    orderBy: {
      visit_date: 'asc' // Oldest active booking first
    }
  });

  // 2. If no ongoing booking, check if the latest past booking was Skipped
  if (!activeBooking) {
    const latestPastBooking = await prisma.booking.findFirst({
      where: {
        patient_id: patientId,
        status: { in: ['Completed', 'Skipped', 'Cancelled'] }
      },
      include: {
        schedule: {
          include: { doctor: { select: { name: true, specialization: true } } }
        }
      },
      orderBy: [
        { visit_date: 'desc' },
        { id: 'desc' }
      ]
    });

    if (latestPastBooking && latestPastBooking.status === 'Skipped') {
      activeBooking = latestPastBooking;
    }
  }

  let currentQueueNumber = null;
  let currentQueueStatus = null;

  if (activeBooking) {
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
  }

  // Get Patient Stats
  const [totalBookings, completedBookings, skippedBookings] = await Promise.all([
    prisma.booking.count({ where: { patient_id: patientId } }),
    prisma.booking.count({ where: { patient_id: patientId, status: 'Completed' } }),
    prisma.booking.count({ where: { patient_id: patientId, status: 'Skipped' } })
  ]);

  // Get Today's Doctors
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[new Date().getDay()];
  const todayDoctors = await prisma.doctor.findMany({
    where: {
      schedules: {
        some: { day: todayDay }
      }
    },
    include: {
      schedules: {
        where: { day: todayDay },
        select: { id: true, start_time: true, end_time: true }
      }
    }
  });

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { name: true }
  });

  return {
    patientName: patient ? patient.name : 'Pasien',
    booking: activeBooking ? {
      booking_code: activeBooking.booking_code,
      queue_number: activeBooking.queue_number,
      visit_date: activeBooking.visit_date,
      time_slot: activeBooking.time_slot,
      status: activeBooking.status,
      doctor_name: activeBooking.schedule.doctor.name,
      specialization: activeBooking.schedule.doctor.specialization
    } : null,
    current_queue: currentQueueNumber,
    current_queue_status: currentQueueStatus,
    stats: {
      total: totalBookings,
      completed: completedBookings,
      skipped: skippedBookings
    },
    todayDoctors: todayDoctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      specialization: doc.specialization,
      schedule_id: doc.schedules[0]?.id || null,
      time_slot: doc.schedules[0] ? `${doc.schedules[0].start_time} - ${doc.schedules[0].end_time}` : null
    }))
  };
};

module.exports = {
  getAdminDashboard,
  getPatientActiveBooking
};
