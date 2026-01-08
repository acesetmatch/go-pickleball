import puppeteer, { Page, Browser } from 'puppeteer';

export interface ProductListing {
  url: string;
  name: string;
  brand: string;
  price: number | null;
  imageUrl: string | null;
}

export interface ScraperOptions {
  headless?: boolean;
  debug?: boolean;
}

/**
 * Scrapes the paddle listing pages to collect product URLs and basic info
 */
export async function scrapeListingPage(page: Page, pageNumber: number, options: ScraperOptions = {}): Promise<ProductListing[]> {
  const url = `https://pickleballcentral.com/paddles/all-pickleball-paddles/?page=${pageNumber}`;

  console.log(`Scraping listing page ${pageNumber}: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait a bit for dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Wait for product list to load - use the specific selector we know works
  const selector = 'li.product';
  try {
    await page.waitForSelector(selector, { timeout: 10000 });
    console.log(`✓ Found products using selector: ${selector}`);
  } catch (e) {
    console.error(`✗ Selector not found: ${selector}`);
    throw new Error('Could not find product elements on the page');
  }

  // Extract product data from the listing page
  const products = await page.evaluate(() => {
    // Use the specific selector for Pickleball Central
    const productElements = document.querySelectorAll('li.product');
    const results: Array<{
      url: string;
      name: string;
      brand: string;
      price: number | null;
      imageUrl: string | null;
    }> = [];

    productElements.forEach((element: Element) => {
      try {
        // Get product URL from the card-title link
        const linkElement = element.querySelector('h3.card-title a, .card-title a') as HTMLAnchorElement;
        if (!linkElement || !linkElement.href) return;
        const url = linkElement.href;

        // Extract product name from the link text
        let name = linkElement.textContent?.trim() || '';
        name = name.replace(/\s+/g, ' ').trim();
        if (!name) return;

        // Extract brand from card-brand or data attribute
        const article = element.querySelector('article');
        let brand = '';
        if (article) {
          brand = article.getAttribute('data-product-brand') || '';
        }
        if (!brand) {
          const brandElement = element.querySelector('.card-brand, p.card-brand');
          brand = brandElement ? brandElement.textContent?.trim() || '' : '';
        }
        if (!brand && name) {
          brand = name.split(' ')[0];
        }

        // Extract price from price--withoutTax span
        let price: number | null = null;
        const priceElement = element.querySelector('[data-product-price-without-tax], .price--withoutTax');
        if (priceElement) {
          const priceText = priceElement.textContent?.trim().replace(/[^0-9.]/g, '') || '';
          if (priceText) {
            price = parseFloat(priceText);
          }
        }

        // Extract image URL
        const imgElement = element.querySelector('img.card-image, .card-img-container img') as HTMLImageElement;
        let imageUrl = null;
        if (imgElement) {
          imageUrl = imgElement.src || imgElement.getAttribute('data-src') || null;
        }

        // Add the product
        results.push({
          url,
          name,
          brand,
          price,
          imageUrl
        });
      } catch (err) {
        // Skip malformed products
      }
    });

    return results;
  });

  console.log(`Found ${products.length} products on page ${pageNumber}`);

  return products;
}

/**
 * Scrapes all listing pages
 */
export async function scrapeAllListings(totalPages: number = 6, options: ScraperOptions = {}): Promise<ProductListing[]> {
  const browser = await puppeteer.launch({
    headless: options.headless !== false ? 'new' : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Enable console logging from the page if in debug mode
  if (options.debug) {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  }

  // Set user agent to avoid being blocked
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const allProducts: ProductListing[] = [];

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const products = await scrapeListingPage(page, pageNum, options);
      allProducts.push(...products);

      // Add delay between pages to be respectful
      if (pageNum < totalPages) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error('Error scraping listings:', error);
  } finally {
    await browser.close();
  }

  console.log(`\nTotal products found: ${allProducts.length}`);

  return allProducts;
}
