import fs from 'fs/promises';
import path from 'path';

interface SourcePaddle {
  source: string;
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
  [key: string]: any;
}

interface CombinedPaddle {
  company: string;
  paddleName: string;
  sources: string[];
  sourceCount: number;
  swingWeight?: number;
  twistWeight?: number;
  weight?: number;
  weightGrams?: number;
  spinRPM?: number;
  serveSpeed?: number;
  punchVolleySpeed?: number;
  coreThickness?: number;
  length?: number;
  width?: number;
  gripLength?: number;
  gripCircumference?: number;
  gripSize?: number;
  controlRating?: number;
  feelRating?: number;
  forgivenessRating?: number;
  touchShotsRating?: number;
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  powerPercentile?: string;
  popPercentile?: string;
  spinPercentile?: string;
  balancePoint?: string;
  shape?: string;
  faceMaterial?: string;
  coreMaterial?: string;
  surfaceTexture?: string;
  paddleType?: string;
  manufacturingProcess?: string;
  buildType?: string;
  powerRating?: string;
  spinRating?: string;
  paddleRating?: string;
  releaseYear?: string;
  approvalBody?: string;
  paddleImage?: string;
  youtubeReview?: string;
  bestOffer?: {
    price: string;
    discountCode?: string;
    purchaseLink?: string;
    source: string;
  };
  allSourceData: Array<{
    source: string;
    price?: string;
    discountCode?: string;
    purchaseLink?: string;
    paddleImage?: string;
  }>;
}

// Calculate median of an array of numbers
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Calculate mean of an array of numbers
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Get mode (most common value) from array
function mode<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  const counts = new Map<T, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  let maxCount = 0;
  let modeValue: T | undefined;
  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      modeValue = value;
    }
  });
  return modeValue;
}

// Normalize company name by removing spaces, hyphens, and special characters
function normalizeCompanyName(company: string): string {
  return company
    .toLowerCase()
    .trim()
    // Remove common suffixes like "-co", "co.", "inc", etc.
    .replace(/[-\s](co|company|inc|llc|corporation)\.?$/i, '')
    // Remove & and "and" to match "bread & butter" with "bread-butter"
    .replace(/\s*&\s*/g, '')
    .replace(/\s+and\s+/g, '')
    // Remove all spaces, hyphens, and special characters
    .replace(/[\s\-\._]/g, '')
    .trim();
}

