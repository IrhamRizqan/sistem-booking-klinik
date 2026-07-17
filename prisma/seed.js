require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Use environment variables or fallback to defaults
  const username = process.env.ADMIN_USERNAME || 'admin';
  const plainPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Never store plaintext passwords; hash them securely using bcrypt
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Use upsert to prevent duplicate admin accounts on multiple seed runs
  const admin = await prisma.admin.upsert({
    where: { username: username },
    update: {},
    create: {
      username: username,
      password: hashedPassword,
    },
  });

  console.log(`Admin account safely seeded. Username: ${admin.username}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
