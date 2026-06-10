import * as fs from 'fs';
import * as path from 'path';

// Unified schema for all paddle data
interface HarmonizedPaddle {
  // Identification
  source: 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio';
  company: string;
  paddleName: string;

  // Pricing & Links
  price?: string;
  discountCode?: string;
  purchaseLink?: string;

  // Core Metrics
  swingWeight?: number;
  twistWeight?: number;
  weight?: number; // in oz
  weightGrams?: number;

  // Performance Metrics
  spinRPM?: number;
  serveSpeed?: number; // MPH
  punchVolleySpeed?: number; // MPH (pop)

  // Percentiles
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  spinPercentile?: string;
  powerPercentile?: string;
  popPercentile?: string;

  // Physical Specs
  coreThickness?: number; // mm
  shape?: string;
  length?: number; // inches
  width?: number; // inches
  gripLength?: number; // inches
  gripSize?: number; // inches
  gripCircumference?: number; // inches
  balancePoint?: string;

  // Materials
  faceMaterial?: string;
  coreMaterial?: string;
  surfaceTexture?: string;

  // Type/Classification
  paddleType?: string;
  buildType?: string;
  manufacturingProcess?: string;

  // Ratings
  controlRating?: number;
  feelRating?: number;
  forgivenessRating?: number;
  powerRating?: number;
  spinRating?: string | number;
  touchShotsRating?: number;
  paddleRating?: string;
  paddleStarRating?: number;

  // Additional Info
  releaseYear?: string;
  approvalBody?: string;
  youtubeReview?: string;
  paddleImage?: string;

  // Source-specific fields (optional)
  sourceData?: any;
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? undefined : num;
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/-pickleball$/i, '')
    .replace(/^11six24/i, '11SIX24')
    .trim();
}

function harmonizeMattspickleball(data: any[]): HarmonizedPaddle[] {
  return data.map(item => ({
    source: 'mattspickleball' as const,
    company: normalizeCompanyName(item.company || ''),
    paddleName: item.paddleName || '',
    price: item.price,
    discountCode: item.discountCode,
    purchaseLink: item.buyUrl,
    swingWeight: parseNumber(item.swingWeight),
    twistWeight: parseNumber(item.twistWeight),
    weight: parseNumber(item.staticWeight),
    spinRPM: parseNumber(item.spinRPM),
    serveSpeed: parseNumber(item.serveSpeed),
    punchVolleySpeed: parseNumber(item.punchVolleySpeed),
    swingWeightPercentile: item.swingWeightPercentile,
    twistWeightPercentile: item.twistWeightPercentile,
    spinPercentile: item.spinPercentile,
    powerPercentile: item.serveSpeedPercentile,
    popPercentile: item.punchVolleySpeedPercentile,
    coreThickness: parseNumber(item.coreThickness),
    shape: item.shape,
    length: parseNumber(item.length),
    width: parseNumber(item.width),
    gripLength: parseNumber(item.handleLength),
    gripCircumference: parseNumber(item.handleCircumference),
    balancePoint: item.balancePoint,
    faceMaterial: item.surfaceMaterial,
    coreMaterial: item.coreMaterial,
    surfaceTexture: item.surfaceTexture,
    paddleType: item.type,
    manufacturingProcess: item.manufacturingProcess,
    controlRating: parseNumber(item.controlRating),
    feelRating: parseNumber(item.feelRating),
    forgivenessRating: parseNumber(item.forgivenessRating),
    powerRating: parseNumber(item.powerRating),
    spinRating: item.spinRating,
    touchShotsRating: parseNumber(item.touchShotsRating),
    paddleRating: item.paddleRating,
    paddleStarRating: parseNumber(item.paddleStarRating),
    releaseYear: item.releaseYear,
    approvalBody: item.approvalBody,
    paddleImage: item.paddleImage,
    sourceData: item
  }));
}

function harmonizePickleballeffect(data: any[]): HarmonizedPaddle[] {
  return data.map(item => ({
    source: 'pickleballeffect' as const,
    company: normalizeCompanyName(item.brand || ''),
    paddleName: item.paddleName || '',
    price: item.price?.replace('$', ''),
    discountCode: item.discountCode,
    purchaseLink: item.linkToPaddle,
    swingWeight: parseNumber(item.swingweight),
    twistWeight: parseNumber(item.twistweight),
    weight: parseNumber(item.weight),
    spinRPM: parseNumber(item.spinRPM),
    serveSpeed: parseNumber(item.powerMPH),
    punchVolleySpeed: parseNumber(item.popMPH),
    swingWeightPercentile: item.swingweightPercentile,
    twistWeightPercentile: item.twistweightPercentile,
    powerPercentile: item.powerPercentile,
    popPercentile: item.popPercentile,
    coreThickness: parseNumber(item.coreThickness),
    shape: item.shape,
    gripLength: parseNumber(item.gripLength),
    gripSize: parseNumber(item.gripSize),
    balancePoint: item.balancePoint,
    faceMaterial: item.faceMaterial,
    surfaceTexture: item.gritType,
    paddleType: item.paddleType,
    buildType: item.buildType,
    spinRating: item.spinRating,
    releaseYear: item.yearReleased,
    sourceData: item
  }));
}

