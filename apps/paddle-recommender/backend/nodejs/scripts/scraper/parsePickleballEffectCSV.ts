import * as fs from 'fs';
import * as path from 'path';

interface PaddleData {
  paddleName?: string;
  brand?: string;
  price?: string;
  discountCode?: string;
  linkToPaddle?: string;
  yearReleased?: string;
  shape?: string;
  faceMaterial?: string;
  gritType?: string;
  buildType?: string;
  paddleType?: string;
  coreThickness?: string;
  gripLength?: string;
  gripSize?: string;
  weight?: string;
  swingweight?: string;
  swingweightPercentile?: string;
  twistweight?: string;
  twistweightPercentile?: string;
  balancePoint?: string;
  spinRating?: string;
  spinRPM?: string;
  powerMPH?: string;
  powerPercentile?: string;
  popMPH?: string;
  popPercentile?: string;
}

function parseCSV(csvContent: string): PaddleData[] {
  const lines = csvContent.split('\n');

  if (lines.length === 0) {
    console.error('CSV file is empty');
    return [];
  }

  // Parse headers - remove BOM if present
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }

  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());

  console.log('CSV Headers found:', headers.slice(0, 10).join(', '), '...');

  // Create a mapping function to find column index
  const findCol = (searchTerms: string[]) => {
    return headers.findIndex(h => searchTerms.some(term => h.includes(term)));
  };

  // Find all column indices
  const columnMap = {
    paddleName: findCol(['paddle name']),
    brand: findCol(['brand']),
    price: findCol(['price']),
    discountCode: findCol(['discount code']),
    linkToPaddle: findCol(['link to paddle']),
    yearReleased: findCol(['year released']),
    shape: findCol(['shape']),
    faceMaterial: findCol(['face material']),
    gritType: findCol(['grit type']),
    buildType: findCol(['build type']),
    paddleType: findCol(['paddle type']),
    coreThickness: findCol(['core thickness']),
    gripLength: findCol(['grip length']),
    gripSize: findCol(['grip size']),
    weight: headers.findIndex(h => h === 'weight (oz)' || h === 'weight'),
    swingweight: headers.findIndex(h => h === 'swingweight' && !h.includes('percentile')),
    swingweightPercentile: findCol(['swingweight percentile']),
    twistweight: headers.findIndex(h => h === 'twistweight' && !h.includes('percentile')),
    twistweightPercentile: findCol(['twistweight percentile']),
    balancePoint: findCol(['balance point']),
    spinRating: findCol(['spin rating']),
    spinRPM: headers.findIndex(h => h.includes('spin') && h.includes('rpm')),
    powerMPH: headers.findIndex(h => h.includes('power') && h.includes('mph')),
    powerPercentile: findCol(['power percentile']),
    popMPH: headers.findIndex(h => h.includes('pop') && h.includes('mph')),
    popPercentile: findCol(['pop percentile'])
  };

  console.log(`\nFound ${Object.values(columnMap).filter(v => v >= 0).length} columns out of ${Object.keys(columnMap).length} total fields`);

  if (columnMap.paddleName === -1) {
    console.error('\nError: Could not find Paddle Name column');
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
      paddleName: getValue(values, columnMap.paddleName),
      brand: getValue(values, columnMap.brand),
      price: getValue(values, columnMap.price),
      discountCode: getValue(values, columnMap.discountCode),
      linkToPaddle: getValue(values, columnMap.linkToPaddle),
      yearReleased: getValue(values, columnMap.yearReleased),
      shape: getValue(values, columnMap.shape),
      faceMaterial: getValue(values, columnMap.faceMaterial),
      gritType: getValue(values, columnMap.gritType),
      buildType: getValue(values, columnMap.buildType),
      paddleType: getValue(values, columnMap.paddleType),
      coreThickness: getValue(values, columnMap.coreThickness),
      gripLength: getValue(values, columnMap.gripLength),
      gripSize: getValue(values, columnMap.gripSize),
      weight: getValue(values, columnMap.weight),
      swingweight: getValue(values, columnMap.swingweight),
      swingweightPercentile: getValue(values, columnMap.swingweightPercentile),
      twistweight: getValue(values, columnMap.twistweight),
      twistweightPercentile: getValue(values, columnMap.twistweightPercentile),
      balancePoint: getValue(values, columnMap.balancePoint),
      spinRating: getValue(values, columnMap.spinRating),
      spinRPM: getValue(values, columnMap.spinRPM),
      powerMPH: getValue(values, columnMap.powerMPH),
      powerPercentile: getValue(values, columnMap.powerPercentile),
      popMPH: getValue(values, columnMap.popMPH),
      popPercentile: getValue(values, columnMap.popPercentile)
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
  // Look for CSV file
  const possiblePaths = [
    './pickleballeffect.csv',
    './Grid view.csv',
    './grid_view.csv',
    '/Users/shawnhong/Downloads/Grid view.csv',
    '/Users/shawnhong/Downloads/pickleballeffect.csv'
  ];

  let csvPath: string | null = null;

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }

  if (!csvPath) {
    // Check Downloads for any recent Grid view CSV
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const downloadsPath = path.join(homeDir, 'Downloads');

    if (fs.existsSync(downloadsPath)) {
      const files = fs.readdirSync(downloadsPath);
      const csvFiles = files.filter(f => (f.toLowerCase().includes('grid') || f.toLowerCase().includes('pickleballeffect')) && f.endsWith('.csv'));

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
    console.log('\nPlease download the PickleballEffect CSV and either:');
    console.log('1. Save it as "pickleballeffect.csv" in the project root directory');
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
  const outputPath = path.join(outputDir, 'pickleballeffect_paddle_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${outputPath}`);

  // Show sample
  console.log('\nSample records:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  console.log(`\n✓ Complete! Successfully processed ${data.length} paddles`);
}

// Run
main();
