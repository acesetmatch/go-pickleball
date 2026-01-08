import * as fs from 'fs';
import * as path from 'path';

interface PaddleData {
  company?: string;
  paddle?: string;
  price?: string;
  swingWeight?: string;
  twistWeight?: string;
  balance?: string;
  myPaddlesWeight?: string;
  coreThickness?: string;
  gripLength?: string;
  gripThickness?: string;
  rpm?: string;
  shape?: string;
  faceMaterial?: string;
  coreMaterial?: string;
  youtubeReview?: string;
  linkToPurchase?: string;
  discountCode?: string;
  ignore?: string;
  id?: string;
  grams?: string;
  codes?: string;
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

  console.log('CSV Headers found:', headers.join(', '));

  // Create a mapping function to find column index
  const findCol = (searchTerms: string[]) => {
    return headers.findIndex(h => searchTerms.some(term => h.includes(term)));
  };

  // Find all column indices
  const columnMap = {
    company: findCol(['company']),
    paddle: findCol(['paddle']),
    price: findCol(['price']),
    swingWeight: findCol(['swing weight']),
    twistWeight: findCol(['twist weight']),
    balance: findCol(['balance']),
    myPaddlesWeight: findCol(['my paddles weight']),
    coreThickness: findCol(['core thickness']),
    gripLength: findCol(['grip length']),
    gripThickness: findCol(['grip thickness']),
    rpm: findCol(['rpm']),
    shape: findCol(['shape']),
    faceMaterial: findCol(['face material']),
    coreMaterial: findCol(['core material']),
    youtubeReview: findCol(['youtube review']),
    linkToPurchase: findCol(['link to purchase']),
    discountCode: findCol(['discount code']),
    ignore: findCol(['ignore']),
    id: findCol(['id']),
    grams: findCol(['grams']),
    codes: findCol(['codes'])
  };

  console.log(`\nFound ${Object.values(columnMap).filter(v => v >= 0).length} columns out of ${Object.keys(columnMap).length} total fields`);

  if (columnMap.paddle === -1) {
    console.error('\nError: Could not find Paddle column');
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
      paddle: getValue(values, columnMap.paddle),
      price: getValue(values, columnMap.price),
      swingWeight: getValue(values, columnMap.swingWeight),
      twistWeight: getValue(values, columnMap.twistWeight),
      balance: getValue(values, columnMap.balance),
      myPaddlesWeight: getValue(values, columnMap.myPaddlesWeight),
      coreThickness: getValue(values, columnMap.coreThickness),
      gripLength: getValue(values, columnMap.gripLength),
      gripThickness: getValue(values, columnMap.gripThickness),
      rpm: getValue(values, columnMap.rpm),
      shape: getValue(values, columnMap.shape),
      faceMaterial: getValue(values, columnMap.faceMaterial),
      coreMaterial: getValue(values, columnMap.coreMaterial),
      youtubeReview: getValue(values, columnMap.youtubeReview),
      linkToPurchase: getValue(values, columnMap.linkToPurchase),
      discountCode: getValue(values, columnMap.discountCode),
      ignore: getValue(values, columnMap.ignore),
      id: getValue(values, columnMap.id),
      grams: getValue(values, columnMap.grams),
      codes: getValue(values, columnMap.codes)
    };

    // Only add if we have at least the paddle name
    if (rowData.paddle) {
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
    './pickleballstudio.csv',
    '/Users/shawnhong/Downloads/pickleballstudio.csv'
  ];

  let csvPath: string | null = null;

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvPath = p;
      break;
    }
  }

  if (!csvPath) {
    // Check Downloads for any recent pickleballstudio CSV
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const downloadsPath = path.join(homeDir, 'Downloads');

    if (fs.existsSync(downloadsPath)) {
      const files = fs.readdirSync(downloadsPath);
      const csvFiles = files.filter(f => f.toLowerCase().includes('pickleballstudio') && f.endsWith('.csv'));

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
    console.log('\nPlease download the Pickleball Studio CSV and either:');
    console.log('1. Save it as "pickleballstudio.csv" in the project root directory');
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
  const outputPath = path.join(outputDir, 'pickleballstudio_paddle_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${outputPath}`);

  // Show sample
  console.log('\nSample records:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  console.log(`\n✓ Complete! Successfully processed ${data.length} paddles`);
}

// Run
main();