// Normalize paddle name by removing thickness indicators
function normalizePaddleName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove thickness indicators like 16mm, 14mm, 13mm, etc.
    .replace(/\s*\d{2}mm\s*/gi, ' ')
    .replace(/\s*\d{2}\s*mm\s*/gi, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize paddle key for matching
function normalizeKey(company: string, paddleName: string, coreThickness?: number): string {
  const normalizedCompany = normalizeCompanyName(company);
  const normalizedName = normalizePaddleName(paddleName);
  const coreKey = coreThickness ? `_${coreThickness}mm` : '_nocore';
  return `${normalizedCompany}|||${normalizedName}${coreKey}`;
}

// Parse percentile string to number for averaging
function parsePercentile(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

// Format number back to percentile string
function formatPercentile(value: number): string {
  return `${Math.round(value)}%`;
}

async function loadHarmonizedData(source: string): Promise<SourcePaddle[]> {
  const outputDir = path.join(process.cwd(), 'output', 'harmonized');
  const filePath = path.join(outputDir, `harmonized_${source}.json`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

async function main() {
  console.log('🎾 Combining Paddle Data from All Sources\n');

  const startTime = Date.now();

  try {
    // Load all three sources
    console.log('📥 Loading data from all sources...');
    const [mattData, effectData, studioData] = await Promise.all([
      loadHarmonizedData('mattspickleball'),
      loadHarmonizedData('pickleballeffect'),
      loadHarmonizedData('pickleballstudio')
    ]);

    console.log(`   - Matt's Pickleball: ${mattData.length} paddles`);
    console.log(`   - Pickleball Effect: ${effectData.length} paddles`);
    console.log(`   - Pickleball Studio: ${studioData.length} paddles\n`);

    // Combine all data
    const allPaddles = [...mattData, ...effectData, ...studioData];

    // Group by company + paddleName
    console.log('🔄 Grouping paddles by company and name...');
    const paddleMap = new Map<string, SourcePaddle[]>();

    allPaddles.forEach(paddle => {
      const key = normalizeKey(paddle.company, paddle.paddleName, paddle.coreThickness);
      if (!paddleMap.has(key)) {
        paddleMap.set(key, []);
      }
      paddleMap.get(key)!.push(paddle);
    });

    console.log(`   - Found ${paddleMap.size} unique paddles\n`);

    // Combine data for each paddle
    console.log('📊 Calculating median/mode values...');
    const combinedPaddles: CombinedPaddle[] = [];

    paddleMap.forEach((paddles, key) => {
      // Choose the best display name - prefer the one with proper spacing and special characters
      // Priority: 1) Contains "&", 2) Contains spaces, 3) Longest
      const sortedForDisplay = [...paddles].sort((a, b) => {
        const aHasAmpersand = a.company.includes('&') ? 1 : 0;
        const bHasAmpersand = b.company.includes('&') ? 1 : 0;
        if (aHasAmpersand !== bHasAmpersand) return bHasAmpersand - aHasAmpersand;

        const aHasSpace = a.company.includes(' ') ? 1 : 0;
        const bHasSpace = b.company.includes(' ') ? 1 : 0;
        if (aHasSpace !== bHasSpace) return bHasSpace - aHasSpace;

        return b.company.length - a.company.length;
      });
      const displayCompany = sortedForDisplay[0].company;

      // Same logic for paddle name
      const sortedNamesForDisplay = [...paddles].sort((a, b) => {
        const aHasSpace = a.paddleName.includes(' ') ? 1 : 0;
        const bHasSpace = b.paddleName.includes(' ') ? 1 : 0;
        if (aHasSpace !== bHasSpace) return bHasSpace - aHasSpace;

        return b.paddleName.length - a.paddleName.length;
      });
      const displayName = sortedNamesForDisplay[0].paddleName;

      const combined: CombinedPaddle = {
        company: displayCompany,
        paddleName: displayName,
        sources: paddles.map(p => p.source),
        sourceCount: paddles.length,
        allSourceData: paddles.map(p => ({
          source: p.source,
          price: p.price,
          discountCode: p.discountCode,
          purchaseLink: p.purchaseLink,
          paddleImage: p.paddleImage
        }))
      };

      // Numeric fields - use median
      const numericFields = [
        'swingWeight', 'twistWeight', 'weight', 'weightGrams', 'spinRPM',
        'serveSpeed', 'punchVolleySpeed', 'coreThickness', 'length', 'width',
        'gripLength', 'gripCircumference', 'gripSize',
        'controlRating', 'feelRating', 'forgivenessRating', 'touchShotsRating'
      ];

      numericFields.forEach(field => {
        const values = paddles
          .map(p => p[field])
          .filter((v): v is number => typeof v === 'number');
        if (values.length > 0) {
          combined[field as keyof CombinedPaddle] = median(values) as any;
        }
      });

      // Percentile fields - use mean
      const percentileFields = [
        'swingWeightPercentile', 'twistWeightPercentile', 'powerPercentile',
        'popPercentile', 'spinPercentile', 'balancePoint'
      ];

      percentileFields.forEach(field => {
        const values = paddles
          .map(p => parsePercentile(p[field] as string))
          .filter((v): v is number => v !== undefined);
        if (values.length > 0) {
          combined[field as keyof CombinedPaddle] = formatPercentile(mean(values)) as any;
        }
      });

      // String fields - use mode (most common)
      const stringFields = [
        'shape', 'faceMaterial', 'coreMaterial', 'surfaceTexture',
        'paddleType', 'manufacturingProcess', 'buildType',
        'spinRating', 'paddleRating', 'releaseYear', 'approvalBody'
      ];

      stringFields.forEach(field => {
        const values = paddles
          .map(p => p[field])
          .filter((v): v is string => typeof v === 'string' && v.length > 0);
        if (values.length > 0) {
          combined[field as keyof CombinedPaddle] = mode(values) as any;
        }
      });

      // powerRating - convert to string and use mode
      const powerRatings = paddles
        .map(p => p.powerRating !== undefined ? String(p.powerRating) : undefined)
        .filter((v): v is string => v !== undefined);
      if (powerRatings.length > 0) {
        combined.powerRating = mode(powerRatings);
      }

      // Images - use first available
      combined.paddleImage = paddles.find(p => p.paddleImage)?.paddleImage;
      combined.youtubeReview = paddles.find(p => p.youtubeReview)?.youtubeReview;

      // Best offer - lowest price
      const offersWithPrice = paddles.filter(p => p.price);
      if (offersWithPrice.length > 0) {
        const sortedByPrice = offersWithPrice.sort((a, b) => {
          const priceA = parseFloat(a.price || '0');
          const priceB = parseFloat(b.price || '0');
          return priceA - priceB;
        });
        const best = sortedByPrice[0];
        combined.bestOffer = {
          price: best.price!,
          discountCode: best.discountCode,
          purchaseLink: best.purchaseLink,
          source: best.source
        };
      }

      combinedPaddles.push(combined);
    });

    // Sort by company then name
    combinedPaddles.sort((a, b) => {
      const companyCompare = a.company.localeCompare(b.company);
      return companyCompare !== 0 ? companyCompare : a.paddleName.localeCompare(b.paddleName);
    });

    // Save combined data
    console.log('💾 Saving combined data...\n');
    const outputDir = path.join(process.cwd(), 'output', 'harmonized');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'harmonized_combined_median.json');
    await fs.writeFile(outputPath, JSON.stringify(combinedPaddles, null, 2));
    console.log(`   ✓ Saved: harmonized_combined_median.json`);

    // Generate statistics
    const stats = {
      totalUniquePaddles: combinedPaddles.length,
      paddlesFromAllThreeSources: combinedPaddles.filter(p => p.sourceCount === 3).length,
      paddlesFromTwoSources: combinedPaddles.filter(p => p.sourceCount === 2).length,
      paddlesFromOneSouce: combinedPaddles.filter(p => p.sourceCount === 1).length,
      sourceBreakdown: {
        mattspickleball: mattData.length,
        pickleballeffect: effectData.length,
        pickleballstudio: studioData.length
      },
      generatedAt: new Date().toISOString()
    };

    const statsPath = path.join(outputDir, 'combination_stats.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    console.log(`   ✓ Saved: combination_stats.json\n`);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✨ Combination completed!\n');
    console.log('📊 Statistics:');
    console.log(`   - Total unique paddles: ${stats.totalUniquePaddles}`);
    console.log(`   - Paddles in all 3 sources: ${stats.paddlesFromAllThreeSources}`);
    console.log(`   - Paddles in 2 sources: ${stats.paddlesFromTwoSources}`);
    console.log(`   - Paddles in 1 source: ${stats.paddlesFromOneSouce}`);
    console.log(`   - Duration: ${duration} seconds`);

  } catch (error) {
    console.error('❌ Error during combination:', error);
    process.exit(1);
  }
}

main();
