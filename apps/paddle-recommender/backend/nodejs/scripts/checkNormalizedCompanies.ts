import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check for bread & butter variations
  const breadButter = await prisma.sourcePaddle.findMany({
    where: {
      OR: [
        { company: { contains: 'bread', mode: 'insensitive' } }
      ]
    },
    select: {
      company: true,
      normalizedCompany: true
    },
    distinct: ['company']
  });

  console.log('Bread & Butter variations:');
  breadButter.forEach(p => console.log(`  "${p.company}" → "${p.normalizedCompany}"`));

  // Check for honolulu variations
  const honolulu = await prisma.sourcePaddle.findMany({
    where: {
      OR: [
        { company: { contains: 'honolulu', mode: 'insensitive' } }
      ]
    },
    select: {
      company: true,
      normalizedCompany: true
    },
    distinct: ['company']
  });

  console.log('\nHonolulu variations:');
  honolulu.forEach(p => console.log(`  "${p.company}" → "${p.normalizedCompany}"`));

  // Check for six zero variations
  const sixzero = await prisma.sourcePaddle.findMany({
    where: {
      OR: [
        { company: { contains: 'six', mode: 'insensitive' } }
      ]
    },
    select: {
      company: true,
      normalizedCompany: true
    },
    distinct: ['company']
  });

  console.log('\nSix Zero variations:');
  sixzero.forEach(p => console.log(`  "${p.company}" → "${p.normalizedCompany}"`));

  // Check for pickleball apes variations
  const pbapes = await prisma.sourcePaddle.findMany({
    where: {
      OR: [
        { company: { contains: 'apes', mode: 'insensitive' } }
      ]
    },
    select: {
      company: true,
      normalizedCompany: true
    },
    distinct: ['company']
  });

  console.log('\nPickleball Apes variations:');
  pbapes.forEach(p => console.log(`  "${p.company}" → "${p.normalizedCompany}"`));

  await prisma.$disconnect();
}

main();
