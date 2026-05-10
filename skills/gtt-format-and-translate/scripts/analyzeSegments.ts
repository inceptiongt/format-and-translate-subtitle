import { readFileSync } from 'node:fs';

const [analyJsonPath] = process.argv.slice(2);
if (!analyJsonPath) {
  console.error('Usage: analyzeSegments.ts <analy_json_path>');
  process.exit(1);
}

try {
  const analy = JSON.parse(readFileSync(analyJsonPath, 'utf-8'));
  const matchedRate = analy.all?.matchedRate ?? 0;

  console.log(`Matched Rate: ${(matchedRate * 100).toFixed(2)}%`);

  if (matchedRate < 0.8) {
    console.error('Matched rate is below 80%. Full or partial re-run suggested.');
    process.exit(1);
  } else {
    console.log('Matched rate is acceptable.');
    process.exit(0);
  }
} catch (error) {
  console.error('Error in analyzeSegments:', error);
  process.exit(1);
}
