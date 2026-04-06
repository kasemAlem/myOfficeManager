const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.project.createMany({
    data: [
      { name: 'Smith Residence', clientName: 'John Smith', status: 'IN_PROGRESS', totalFees: 15000 },
      { name: 'Downtown Cafe Renovation', clientName: 'Cafe LLC', status: 'ACTIVE', totalFees: 25000 },
      { name: 'City Plaza Tower', clientName: 'City Planners INC', status: 'PLANNING', totalFees: 150000 },
      { name: 'Lakeside Villa', clientName: 'Mary Johnson', status: 'DESIGN', totalFees: 45000 }
    ]
  });
  console.log('Test projects seeded successfully.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
