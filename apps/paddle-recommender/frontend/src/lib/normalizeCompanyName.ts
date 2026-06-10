export function normalizeCompanyName(company: string): string {
  return company
    .toLowerCase()
    .trim()
    .replace(/[-\s](co|company|inc|llc|corporation)\.?$/i, '')
    .replace(/\s*&\s*/g, '')
    .replace(/\s+and\s+/g, '')
    .replace(/[\s\-\._]/g, '')
    .trim();
}
