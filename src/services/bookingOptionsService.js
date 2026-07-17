const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateSlots } = require('./scheduleService');

const getSpecializations = async () => {
  // Get unique specializations from doctors that have schedules
  const doctors = await prisma.doctor.findMany({
    where: {
      schedules: {
        some: {} // Only doctors with at least one schedule
      }
    },
    select: {
      specialization: true
    },
    distinct: ['specialization']
  });
  return doctors.map(d => d.specialization);
};

const getDoctorsBySpecialization = async (specialization) => {
  return prisma.doctor.findMany({
    where: {
      specialization: specialization,
      schedules: {
        some: {}
      }
    },
    select: {
      id: true,
      name: true,
      specialization: true
    }
  });
};

const getSchedulesForBooking = async (doctor_id, visit_date) => {
  const visitDateStr = visit_date.includes('T') ? visit_date.split('T')[0] : visit_date;
  const visitDateObj = new Date(`${visitDateStr}T00:00:00.000Z`);
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const visitDayOfWeek = days[visitDateObj.getUTCDay()];

  const schedules = await prisma.schedule.findMany({
    where: {
      doctor_id: parseInt(doctor_id),
      day: visitDayOfWeek
    }
  });

  // Calculate slots for each schedule
  const enrichedSchedules = await Promise.all(schedules.map(async (schedule) => {
    const rawSlots = generateSlots(schedule.start_time, schedule.end_time);
    
    // Check quota for each slot
    const slots = await Promise.all(rawSlots.map(async (time_slot) => {
      const bookingsCount = await prisma.booking.count({
        where: {
          schedule_id: schedule.id,
          visit_date: visitDateObj,
          time_slot: time_slot
        }
      });
      
      return {
        time: time_slot,
        is_full: bookingsCount >= schedule.quota
      };
    }));

    return {
      id: schedule.id,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      quota: schedule.quota,
      slots: slots
    };
  }));

  return enrichedSchedules;
};

module.exports = {
  getSpecializations,
  getDoctorsBySpecialization,
  getSchedulesForBooking
};
