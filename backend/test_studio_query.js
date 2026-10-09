const { PrismaClient } = require('@prisma/client');

async function testQuery(label, url) {
  console.log(`\nTesting: ${label}`);
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ['error', 'warn'],
  });

  try {
    const result = await prisma.organization.findMany({
      take: 100,
      skip: 0,
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
        website: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        users: { select: { id: true } },
        contacts: { select: { id: true } },
        deals: { select: { id: true } },
        invites: { select: { id: true } },
      },
    });
    console.log(`[SUCCESS] ${label}: Retrieved ${result.length} organizations`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${label}:`, err.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const base5432 = 'postgresql://postgres.ptydkosowocufwwnuins:Jeonjungkook123%40@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const base6543 = 'postgresql://postgres.ptydkosowocufwwnuins:Jeonjungkook123%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

  // 1. Port 5432 without params
  await testQuery('Port 5432 plain', base5432);

  // 2. Port 5432 with sslmode=require
  await testQuery('Port 5432 with sslmode=require', `${base5432}?sslmode=require`);

  // 3. Port 5432 with sslmode=require&connection_limit=1
  await testQuery('Port 5432 with sslmode=require&connection_limit=1', `${base5432}?sslmode=require&connection_limit=1`);

  // 4. Port 6543 with pgbouncer=true&sslmode=require
  await testQuery('Port 6543 with pgbouncer=true&sslmode=require', `${base6543}?pgbouncer=true&sslmode=require`);
}

run();
