const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getArchive = async (filters, page = 1, limit = 10) => {
  const where = {};
  
  if (filters.date) {
    const visitDateStr = filters.date.includes('T') ? filters.date.split('T')[0] : filters.date;
    where.visit_date = new Date(`${visitDateStr}T00:00:00.000Z`);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.time_slot) {
    where.time_slot = filters.time_slot;
  }

  // Nested filters
  if (filters.doctor_id || filters.specialization) {
    where.schedule = { doctor: {} };
    if (filters.doctor_id) {
      where.schedule.doctor.id = parseInt(filters.doctor_id);
    }
    if (filters.specialization) {
      where.schedule.doctor.specialization = filters.specialization;
    }
  }

  if (filters.search) {
    where.OR = [
      { booking_code: { contains: filters.search } },
      { patient: { name: { contains: filters.search } } }
    ];
  }

  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true } },
        schedule: {
          include: { doctor: { select: { name: true, specialization: true } } }
        }
      },
      orderBy: [
        { visit_date: 'desc' },
        { time_slot: 'asc' },
        { queue_number: 'asc' }
      ],
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
  getArchive
};
