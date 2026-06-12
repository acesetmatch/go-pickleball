#!/usr/bin/env node
/**
 * Seeds the source_paddles table from harmonized JSON output files.
 * Idempotent — uses upsert, safe to run repeatedly.
 *
 * Usage: node seed-source-paddles.cjs
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const SOURCES = ['mattspickleball', 'pickleballeffect', 'pickleballstudio'];

async function importSource(source) {
  // __dirname = /app (script lives at project root in the container)
  const filePath = path.join(__dirname, 'output', 'harmonized', `harmonized_${source}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⏭️  No data file for ${source}, skipping`);
    return { inserted: 0, errors: 0 };
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`  📦 ${source}: ${data.length} paddles found`);

  let inserted = 0;
  let errors = 0;

  for (const paddle of data) {
    try {
      const powerRatingStr = paddle.powerRating !== undefined ? String(paddle.powerRating) : undefined;

      await prisma.sourcePaddle.upsert({
        where: {
          source_company_paddleName: {
            source: paddle.source,
            company: paddle.company,
            paddleName: paddle.paddleName,
          },
        },
        update: {
          price: paddle.price,
          swingWeight: paddle.swingWeight,
          twistWeight: paddle.twistWeight,
          weight: paddle.weight,
          weightGrams: paddle.weightGrams,
          spinRPM: paddle.spinRPM,
          shape: paddle.shape,
          length: paddle.length,
          width: paddle.width,
          gripLength: paddle.gripLength,
          gripCircumference: paddle.gripCircumference,
          faceMaterial: paddle.faceMaterial,
          coreMaterial: paddle.coreMaterial,
          surfaceTexture: paddle.surfaceTexture,
          paddleType: paddle.paddleType,
          powerRating: powerRatingStr,
          spinRating: paddle.spinRating,
          paddleImage: paddle.paddleImage,
          sourceData: paddle.sourceData || paddle,
        },
        create: {
          source: paddle.source,
          company: paddle.company,
          paddleName: paddle.paddleName,
          price: paddle.price,
          swingWeight: paddle.swingWeight,
          twistWeight: paddle.twistWeight,
          weight: paddle.weight,
          weightGrams: paddle.weightGrams,
          spinRPM: paddle.spinRPM,
          shape: paddle.shape,
          length: paddle.length,
          width: paddle.width,
          gripLength: paddle.gripLength,
          gripCircumference: paddle.gripCircumference,
          faceMaterial: paddle.faceMaterial,
          coreMaterial: paddle.coreMaterial,
          surfaceTexture: paddle.surfaceTexture,
          paddleType: paddle.paddleType,
          powerRating: powerRatingStr,
          spinRating: paddle.spinRating,
          paddleImage: paddle.paddleImage,
          sourceData: paddle.sourceData || paddle,
        },
      });
      inserted++;
    } catch (err) {
      errors++;
      console.error(`  ✗ Error: ${paddle.company} ${paddle.paddleName}:`, err.message);
    }
  }

  return { inserted, errors };
}

async function main() {
  console.log('🎾 Seeding source_paddles from harmonized data...\n');

  for (const source of SOURCES) {
    const result = await importSource(source);
    console.log(`  ✓ ${source}: ${result.inserted} upserted, ${result.errors} errors`);
  }

  // Gracefully handle missing table (e.g., if migrations haven't run yet)
  let total = 0;
  try {
    total = await prisma.sourcePaddle.count();
  } catch {
    console.log('\n  ⚠️  source_paddles table not found (migrations may not have run yet)');
  }
  console.log(total > 0 ? `\n📊 Total source_paddles: ${total}` : '');
  console.log('✅ Done');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
