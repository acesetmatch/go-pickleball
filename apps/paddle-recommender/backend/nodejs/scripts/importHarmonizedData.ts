import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface HarmonizedPaddle {
  source: 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio';
  company: string;
  paddleName: string;
  price?: string;
  discountCode?: string;
  purchaseLink?: string;
  swingWeight?: number;
  twistWeight?: number;
  weight?: number;
  weightGrams?: number;
  spinRPM?: number;
  serveSpeed?: number;
  punchVolleySpeed?: number;
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  powerPercentile?: string;
  popPercentile?: string;
  spinPercentile?: string;
  coreThickness?: number;
  shape?: string;
  length?: number;
  width?: number;
  gripLength?: number;
  gripCircumference?: number;
  gripSize?: number;
  balancePoint?: string;
  faceMaterial?: string;
  coreMaterial?: string;
  surfaceTexture?: string;
  paddleType?: string;
  manufacturingProcess?: string;
  buildType?: string;
  controlRating?: number;
  feelRating?: number;
  forgivenessRating?: number;
  powerRating?: number | string;
  spinRating?: string;
  touchShotsRating?: number;
  paddleRating?: string;
  releaseYear?: string;
  approvalBody?: string;
  paddleImage?: string;
  youtubeReview?: string;
  sourceData?: any;
}

