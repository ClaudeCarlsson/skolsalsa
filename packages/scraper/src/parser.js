import * as cheerio from 'cheerio';

/**
 * Parse the SALSA table HTML (page 165) into structured data.
 *
 * Table columns (from actual SIRIS HTML):
 * 1. År (Year) - VERKSAMHETSAR
 * 2. Kommun - KOMMUNNAMN
 * 3. Skolenhet - SKOLNAMN
 * 4. Huvudman - HUVUDMAN
 * 5. Föräldrars utbildningsnivå - FORALDR_UTB
 * 6. Andel (%) nyinvandrade - AND_UTL_BAKGR
 * 7. Andel (%) födda utomlands - AND_FODD_UTOML
 * 8. Andel (%) med utländsk bakgrund - AND_FODD_SVE
 * 9. Andel (%) pojkar - ANDEL_POJKAR
 * 10. Faktiskt värde godkända betyg (F) - VER_AND_UPPN_MALEN
 * 11. Modellberäknat godkända betyg (B) - BER_AND_UPPN_MALEN
 * 12. Residual godkända betyg (R=F-B) - SAL_AND_UPPN_MALEN
 * 13. Faktiskt meritvärde (F) - VER_MERITVARDE
 * 14. Modellberäknat meritvärde (B) - BER_MERITVARDE
 * 15. Residual meritvärde (R=F-B) - SAL_MERITVARDE
 */

const SUPPRESSION_MARKERS = new Set(['..', '...', '-', '–', ' - ']);

function parseNum(val) {
  if (!val || SUPPRESSION_MARKERS.has(val.trim()) || val.trim() === '') return null;
  // Swedish: comma = decimal separator, period/space = thousands separator
  const cleaned = val.replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parsePercent(val) {
  const num = parseNum(val);
  if (num !== null && (num < 0 || num > 100)) {
    return null; // Out of valid percentage range
  }
  return num;
}

export function parseTablePage(html) {
  const $ = cheerio.load(html);
  const results = [];

  const table = $('table.report-standard-alternatingrowcolors');
  if (table.length === 0) {
    return results;
  }

  table.find('tr.highlight-row').each((_, row) => {
    const cells = [];
    $(row).find('td.data').each((_, td) => {
      cells.push($(td).text().trim());
    });

    if (cells.length < 15) return;

    const year = parseNum(cells[0]);
    if (!year) return;

    const suppressed = cells.slice(4).some(c => SUPPRESSION_MARKERS.has(c.trim()));

    results.push({
      year: Math.round(year),
      municipality_name: cells[1],
      school_name: cells[2],
      huvudman: cells[3],
      pct_parents_higher_ed: parseNum(cells[4]),
      pct_newly_arrived: parsePercent(cells[5]),
      pct_born_abroad: parsePercent(cells[6]),
      pct_foreign_background: parsePercent(cells[7]),
      pct_boys: parsePercent(cells[8]),
      pct_eligible_gymnasiet: parsePercent(cells[9]),
      predicted_eligible: parsePercent(cells[10]),
      residual_eligible: parseNum(cells[11]),
      avg_merit_value: parseNum(cells[12]),
      predicted_merit_value: parseNum(cells[13]),
      residual_merit: parseNum(cells[14]),
      data_suppressed: suppressed ? 1 : 0,
    });
  });

  return results;
}
