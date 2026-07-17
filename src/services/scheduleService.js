const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateSlots = (startTimeStr, endTimeStr) => {
  // Instead of hourly intervals, just return one slot for the entire schedule duration
  return [`${startTimeStr}-${endTimeStr}`];
};

const getAllSchedules = async (page = 1, limit = 10, search = '') => {
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.doctor = {
      name: { contains: search }
    };
  }

  const totalItems = await prisma.schedule.count({ where });
  const rawSchedules = await prisma.schedule.findMany({
    where,
    skip,
    take: parseInt(limit),
    include: {
      doctor: { select: { name: true, specialization: true } }
    },
    orderBy: { created_at: 'desc' }
  });

  const schedules = rawSchedules.map(schedule => ({
    ...schedule,
    status: 'Active', // Dynamic status per plan
    slots: generateSlots(schedule.start_time, schedule.end_time)
  }));

  return {
    schedules,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: parseInt(page)
  };
};

const getScheduleById = async (id) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: parseInt(id) },
    include: { doctor: { select: { name: true, specialization: true } } }
  });

  if (schedule) {
    schedule.status = 'Active';
    schedule.slots = generateSlots(schedule.start_time, schedule.end_time);
  }

  return schedule;
};

const createSchedule = async (data) => {
  return prisma.schedule.create({
    data: {
      doctor_id: parseInt(data.doctor_id),
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      quota: parseInt(data.quota)
    }
  });
};

const updateSchedule = async (id, data) => {
  return prisma.schedule.update({
    where: { id: parseInt(id) },
    data: {
      doctor_id: parseInt(data.doctor_id),
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      quota: parseInt(data.quota)
    }
  });
};

const deleteSchedule = async (id) => {
  return prisma.schedule.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  generateSlots,
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
