const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPaginatedDoctors = async (page = 1, limit = 10, search = '', specialization = '') => {
  const skip = (page - 1) * limit;

  // Build the where clause dynamically
  const where = {};
  if (search) {
    where.name = {
      contains: search
    };
  }
  if (specialization) {
    where.specialization = specialization;
  }

  // Get total count for pagination
  const totalItems = await prisma.doctor.count({ where });
  
  // Get data
  const doctors = await prisma.doctor.findMany({
    where,
    skip,
    take: parseInt(limit),
    orderBy: {
      name: 'asc'
    }
  });

  return {
    doctors,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: parseInt(page)
  };
};

const getSpecializations = async () => {
  // Get unique specializations for the filter dropdown
  const doctors = await prisma.doctor.findMany({
    select: { specialization: true },
    distinct: ['specialization'],
    orderBy: { specialization: 'asc' }
  });
  return doctors.map(d => d.specialization).filter(s => s);
};

const getDoctorById = async (id) => {
  return prisma.doctor.findUnique({
    where: { id: parseInt(id) }
  });
};

const createDoctor = async (data) => {
  const { name, specialization } = data;
  return prisma.doctor.create({
    data: { name, specialization }
  });
};

const updateDoctor = async (id, data) => {
  const { name, specialization } = data;
  return prisma.doctor.update({
    where: { id: parseInt(id) },
    data: { name, specialization }
  });
};

const deleteDoctor = async (id) => {
  return prisma.doctor.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  getPaginatedDoctors,
  getSpecializations,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
