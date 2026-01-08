import fs from 'fs';

const data = JSON.parse(fs.readFileSync('output/harmonized/harmonized_combined_median.json', 'utf-8'));

const breadPaddles = data.filter((p: any) => p.company.toLowerCase().includes('bread'));

console.log('Total bread paddles:', breadPaddles.length);
console.log('\nBy company name:');
const byCompany = breadPaddles.reduce((acc: any, p: any) => {
  acc[p.company] = (acc[p.company] || 0) + 1;
  return acc;
}, {});
console.log(byCompany);

console.log('\nAll entries:');
breadPaddles.forEach((p: any) => {
  console.log(`  ${p.company} - ${p.paddleName} (sources: ${p.sources.join(', ')}, coreThickness: ${p.coreThickness})`);
});
