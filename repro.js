const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const expense = await prisma.businessExpense.create({
      data: {
        category: 'Test',
        amount: 100,
        date: new Date(),
        vendor: 'Repro',
        notes: 'Test'
      }
    });
    console.log('Success:', expense);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
