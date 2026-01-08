# Pickleball Central Scraper

A TypeScript + Puppeteer-based web scraper for collecting paddle data from Pickleball Central.

## Features

- Scrapes all paddle listings from Pickleball Central
- Extracts detailed specifications from each product page
- Handles pagination (6 pages of products)
- Rate limiting and concurrent request control
- Exports data to JSON and CSV formats
- Written in TypeScript with full type safety

## Installation

```bash
npm install
```

## Usage

Run the scraper (TypeScript):

```bash
npm run scrape
```

Build to JavaScript:

```bash
npm run build
```

Run compiled version:

```bash
npm run scrape:prod
```

Run with debugging:

```bash
npm run scrape:debug
```

## Output

The scraper creates an `output/` directory with the following files:

- `products-list.json` - Basic product info from listing pages
- `products-complete.json` - Full product data with specifications
- `products-complete.csv` - CSV export of all product data

## Data Extracted

### From Listing Pages
- Product URL
- Product name
- Brand
- Price
- Image URL

### From Product Detail Pages
- Average weight
- Weight range
- Grip circumference
- Grip type/style
- Handle/grip length
- Paddle length
- Paddle width
- Core thickness
- Core material
- Surface/face material
- Shape
- Edge guard
- Manufacturer
- Approvals (USAP, etc.)

## Configuration

You can modify the scraper behavior by editing `index.ts`:

- **Total pages**: Change the number in `scrapeAllListings(6)`
- **Concurrency**: Change the number in `scrapeProductsBatch(products, 3)`
- **Delays**: Adjust `setTimeout` values in the scraper files

## TypeScript

The scraper is written in TypeScript with full type definitions for:
- Product listings (`ProductListing`)
- Product specifications (`ProductSpecs`)
- Combined product data (`ProductWithSpecs`)

TypeScript configuration is in `tsconfig.json` with strict mode enabled.

## Rate Limiting

The scraper includes:
- 2 second delay between listing pages
- 3 second delay between product batches
- 3 concurrent product page requests max

## Troubleshooting

If the scraper fails to find products:

1. Check if the website structure has changed
2. Try running in non-headless mode by changing `headless: true` to `headless: false` in the scraper files
3. Increase timeout values if pages are loading slowly
4. Check the console for specific error messages
