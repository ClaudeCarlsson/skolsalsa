/**
 * Scrape the Om SALSA (About SALSA) page and save as reference.
 */
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

async function main() {
  console.log('Scraping Om SALSA page...');

  const resp = await fetch('https://siris.skolverket.se/siris/f?p=SIRIS:172:0::NO:::', {
    headers: {
      'User-Agent': 'SkolSalsa-SALSA-Scraper/1.0 (educational research)',
      'Accept-Language': 'sv-SE,sv;q=0.9',
    },
  });

  const html = await resp.text();
  const $ = cheerio.load(html);

  // Extract the main content
  const content = $('#mainContent').text().trim() || $('body').text().trim();

  // Save raw HTML
  mkdirSync(join(DATA_DIR, 'reference'), { recursive: true });
  writeFileSync(join(DATA_DIR, 'reference', 'om-salsa.html'), html);

  // Save extracted text
  const cleanText = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  writeFileSync(join(DATA_DIR, 'reference', 'om-salsa.txt'), cleanText);

  console.log(`Saved Om SALSA page (${html.length} bytes HTML, ${cleanText.length} bytes text)`);

  // Also scrape the main SIRIS landing page
  console.log('Scraping SIRIS main page...');
  const mainResp = await fetch('https://siris.skolverket.se/siris/f?p=SIRIS:1:0::NO:::', {
    headers: {
      'User-Agent': 'SkolSalsa-SALSA-Scraper/1.0 (educational research)',
    },
  });
  const mainHtml = await mainResp.text();
  writeFileSync(join(DATA_DIR, 'reference', 'siris-main.html'), mainHtml);
  console.log(`Saved SIRIS main page (${mainHtml.length} bytes)`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
