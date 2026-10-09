const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log('SUCCESS:', orgs);
  } catch (err) {
    console.error('ERROR_CAUGHT:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
