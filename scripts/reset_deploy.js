const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging existing database tables...');
  
  // Truncate all tables (SQLite safe approach)
  const tablenames = await prisma.$queryRaw`SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`;
  
  for (const { name } of tablenames) {
    if (name !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
      } catch (error) {
        console.log({ error });
      }
    }
  }

  console.log('✅ Database purged.');

  console.log('🚀 Provisioning Initial Administrator...');

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@acme.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'SecurePassword123!';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'System Administrator';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin provisioned completely: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error('Fatal initialization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
