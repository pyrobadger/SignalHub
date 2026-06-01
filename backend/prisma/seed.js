const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  // Clear existing data
  await prisma.refreshToken.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.signal.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing records.');

  // Hashes for passwords
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const userPasswordHash = await bcrypt.hash('UserPass123!', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@primetrade.com',
      password: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@primetrade.com',
      password: userPasswordHash,
      role: 'USER',
    },
  });

  console.log(`Users seeded: Admin (${admin.email}), User (${user.email})`);

  // 3. Seed Signals for User
  const signals = [
    {
      assetSymbol: 'BTC',
      signalType: 'BUY',
      entryPrice: 67200.5,
      targetPrice: 72000.0,
      stopLoss: 65000.0,
      status: 'OPEN',
      notes: 'Strong support at 65k. Spot entry recommended.',
      userId: user.id,
    },
    {
      assetSymbol: 'ETH',
      signalType: 'SELL',
      entryPrice: 3820.0,
      targetPrice: 3400.0,
      stopLoss: 3950.0,
      status: 'OPEN',
      notes: 'Double top rejection on daily chart. Short-term bearish target.',
      userId: user.id,
    },
    {
      assetSymbol: 'SOL',
      signalType: 'BUY',
      entryPrice: 155.25,
      targetPrice: 185.0,
      stopLoss: 142.0,
      status: 'CLOSED',
      notes: 'Breakout above 150 confirmed. Target hit successfully!',
      userId: user.id,
    },
  ];

  for (const sig of signals) {
    const createdSignal = await prisma.signal.create({
      data: sig,
    });
    
    // Seed an Audit Log for signal creation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SIGNAL_CREATED',
        entity: 'Signal',
        entityId: createdSignal.id,
      },
    });
  }

  // Seed standard login/register logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: admin.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
    },
  });

  console.log('Seeded 3 trading signals and system logs.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
