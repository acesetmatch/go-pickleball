import fs from 'fs/promises';
import path from 'path';
import { scrapeAllListings } from './listingScraper.js';
import { scrapeProductsBatch, ProductWithSpecs } from './productScraper.js';

/**
 * Main scraper orchestrator
 */
async function main(): Promise<void> {
  console.log('🎾 Starting Pickleball Central Scraper\n');

  const startTime = Date.now();

  // Check for environment variables or command line args
  const DEBUG = process.env.DEBUG === 'true' || process.argv.includes('--debug');
  const HEADLESS = process.env.HEADLESS !== 'false' && !process.argv.includes('--no-headless');
  const TEST_MODE = process.env.TEST_MODE === 'true' || process.argv.includes('--test');
  const totalPages = TEST_MODE ? 1 : 6;

  if (DEBUG) {
    console.log('🐛 Debug mode enabled');
  }
  if (!HEADLESS) {
    console.log('👀 Running in visible browser mode');
  }
  if (TEST_MODE) {
    console.log('🧪 Test mode: scraping only 1 page\n');
  }

  try {
    // Step 1: Scrape all listing pages
    console.log('📋 Step 1: Scraping product listings...\n');
    const products = await scrapeAllListings(totalPages, { headless: HEADLESS, debug: DEBUG });

    if (products.length === 0) {
      console.error('❌ No products found. Exiting.');
      return;
    }

    console.log(`✅ Found ${products.length} products\n`);

    // Save intermediate results
    await saveJSON(products, 'products-list.json');

    // Step 2: Scrape detailed specs for each product
    console.log('🔍 Step 2: Scraping product details and specifications...\n');

    // In test mode, only scrape first 3 products
    const productsToScrape = TEST_MODE ? products.slice(0, 3) : products;
    console.log(`Scraping specs for ${productsToScrape.length} products...\n`);

    const detailedProducts = await scrapeProductsBatch(productsToScrape, 4); // 4 concurrent requests

    console.log(`\n✅ Scraped ${detailedProducts.length} product details\n`);

    // Step 3: Save results
    console.log('💾 Step 3: Saving results...\n');

    await saveJSON(detailedProducts, 'products-complete.json');
    await saveCSV(detailedProducts, 'products-complete.csv');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✨ Scraping completed!\n');
    console.log(`📊 Statistics:`);
    console.log(`   - Total products: ${detailedProducts.length}`);
    console.log(`   - Duration: ${duration} seconds`);
    console.log(`   - Output files:`);
    console.log(`     - products-list.json (listing data)`);
    console.log(`     - products-complete.json (full data)`);
    console.log(`     - products-complete.csv (full data)`);

  } catch (error) {
    console.error('❌ Error during scraping:', error);
    process.exit(1);
  }
}

/**
 * Save data as JSON
 */
async function saveJSON(data: any, filename: string): Promise<void> {
  const outputPath = path.join(process.cwd(), 'output', filename);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  console.log(`   ✓ Saved ${filename}`);
}

/**
 * Save data as CSV
 */
async function saveCSV(data: ProductWithSpecs[], filename: string): Promise<void> {
  if (data.length === 0) return;

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(escapeCSV).join(','));

  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = (item as any)[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return escapeCSV(JSON.stringify(value));
      return escapeCSV(String(value));
    });
    csvRows.push(row.join(','));
  });

  const outputPath = path.join(process.cwd(), 'output', filename);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, csvRows.join('\n'));
  console.log(`   ✓ Saved ${filename}`);
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
  if (typeof value !== 'string') return value;
  // If value contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Run the scraper
main();
