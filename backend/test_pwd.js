const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const count = await prisma.user.count();
    console.log('RESULT: Connected successfully! User count:', count);
  } catch (err) {
    console.error('RESULT: Failed to connect:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
