import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright-core';

const TARGET_URL = 'https://www.pickleballeffect.com/pickleball-paddle-database/';

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const outputDir = path.resolve(scriptDir, 'csv');
  await ensureDir(outputDir);

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });

  const context = await browser.newContext({
    acceptDownloads: true,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  await page.goto(TARGET_URL, { waitUntil: 'commit', timeout: 45000 });
  await page.waitForSelector('iframe', { timeout: 45000 });

  const acceptButtons = page.getByRole('button', { name: /accept|agree/i });
  if (await acceptButtons.count()) {
    await acceptButtons.first().click();
  }

  const findDownloadTarget = async () => {
    const candidates = [page, ...page.frames()];
    for (const candidate of candidates) {
      const downloadButton = candidate.getByRole('button', { name: /download csv/i });
      if (await downloadButton.count()) {
        return () => downloadButton.first().click();
      }

      const downloadMenuItem = candidate.getByRole('menuitem', { name: /download csv/i });
      if (await downloadMenuItem.count()) {
        return () => downloadMenuItem.first().click();
      }

      const moreOptions = candidate
        .locator('button[aria-label*="More" i], button:has-text("...")')
        .first();
      if (await moreOptions.count()) {
        await moreOptions.click();
        if (await downloadMenuItem.count()) {
          return () => downloadMenuItem.first().click();
        }
      }
    }

    return null;
  };

  const clickDownload = await findDownloadTarget();
  if (!clickDownload) {
    throw new Error('Download CSV button not found.');
  }

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    clickDownload(),
  ]);

  const outputPath = path.join(outputDir, 'pickleballeffect.csv');
  await download.saveAs(outputPath);

  await browser.close();

  // eslint-disable-next-line no-console
  console.log(`Saved CSV to ${outputPath}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to download PickleballEffect CSV:', error);
  process.exit(1);
});