async function loadHarmonizedData(source: string): Promise<HarmonizedPaddle[]> {
  const outputDir = path.join(process.cwd(), 'output', 'harmonized');
  const filePath = path.join(outputDir, `harmonized_${source}.json`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

async function importSourceData(source: 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio') {
  console.log(`\n📥 Importing ${source} data...`);

  const data = await loadHarmonizedData(source);
  console.log(`   Found ${data.length} paddles`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const paddle of data) {
    try {
      // Convert powerRating to string if it's a number
      const powerRatingStr = paddle.powerRating !== undefined
        ? String(paddle.powerRating)
        : undefined;

      await prisma.sourcePaddle.upsert({
        where: {
          source_company_paddleName: {
            source: paddle.source,
            company: paddle.company,
            paddleName: paddle.paddleName
          }
        },
        update: {
          price: paddle.price,
          discountCode: paddle.discountCode,
          purchaseLink: paddle.purchaseLink,
          swingWeight: paddle.swingWeight,
          twistWeight: paddle.twistWeight,
          weight: paddle.weight,
          weightGrams: paddle.weightGrams,
          spinRPM: paddle.spinRPM,
          serveSpeed: paddle.serveSpeed,
          punchVolleySpeed: paddle.punchVolleySpeed,
          swingWeightPercentile: paddle.swingWeightPercentile,
          twistWeightPercentile: paddle.twistWeightPercentile,
          powerPercentile: paddle.powerPercentile,
          popPercentile: paddle.popPercentile,
          spinPercentile: paddle.spinPercentile,
          coreThickness: paddle.coreThickness,
          shape: paddle.shape,
          length: paddle.length,
          width: paddle.width,
          gripLength: paddle.gripLength,
          gripCircumference: paddle.gripCircumference,
          gripSize: paddle.gripSize,
          balancePoint: paddle.balancePoint,
          faceMaterial: paddle.faceMaterial,
          coreMaterial: paddle.coreMaterial,
          surfaceTexture: paddle.surfaceTexture,
          paddleType: paddle.paddleType,
          manufacturingProcess: paddle.manufacturingProcess,
          buildType: paddle.buildType,
          controlRating: paddle.controlRating,
          feelRating: paddle.feelRating,
          forgivenessRating: paddle.forgivenessRating,
          powerRating: powerRatingStr,
          spinRating: paddle.spinRating,
          touchShotsRating: paddle.touchShotsRating,
          paddleRating: paddle.paddleRating,
          releaseYear: paddle.releaseYear,
          approvalBody: paddle.approvalBody,
          paddleImage: paddle.paddleImage,
          youtubeReview: paddle.youtubeReview,
          sourceData: paddle.sourceData || paddle
        },
        create: {
          source: paddle.source,
          company: paddle.company,
          paddleName: paddle.paddleName,
          price: paddle.price,
          discountCode: paddle.discountCode,
          purchaseLink: paddle.purchaseLink,
          swingWeight: paddle.swingWeight,
          twistWeight: paddle.twistWeight,
          weight: paddle.weight,
          weightGrams: paddle.weightGrams,
          spinRPM: paddle.spinRPM,
          serveSpeed: paddle.serveSpeed,
          punchVolleySpeed: paddle.punchVolleySpeed,
          swingWeightPercentile: paddle.swingWeightPercentile,
          twistWeightPercentile: paddle.twistWeightPercentile,
          powerPercentile: paddle.powerPercentile,
          popPercentile: paddle.popPercentile,
          spinPercentile: paddle.spinPercentile,
          coreThickness: paddle.coreThickness,
          shape: paddle.shape,
          length: paddle.length,
          width: paddle.width,
          gripLength: paddle.gripLength,
          gripCircumference: paddle.gripCircumference,
          gripSize: paddle.gripSize,
          balancePoint: paddle.balancePoint,
          faceMaterial: paddle.faceMaterial,
          coreMaterial: paddle.coreMaterial,
          surfaceTexture: paddle.surfaceTexture,
          paddleType: paddle.paddleType,
          manufacturingProcess: paddle.manufacturingProcess,
          buildType: paddle.buildType,
          controlRating: paddle.controlRating,
          feelRating: paddle.feelRating,
          forgivenessRating: paddle.forgivenessRating,
          powerRating: powerRatingStr,
          spinRating: paddle.spinRating,
          touchShotsRating: paddle.touchShotsRating,
          paddleRating: paddle.paddleRating,
          releaseYear: paddle.releaseYear,
          approvalBody: paddle.approvalBody,
          paddleImage: paddle.paddleImage,
          youtubeReview: paddle.youtubeReview,
          sourceData: paddle.sourceData || paddle
        }
      });

      inserted++;
    } catch (error) {
      errors++;
      console.error(`   ✗ Error importing ${paddle.company} ${paddle.paddleName}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`   ✓ Imported: ${inserted} paddles`);
  if (errors > 0) {
    console.log(`   ✗ Errors: ${errors}`);
  }

  return { inserted, updated, errors };
}

function parseSourcesFromArgs(): Array<'mattspickleball' | 'pickleballeffect' | 'pickleballstudio'> {
  const sourceFlagIndex = process.argv.findIndex(arg => arg === '--source' || arg === '--sources');
  if (sourceFlagIndex === -1) {
    return ['mattspickleball', 'pickleballeffect', 'pickleballstudio'];
  }

  const rawValue = process.argv[sourceFlagIndex + 1];
  if (!rawValue) {
    console.error('Missing value for --source/--sources. Example: --source pickleballeffect');
    process.exit(1);
  }

  const allowedSources = new Set(['mattspickleball', 'pickleballeffect', 'pickleballstudio']);
  const sources = rawValue
    .split(',')
    .map(source => source.trim())
    .filter(Boolean)
    .filter(source => {
      if (!allowedSources.has(source)) {
        console.error(`Invalid source: ${source}. Allowed: mattspickleball, pickleballeffect, pickleballstudio`);
        process.exit(1);
      }
      return true;
    }) as Array<'mattspickleball' | 'pickleballeffect' | 'pickleballstudio'>;

  if (sources.length === 0) {
    console.error('No valid sources provided for --source/--sources.');
    process.exit(1);
  }

  return sources;
}

async function main() {
  console.log('🎾 Starting Harmonized Data Import to PostgreSQL\n');

  const startTime = Date.now();

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      console.log('🗑️  Clearing existing source_paddles data...');
      await prisma.sourcePaddle.deleteMany({});
      console.log('   ✓ Cleared existing data\n');
    }

    const sources = parseSourcesFromArgs();

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const source of sources) {
      const result = await importSourceData(source);
      totalInserted += result.inserted;
      totalUpdated += result.updated;
      totalErrors += result.errors;
    }

    // Get final counts
    const countBySource = await Promise.all(
      sources.map(source => prisma.sourcePaddle.count({ where: { source } }))
    );
    const totalCount = await prisma.sourcePaddle.count();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✨ Import completed!\n');
    console.log('📊 Statistics:');
    sources.forEach((source, index) => {
      const label = source === 'mattspickleball'
        ? "Matt's Pickleball"
        : source === 'pickleballeffect'
          ? 'Pickleball Effect'
          : 'Pickleball Studio';
      console.log(`   - ${label}: ${countBySource[index]} paddles`);
    });
    console.log(`   - Total: ${totalCount} paddles`);
    console.log(`   - Duration: ${duration} seconds`);

    if (totalErrors > 0) {
      console.log(`\n⚠️  Total errors: ${totalErrors}`);
    }

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
