import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System Administrator with full access to all CRM resources',
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Sales and Operations Manager with team oversight',
      isSystem: true,
    },
  });

  const repRole = await prisma.role.upsert({
    where: { name: 'SALES_REP' },
    update: {},
    create: {
      name: 'SALES_REP',
      description: 'Sales Representative handling leads, contacts, and deals',
      isSystem: true,
    },
  });

  // 2. Create Permissions
  const permissionsList = [
    { name: 'users:read', action: 'READ', resource: 'USERS', description: 'View user list and profiles' },
    { name: 'users:write', action: 'CREATE', resource: 'USERS', description: 'Create and edit users' },
    { name: 'users:delete', action: 'DELETE', resource: 'USERS', description: 'Delete user accounts' },
    { name: 'contacts:manage', action: 'MANAGE', resource: 'CONTACTS', description: 'Full access to contacts' },
    { name: 'leads:manage', action: 'MANAGE', resource: 'LEADS', description: 'Full access to leads' },
    { name: 'deals:manage', action: 'MANAGE', resource: 'DEALS', description: 'Full access to sales pipeline' },
    { name: 'reports:read', action: 'READ', resource: 'REPORTS', description: 'View analytics and reports' },
    { name: 'settings:manage', action: 'MANAGE', resource: 'SETTINGS', description: 'Manage system settings' },
  ];

  for (const p of permissionsList) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });

    // Attach to Admin
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // 3. Create Sample Organization
  const acmeCorp = await prisma.organization.create({
    data: {
      name: 'Acme Enterprise Solutions',
      domain: 'acme.com',
      industry: 'Software & Technology',
      website: 'https://acme.com',
      phone: '+1 800-555-0199',
      address: '100 Silicon Blvd, Suite 400',
      city: 'San Francisco',
      country: 'USA',
      status: 'ACTIVE',
    },
  });

  // 4. Create Admin User & Sales Rep
  const hashedAdminPassword = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      name: 'Alexander Pierce (Admin)',
      passwordHash: hashedAdminPassword,
      roleId: adminRole.id,
      organizationId: acmeCorp.id,
      phone: '+1-555-0100',
      status: 'ACTIVE',
      profileSettings: {
        create: {
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: true,
        },
      },
    },
  });

  const hashedRepPassword = await bcrypt.hash('Rep@123', 10);
  const salesRepUser = await prisma.user.upsert({
    where: { email: 'sarah.rep@crm.com' },
    update: {},
    create: {
      email: 'sarah.rep@crm.com',
      name: 'Sarah Connor (Sales Rep)',
      passwordHash: hashedRepPassword,
      roleId: repRole.id,
      organizationId: acmeCorp.id,
      phone: '+1-555-0102',
      status: 'ACTIVE',
      profileSettings: {
        create: {
          theme: 'light',
          emailNotifications: true,
        },
      },
    },
  });

  // 5. Default Sales Pipeline & Stages
  const standardPipeline = await prisma.pipeline.create({
    data: {
      name: 'Standard B2B Sales Pipeline',
      description: 'Standard 5-stage B2B enterprise pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'Lead Qualified', order: 1, winProbability: 10, color: '#94a3b8' },
          { name: 'Contact Made', order: 2, winProbability: 25, color: '#38bdf8' },
          { name: 'Demo Scheduled', order: 3, winProbability: 50, color: '#818cf8' },
          { name: 'Proposal Sent', order: 4, winProbability: 75, color: '#f59e0b' },
          { name: 'Closed Won', order: 5, winProbability: 100, color: '#10b981' },
          { name: 'Closed Lost', order: 6, winProbability: 0, color: '#ef4444' },
        ],
      },
    },
    include: { stages: true },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('👤 Admin Login: admin@crm.com / Admin@123');
  console.log('👤 Sales Rep Login: sarah.rep@crm.com / Rep@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
