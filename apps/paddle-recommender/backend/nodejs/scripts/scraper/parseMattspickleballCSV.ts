import * as fs from 'fs';
import * as path from 'path';

interface PaddleData {
  company?: string;
  paddleName?: string;
  promoCode?: string;
  firepower?: string;
  swingWeight?: string;
  twistWeight?: string;
  staticWeight?: string;
  serveSpeed?: string;
  punchVolleySpeed?: string;
  spinRPM?: string;
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  staticWeightPercentile?: string;
  serveSpeedPercentile?: string;
  punchVolleySpeedPercentile?: string;
  spinPercentile?: string;
  balancePointPercentile?: string;
  coreThickness?: string;
  length?: string;
  width?: string;
  balancePoint?: string;
  handleLength?: string;
  handleCircumference?: string;
  honeycombCellSize?: string;
  controlRating?: string;
  feelRating?: string;
  forgivenessRating?: string;
  powerRating?: string;
  popRating?: string;
  spinRating?: string;
  shotResettingRating?: string;
  touchShotsRating?: string;
  paddleRating?: string;
  paddleStarRating?: string;
  status?: string;
  reviewUrl?: string;
  discountCode?: string;
  buyUrl?: string;
  paddleImage?: string;
  price?: string;
  releaseYear?: string;
  type?: string;
  shape?: string;
  manufacturingProcess?: string;
  surfaceTexture?: string;
  surfaceMaterial?: string;
  coreMaterial?: string;
  powerControlProfile?: string;
  approvalBody?: string;
  delisted?: string;
  createdOn?: string;
  showInPaddleFinder?: string;
  itemId?: string;
  paddleSlug?: string;
}

