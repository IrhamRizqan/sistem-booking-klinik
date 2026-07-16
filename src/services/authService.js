const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const registerPatient = async (data) => {
  const { name, phone, username, password } = data;

  // Check if username already exists
  const existingPatient = await prisma.patient.findUnique({
    where: { username }
  });

  if (existingPatient) {
    throw new Error('Username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create patient
  const patient = await prisma.patient.create({
    data: {
      name,
      phone,
      username,
      password: hashedPassword
    }
  });

  return patient;
};

const loginPatient = async (username, password) => {
  // Find patient
  const patient = await prisma.patient.findUnique({
    where: { username }
  });

  if (!patient) {
    throw new Error('Invalid username or password');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, patient.password);
  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  return patient;
};

module.exports = {
  registerPatient,
  loginPatient
};