function harmonizePickleballstudio(data: any[]): HarmonizedPaddle[] {
  return data.map(item => ({
    source: 'pickleballstudio' as const,
    company: normalizeCompanyName(item.company || ''),
    paddleName: item.paddle || '',
    price: item.price,
    discountCode: item.discountCode,
    purchaseLink: item.linkToPurchase,
    swingWeight: parseNumber(item.swingWeight),
    twistWeight: parseNumber(item.twistWeight),
    weight: parseNumber(item.myPaddlesWeight),
    weightGrams: parseNumber(item.grams),
    spinRPM: parseNumber(item.rpm),
    coreThickness: parseNumber(item.coreThickness),
    shape: item.shape,
    gripLength: parseNumber(item.gripLength),
    gripSize: parseNumber(item.gripThickness),
    balancePoint: item.balance,
    faceMaterial: item.faceMaterial,
    coreMaterial: item.coreMaterial,
    youtubeReview: item.youtubeReview,
    sourceData: item
  }));
}

type SourceKey = 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio';

function parseSourcesFromArgs(): SourceKey[] {
  const sourceFlagIndex = process.argv.findIndex(arg => arg === '--source' || arg === '--sources');
  if (sourceFlagIndex === -1) {
    return ['mattspickleball', 'pickleballeffect', 'pickleballstudio'];
  }

  const rawValue = process.argv[sourceFlagIndex + 1];
  if (!rawValue) {
    console.error('Missing value for --source/--sources. Example: --source pickleballeffect');
    process.exit(1);
  }

  const allowedSources = new Set<SourceKey>(['mattspickleball', 'pickleballeffect', 'pickleballstudio']);
  const sources = rawValue
    .split(',')
    .map(source => source.trim())
    .filter(Boolean)
    .filter(source => {
      if (!allowedSources.has(source as SourceKey)) {
        console.error(`Invalid source: ${source}. Allowed: mattspickleball, pickleballeffect, pickleballstudio`);
        process.exit(1);
      }
      return true;
    }) as SourceKey[];

  if (sources.length === 0) {
    console.error('No valid sources provided for --source/--sources.');
    process.exit(1);
  }

  return sources;
}

function main() {
  const sources = parseSourcesFromArgs();
  console.log(`Loading data from sources: ${sources.join(', ')}...\n`);

  const sourceConfigs: Record<SourceKey, { path: string; label: string; harmonize: (data: any[]) => HarmonizedPaddle[] }> = {
    mattspickleball: {
      path: './output/raw/mattspickleball_paddle_data.json',
      label: "Matt's Pickleball",
      harmonize: harmonizeMattspickleball
    },
    pickleballeffect: {
      path: './output/raw/pickleballeffect_paddle_data.json',
      label: 'Pickleball Effect',
      harmonize: harmonizePickleballeffect
    },
    pickleballstudio: {
      path: './output/raw/pickleballstudio_paddle_data.json',
      label: 'Pickleball Studio',
      harmonize: harmonizePickleballstudio
    }
  };

  const sourceData: Record<SourceKey, any[]> = {} as Record<SourceKey, any[]>;

  for (const source of sources) {
    const config = sourceConfigs[source];
    if (!fs.existsSync(config.path)) {
      console.error(`Missing raw data for ${config.label}: ${config.path}`);
      process.exit(1);
    }
    sourceData[source] = JSON.parse(fs.readFileSync(config.path, 'utf-8'));
    console.log(`Loaded ${sourceData[source].length} records from ${config.label}`);
  }

  console.log('\nHarmonizing data...\n');

  const harmonizedBySource: Record<SourceKey, HarmonizedPaddle[]> = {} as Record<SourceKey, HarmonizedPaddle[]>;
  for (const source of sources) {
    harmonizedBySource[source] = sourceConfigs[source].harmonize(sourceData[source]);
  }

  // Save individual harmonized files
  const harmonizedDir = './output/harmonized';
  if (!fs.existsSync(harmonizedDir)) {
    fs.mkdirSync(harmonizedDir, { recursive: true });
  }

  for (const source of sources) {
    const outputPath = path.join(harmonizedDir, `harmonized_${source}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(harmonizedBySource[source], null, 2));
    console.log(`✓ Saved harmonized_${source}.json (${harmonizedBySource[source].length} records)`);
  }

  // Combine all sources
  const combined = sources.flatMap(source => harmonizedBySource[source]);

  fs.writeFileSync(
    path.join(harmonizedDir, 'harmonized_all_sources.json'),
    JSON.stringify(combined, null, 2)
  );
  console.log(`✓ Saved harmonized_all_sources.json (${combined.length} total records)`);

  // Generate summary statistics
  const stats = {
    totalRecords: combined.length,
    bySource: Object.fromEntries(
      sources.map(source => [source, harmonizedBySource[source].length])
    ),
    uniqueCompanies: [...new Set(combined.map(p => p.company))].sort(),
    recordsWithSwingWeight: combined.filter(p => p.swingWeight).length,
    recordsWithTwistWeight: combined.filter(p => p.twistWeight).length,
    recordsWithSpinRPM: combined.filter(p => p.spinRPM).length,
    recordsWithPrice: combined.filter(p => p.price).length
  };

  fs.writeFileSync(
    path.join(harmonizedDir, 'harmonization_stats.json'),
    JSON.stringify(stats, null, 2)
  );
  console.log(`✓ Saved harmonization_stats.json`);

  console.log('\n=== Summary ===');
  console.log(`Total records: ${stats.totalRecords}`);
  console.log(`Unique companies: ${stats.uniqueCompanies.length}`);
  console.log(`Records with swing weight: ${stats.recordsWithSwingWeight}`);
  console.log(`Records with twist weight: ${stats.recordsWithTwistWeight}`);
  console.log(`Records with spin RPM: ${stats.recordsWithSpinRPM}`);
  console.log(`Records with price: ${stats.recordsWithPrice}`);

  console.log('\n✓ Harmonization complete!');
}

main();