function parseCSV(csvContent: string): PaddleData[] {
  const lines = csvContent.split('\n');

  if (lines.length === 0) {
    console.error('CSV file is empty');
    return [];
  }

  // Parse headers
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());

  console.log('CSV Headers found:', headers.slice(0, 10).join(', '), '...');

  // Create a mapping function to find column index
  const findCol = (searchTerms: string[]) => {
    return headers.findIndex(h => searchTerms.some(term => h.includes(term)));
  };

  // Find all column indices
  const columnMap = {
    company: findCol(['company']),
    paddleName: findCol(['paddle name']),
    promoCode: findCol(['promo code']),
    firepower: findCol(['firepower']),
    swingWeight: headers.findIndex(h => h.includes('swing weight') && !h.includes('percentile')),
    twistWeight: headers.findIndex(h => h.includes('twist weight') && !h.includes('percentile')),
    staticWeight: headers.findIndex(h => h.includes('static weight') && !h.includes('percentile')),
    serveSpeed: headers.findIndex(h => h.includes('serve speed') && !h.includes('percentile')),
    punchVolleySpeed: findCol(['punch volley speed']),
    spinRPM: findCol(['spin rpm']),
    swingWeightPercentile: headers.findIndex(h => h.includes('swing weight') && h.includes('percentile')),
    twistWeightPercentile: headers.findIndex(h => h.includes('twist weight') && h.includes('percentile')),
    staticWeightPercentile: headers.findIndex(h => h.includes('static weight') && h.includes('percentile')),
    serveSpeedPercentile: headers.findIndex(h => h.includes('serve speed') && h.includes('percentile')),
    punchVolleySpeedPercentile: headers.findIndex(h => h.includes('punch volley') && h.includes('percentile')),
    spinPercentile: headers.findIndex(h => h.includes('spin') && h.includes('percentile')),
    balancePointPercentile: headers.findIndex(h => h.includes('balance point') && h.includes('percentile')),
    coreThickness: findCol(['core thickness']),
    length: headers.findIndex(h => h === 'length (in)' || h === 'length'),
    width: headers.findIndex(h => h === 'width (in)' || h === 'width'),
    balancePoint: findCol(['balance point (cm)', 'balance point']),
    handleLength: findCol(['handle length']),
    handleCircumference: findCol(['handle circumference']),
    honeycombCellSize: findCol(['honeycomb cell size']),
    controlRating: findCol(['control rating']),
    feelRating: findCol(['feel rating']),
    forgivenessRating: findCol(['forgiveness rating']),
    powerRating: findCol(['power', 'drive', 'rating']),
    popRating: findCol(['pop', 'punch volley', 'rating']),
    spinRating: findCol(['spin rating']),
    shotResettingRating: findCol(['shot resetting rating']),
    touchShotsRating: findCol(['touch shots', 'rating']),
    paddleRating: findCol(['paddle rating']),
    paddleStarRating: findCol(['paddle star rating']),
    status: findCol(['status']),
    reviewUrl: findCol(['review url']),
    discountCode: findCol(['discount code']),
    buyUrl: findCol(['buy url']),
    paddleImage: findCol(['paddle image']),
    price: findCol(['price']),
    releaseYear: findCol(['release year']),
    type: findCol(['type']),
    shape: findCol(['shape']),
    manufacturingProcess: findCol(['manufacturing process']),
    surfaceTexture: findCol(['surface texture']),
    surfaceMaterial: findCol(['surface material']),
    coreMaterial: findCol(['core material']),
    powerControlProfile: findCol(['power/control profile', 'power control profile']),
    approvalBody: findCol(['approval body']),
    delisted: findCol(['delisted']),
    createdOn: findCol(['created on']),
    showInPaddleFinder: findCol(['show in paddle finder']),
    itemId: findCol(['item id']),
    paddleSlug: findCol(['paddle-slug', 'paddle slug'])
  };

  console.log(`\nFound ${Object.values(columnMap).filter(v => v >= 0).length} columns out of ${Object.keys(columnMap).length} total fields`);

  if (columnMap.company === -1 || columnMap.paddleName === -1) {
    console.error('\nError: Could not find Company or Paddle Name columns');
    console.log('Available headers:', headers.join(', '));
    return [];
  }

  const data: PaddleData[] = [];

  // Helper to get value safely
  const getValue = (values: string[], idx: number) => {
    return idx >= 0 && values[idx] ? values[idx].trim() : undefined;
  };

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    const rowData: PaddleData = {
      company: getValue(values, columnMap.company),
      paddleName: getValue(values, columnMap.paddleName),
      promoCode: getValue(values, columnMap.promoCode),
      firepower: getValue(values, columnMap.firepower),
      swingWeight: getValue(values, columnMap.swingWeight),
      twistWeight: getValue(values, columnMap.twistWeight),
      staticWeight: getValue(values, columnMap.staticWeight),
      serveSpeed: getValue(values, columnMap.serveSpeed),
      punchVolleySpeed: getValue(values, columnMap.punchVolleySpeed),
      spinRPM: getValue(values, columnMap.spinRPM),
      swingWeightPercentile: getValue(values, columnMap.swingWeightPercentile),
      twistWeightPercentile: getValue(values, columnMap.twistWeightPercentile),
      staticWeightPercentile: getValue(values, columnMap.staticWeightPercentile),
      serveSpeedPercentile: getValue(values, columnMap.serveSpeedPercentile),
      punchVolleySpeedPercentile: getValue(values, columnMap.punchVolleySpeedPercentile),
      spinPercentile: getValue(values, columnMap.spinPercentile),
      balancePointPercentile: getValue(values, columnMap.balancePointPercentile),
      coreThickness: getValue(values, columnMap.coreThickness),
      length: getValue(values, columnMap.length),
      width: getValue(values, columnMap.width),
      balancePoint: getValue(values, columnMap.balancePoint),
      handleLength: getValue(values, columnMap.handleLength),
      handleCircumference: getValue(values, columnMap.handleCircumference),
      honeycombCellSize: getValue(values, columnMap.honeycombCellSize),
      controlRating: getValue(values, columnMap.controlRating),
      feelRating: getValue(values, columnMap.feelRating),
      forgivenessRating: getValue(values, columnMap.forgivenessRating),
      powerRating: getValue(values, columnMap.powerRating),
      popRating: getValue(values, columnMap.popRating),
      spinRating: getValue(values, columnMap.spinRating),
      shotResettingRating: getValue(values, columnMap.shotResettingRating),
      touchShotsRating: getValue(values, columnMap.touchShotsRating),
      paddleRating: getValue(values, columnMap.paddleRating),
      paddleStarRating: getValue(values, columnMap.paddleStarRating),
      status: getValue(values, columnMap.status),
      reviewUrl: getValue(values, columnMap.reviewUrl),
      discountCode: getValue(values, columnMap.discountCode),
      buyUrl: getValue(values, columnMap.buyUrl),
      paddleImage: getValue(values, columnMap.paddleImage),
      price: getValue(values, columnMap.price),
      releaseYear: getValue(values, columnMap.releaseYear),
      type: getValue(values, columnMap.type),
      shape: getValue(values, columnMap.shape),
      manufacturingProcess: getValue(values, columnMap.manufacturingProcess),
      surfaceTexture: getValue(values, columnMap.surfaceTexture),
      surfaceMaterial: getValue(values, columnMap.surfaceMaterial),
      coreMaterial: getValue(values, columnMap.coreMaterial),
      powerControlProfile: getValue(values, columnMap.powerControlProfile),
      approvalBody: getValue(values, columnMap.approvalBody),
      delisted: getValue(values, columnMap.delisted),
      createdOn: getValue(values, columnMap.createdOn),
      showInPaddleFinder: getValue(values, columnMap.showInPaddleFinder),
      itemId: getValue(values, columnMap.itemId),
      paddleSlug: getValue(values, columnMap.paddleSlug)
    };

    // Only add if we have at least the paddle name
    if (rowData.paddleName) {
      data.push(rowData);
    }
  }

  return data;
}

