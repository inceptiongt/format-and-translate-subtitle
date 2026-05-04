import { readFileSync, writeFileSync } from 'node:fs';
import { expandCompactFlags } from './calcuTimestampByFlag';

const [indexedJsonPath, flagMdPath, outputPath] = process.argv.slice(2);
if (!indexedJsonPath || !flagMdPath || !outputPath) {
  console.error('Usage: expandFlagFull.ts <indexed_json> <flag_md> <output_full_md>');
  process.exit(1);
}

const items = JSON.parse(readFileSync(indexedJsonPath, 'utf-8'));
const flagMd = readFileSync(flagMdPath, 'utf-8');
const fullMd = expandCompactFlags(items, flagMd);
writeFileSync(outputPath, fullMd);
console.log('Done:', outputPath);
