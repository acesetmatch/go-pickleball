import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface PaddleData {
  [key: string]: string | undefined;
}

async function scrapeNotionDatabase() {
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Loading Notion page...');
  const notionUrl = 'https://thepickleballstudio.notion.site/5bdf3ee752c940eba864a81bc3281164?v=a5170d43e5ab4573b18f48c363cce7ec';

  await page.goto(notionUrl, {
    waitUntil: 'networkidle2',
    timeout: 90000
  });

  console.log('Waiting for Notion database to render...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Take a screenshot for debugging
  await page.screenshot({ path: 'notion-debug.png', fullPage: true });
  console.log('Screenshot saved to notion-debug.png');

  // Try to detect and extract the table data
  const data = await page.evaluate(() => {
    const results: any[] = [];

    // Notion uses specific class names for database views
    // Try multiple approaches to find the table

    // Approach 1: Look for table rows
    const rows = document.querySelectorAll('[data-block-id]');
    console.log(`Found ${rows.length} potential row elements`);

    // Approach 2: Look for table cells and extract text
    const allText = document.body.innerText;
    const lines = allText.split('\n').filter(line => line.trim().length > 0);

    console.log(`Found ${lines.length} lines of text`);

    // Try to find table structure
    const tableElements = document.querySelectorAll('table, [role="table"], [class*="table"]');
    console.log(`Found ${tableElements.length} table elements`);

    if (tableElements.length > 0) {
      tableElements.forEach(table => {
        const rows = table.querySelectorAll('tr, [role="row"]');
        rows.forEach((row, idx) => {
          const cells = row.querySelectorAll('td, th, [role="cell"], [role="columnheader"]');
          const rowData = Array.from(cells).map(cell => cell.textContent?.trim() || '');
          if (rowData.length > 0 && rowData.some(v => v.length > 0)) {
            results.push(rowData);
          }
        });
      });
    }

    // Fallback: Return raw text for analysis
    if (results.length === 0) {
      return {
        type: 'raw_text',
        lines: lines.slice(0, 100),
        bodyText: allText.slice(0, 5000)
      };
    }

    return {
      type: 'table_data',
      data: results
    };
  });

  console.log('\nExtraction result:', JSON.stringify(data, null, 2).slice(0, 500));

  // Save debug output
  fs.writeFileSync('./notion_debug.json', JSON.stringify(data, null, 2));
  console.log('Debug data saved to notion_debug.json');

  await browser.close();

  return data;
}

async function main() {
  try {
    const rawData = await scrapeNotionDatabase();

    if (rawData.type === 'raw_text') {
      console.log('\n⚠️  Could not automatically extract table data.');
      console.log('The Notion page may require manual export or API access.');
      console.log('\nOptions:');
      console.log('1. Ask the owner to share the Notion database with you');
      console.log('2. Ask the owner to export as CSV');
      console.log('3. Use Notion API if you have access');
      console.log('\nRaw text preview saved to notion_debug.json for analysis.');
      return;
    }

    // Process table data
    if (rawData.type === 'table_data' && rawData.data && rawData.data.length > 0) {
      const headers = rawData.data[0];
      const rows = rawData.data.slice(1);

      const paddleData = rows.map((row: string[]) => {
        const obj: PaddleData = {};
        headers.forEach((header: string, idx: number) => {
          obj[header] = row[idx];
        });
        return obj;
      });

      console.log(`\n✓ Extracted ${paddleData.length} records`);

      // Save to JSON
      const outputDir = './output';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, 'pickleballstudio_paddle_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(paddleData, null, 2));
      console.log(`Data saved to ${outputPath}`);

      // Show sample
      console.log('\nSample records:');
      console.log(JSON.stringify(paddleData.slice(0, 3), null, 2));
    }

  } catch (error) {
    console.error('Error scraping Notion:', error);
    process.exit(1);
  }
}

main();