// Proper CSV line parser that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

// Main function
function main() {
  // Look for CSV file in current directory
  const possiblePaths = [
    './mattspickleball.csv',
    './airtable_export.csv',
    './paddle_data.csv',
    './Airtable.csv',
    './Matt\'s Pickleball-Grid view.csv',
    '/Users/shawnhong/Downloads/mattspickleball.csv'
  ];

  let csvPath: string | null = null;

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }

  // If not found, check Downloads folder
  if (!csvPath) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const downloadsPath = path.join(homeDir, 'Downloads');

    if (fs.existsSync(downloadsPath)) {
      const files = fs.readdirSync(downloadsPath);
      const csvFiles = files.filter(f => f.endsWith('.csv') &&
        (f.toLowerCase().includes('matt') || f.toLowerCase().includes('paddle') || f.toLowerCase().includes('airtable')));

      if (csvFiles.length > 0) {
        // Use most recent file
        csvFiles.sort((a, b) => {
          const aPath = path.join(downloadsPath, a);
          const bPath = path.join(downloadsPath, b);
          return fs.statSync(bPath).mtime.getTime() - fs.statSync(aPath).mtime.getTime();
        });
        csvPath = path.join(downloadsPath, csvFiles[0]);
        console.log(`Found CSV in Downloads: ${csvFiles[0]}`);
      }
    }
  }

  if (!csvPath) {
    console.error('CSV file not found!');
    console.log('\nPlease download the Matt\'s Pickleball CSV and either:');
    console.log('1. Save it as "mattspickleball.csv" in the project root directory');
    console.log('2. Save it in your Downloads folder');
    process.exit(1);
  }

  console.log(`Reading CSV from: ${csvPath}\n`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const data = parseCSV(csvContent);

  console.log(`\n✓ Parsed ${data.length} paddle records`);

  if (data.length === 0) {
    console.error('No valid data found in CSV');
    process.exit(1);
  }

  // Save to JSON
  const outputDir = './output/raw';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'mattspickleball_paddle_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${outputPath}`);

  // Show sample
  console.log('\nSample records:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  console.log(`\n✓ Complete! Successfully processed ${data.length} paddles`);
}

// Run
main();
