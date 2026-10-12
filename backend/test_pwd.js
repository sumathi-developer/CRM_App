const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log('RESULT: Connected successfully! Organizations:', orgs.length);
  } catch (err) {
    console.error('RESULT: Failed to connect:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
