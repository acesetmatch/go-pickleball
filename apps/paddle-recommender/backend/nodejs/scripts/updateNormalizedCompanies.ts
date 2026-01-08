import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Normalize company name - same logic as combineSourcesMedian.ts
function normalizeCompanyName(company: string): string {
  return company
    .toLowerCase()
    .trim()
    // Remove common suffixes like "-co", "co.", "inc", etc.
    .replace(/[-\s](co|company|inc|llc|corporation)\.?$/i, '')
    // Remove & and "and" to match "bread & butter" with "bread-butter"
    .replace(/\s*&\s*/g, '')
    .replace(/\s+and\s+/g, '')
    // Remove all spaces, hyphens, periods, and underscores
    .replace(/[\s\-\._]/g, '')
    .trim();
}

async function main() {
  console.log('🔄 Updating normalized company names...\n');

  try {
    // Get all source paddles
    const paddles = await prisma.sourcePaddle.findMany();
    console.log(`Found ${paddles.length} paddles to update\n`);

    let updated = 0;
    const batchSize = 100;

    // Update in batches
    for (let i = 0; i < paddles.length; i += batchSize) {
      const batch = paddles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (paddle) => {
          const normalizedCompany = normalizeCompanyName(paddle.company);

          await prisma.sourcePaddle.update({
            where: { id: paddle.id },
            data: { normalizedCompany }
          });

          updated++;

          // Log progress every 100 records
          if (updated % 100 === 0) {
            console.log(`   Updated ${updated}/${paddles.length} paddles...`);
          }
        })
      );
    }

    console.log(`\n✅ Successfully updated ${updated} paddle records\n`);

    // Show some examples
    console.log('📊 Sample normalized companies:');
    const samples = await prisma.sourcePaddle.findMany({
      select: {
        company: true,
        normalizedCompany: true
      },
      distinct: ['company'],
      take: 10
    });

    samples.forEach(s => {
      console.log(`   "${s.company}" → "${s.normalizedCompany}"`);
    });

  } catch (error) {
    console.error('❌ Error updating normalized companies:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
