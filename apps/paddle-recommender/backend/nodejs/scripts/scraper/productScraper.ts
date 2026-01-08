import puppeteer, { Page } from 'puppeteer';
import { ProductListing } from './listingScraper.js';

export interface ProductSpecs {
  averageWeight?: number | string;
  weightRange?: string;
  gripCircumference?: number | string;
  gripType?: string;
  gripLength?: number | string;
  paddleLength?: number | string;
  paddleWidth?: number | string;
  coreThickness?: number | string;
  core?: string;
  surface?: string;
  shape?: string;
  edgeGuard?: string;
  manufacturer?: string;
  madeIn?: string;
  approvals?: string;
  usapApproved?: string;
  description?: string;
}

export interface ProductWithSpecs extends ProductListing, ProductSpecs {
  error?: string;
}

interface ScrapedSpecs {
  specs: Record<string, string>;
  description: string;
}

/**
 * Parses a spec value and extracts the numeric part
 */
function parseSpecValue(value: string): number | string | null {
  if (!value) return null;
  const cleaned = value.trim();
  // Extract numbers (including decimals)
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : cleaned;
}

/**
 * Scrapes detailed specs from a product page
 */
export async function scrapeProductDetails(page: Page, productUrl: string): Promise<ProductSpecs | null> {
  console.log(`Scraping product: ${productUrl}`);

  try {
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to click on the Specifications tab
    try {
      const specsTabClicked = await page.evaluate(() => {
        // Try to find the Specifications tab
        const elements = Array.from(document.querySelectorAll('button, a, [role="tab"], li[class*="tab"]'));
        const specsTab = elements.find((el: Element) =>
          el.textContent?.toLowerCase().includes('specification') ||
          el.textContent?.toLowerCase().includes('specs')
        );

        if (specsTab && specsTab instanceof HTMLElement) {
          specsTab.click();
          return true;
        }
        return false;
      });

      if (specsTabClicked) {
        // Wait for the tab content to appear
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to wait for tab-inner to be visible
        try {
          await page.waitForSelector('.tab-inner', { timeout: 3000 });
        } catch (e) {
          // Continue anyway
        }
      }
    } catch (e) {
      console.log('Could not click specifications tab, will try to scrape anyway');
    }

    // Extract specifications
    const specs = await page.evaluate((): ScrapedSpecs => {
      const specsData: Record<string, string> = {};

      // Look for all .tab-inner divs (there might be multiple for different tabs)
      const tabInners = document.querySelectorAll('.tab-inner');

      // Try each tab-inner to find the one with "Technical Specifications"
      tabInners.forEach((tabInner) => {
        const text = tabInner.textContent || '';

        if (text.includes('Technical Specifications') || text.includes('Average Weight')) {
          // Split by <br> tags and parse each line
          const lines = tabInner.innerHTML
            .split(/<br\s*\/?>/i)
            .map(line => line.replace(/<[^>]*>/g, '').trim()) // Remove any remaining HTML tags
            .filter(line => line.length > 0 && line.includes(':'));

          lines.forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
              const label = line.substring(0, colonIndex).trim();
              const value = line.substring(colonIndex + 1).trim();
              if (label && value) {
                specsData[label] = value;
              }
            }
          });
        }
      });

      // Fallback: Try to find specs in table format
      if (Object.keys(specsData).length === 0) {
        const specElements = document.querySelectorAll(
          '.product-specs tr, .specifications tr, .spec-row, table tr'
        );

        specElements.forEach((row: Element) => {
          try {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const label = cells[0].textContent?.trim().replace(':', '') || '';
              const value = cells[1].textContent?.trim() || '';

              if (label && value) {
                specsData[label] = value;
              }
            }
          } catch (e) {
            // Skip malformed rows
          }
        });
      }

      // Get product description
      const descriptionEl = document.querySelector('.product-description, [class*="product-desc"], .description');
      const description = descriptionEl ? descriptionEl.textContent?.trim() || '' : '';

      return {
        specs: specsData,
        description: description.substring(0, 1000) // Limit description length
      };
    });

    // Map the specs to our database schema
    const mappedSpecs = mapSpecsToSchema(specs.specs);

    return {
      ...mappedSpecs,
      description: specs.description
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error scraping ${productUrl}:`, errorMessage);
    return null;
  }
}

/**
 * Maps scraped specs to our database schema
 */
function mapSpecsToSchema(specs: Record<string, string>): ProductSpecs {
  // Common field mappings (case-insensitive)
  const fieldMap: Record<string, keyof ProductSpecs> = {
    'average weight': 'averageWeight',
    'weight average': 'averageWeight',
    'weight': 'averageWeight',
    'weight range': 'weightRange',
    'grip circumference': 'gripCircumference',
    'grip size': 'gripCircumference',
    'grip style': 'gripType',
    'grip type': 'gripType',
    'grip manufacturer': 'gripType', // Store grip manufacturer in gripType for now
    'handle length': 'gripLength',
    'paddle length': 'paddleLength',
    'length': 'paddleLength',
    'paddle width': 'paddleWidth',
    'width': 'paddleWidth',
    'core thickness': 'coreThickness',
    'thickness': 'coreThickness',
    'core material': 'core',
    'core': 'core',
    'paddle face': 'surface',
    'face material': 'surface',
    'surface': 'surface',
    'shape': 'shape',
    'edge guard': 'edgeGuard',
    'manufacturer': 'manufacturer',
    'made in': 'madeIn',
    'made in china': 'madeIn',
    'approvals': 'approvals',
    'certifications': 'approvals',
    'usap approved': 'usapApproved',
    'balance point': 'shape', // Store as additional info
    'twist weight': 'shape',  // Store as additional info
    'swing weight': 'shape'   // Store as additional info
  };

  const mapped: ProductSpecs = {};

  // Map specs to our schema
  for (const [key, value] of Object.entries(specs)) {
    const normalizedKey = key.toLowerCase().trim();
    const mappedKey = fieldMap[normalizedKey];

    if (mappedKey) {
      (mapped as any)[mappedKey] = value;
    }
  }

  // Parse numeric values
  if (mapped.averageWeight) {
    const parsed = parseSpecValue(mapped.averageWeight as string);
    if (parsed !== null) mapped.averageWeight = parsed;
  }
  if (mapped.gripCircumference) {
    const parsed = parseSpecValue(mapped.gripCircumference as string);
    if (parsed !== null) mapped.gripCircumference = parsed;
  }
  if (mapped.gripLength) {
    const parsed = parseSpecValue(mapped.gripLength as string);
    if (parsed !== null) mapped.gripLength = parsed;
  }
  if (mapped.paddleLength) {
    const parsed = parseSpecValue(mapped.paddleLength as string);
    if (parsed !== null) mapped.paddleLength = parsed;
  }
  if (mapped.paddleWidth) {
    const parsed = parseSpecValue(mapped.paddleWidth as string);
    if (parsed !== null) mapped.paddleWidth = parsed;
  }
  if (mapped.coreThickness) {
    const parsed = parseSpecValue(mapped.coreThickness as string);
    if (parsed !== null) mapped.coreThickness = parsed;
  }

  return mapped;
}

/**
 * Scrapes multiple product pages with concurrency control
 */
export async function scrapeProductsBatch(products: ProductListing[], concurrency: number = 4): Promise<ProductWithSpecs[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results: ProductWithSpecs[] = [];

  // Process in batches
  for (let i = 0; i < products.length; i += concurrency) {
    const batch = products.slice(i, i + concurrency);

    console.log(`\nProcessing batch ${Math.floor(i / concurrency) + 1} (${i + 1}-${Math.min(i + concurrency, products.length)} of ${products.length})`);

    const batchPromises = batch.map(async (product) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Enable console logging from page (optional, for debugging)
      // page.on('console', msg => console.log(`PAGE [${product.name.substring(0, 20)}]:`, msg.text()));

      try {
        const specs = await scrapeProductDetails(page, product.url);
        return {
          ...product,
          ...specs
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error scraping ${product.url}:`, errorMessage);
        return {
          ...product,
          error: errorMessage
        };
      } finally {
        await page.close();
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches
    if (i + concurrency < products.length) {
      console.log('Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  await browser.close();

  return results;
}
