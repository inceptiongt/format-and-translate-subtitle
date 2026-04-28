import { readFileSync, writeFileSync } from 'node:fs';
import { calcuTimestampByFlag } from './calcuTimestampByFlag';

const [indexedJsonPath, flagMdPath, outputJsonPath] = process.argv.slice(2);
if (!indexedJsonPath || !flagMdPath || !outputJsonPath) {
  console.error('Usage: step3.ts <indexed_json_path> <flag_md_path> <output_json_path>');
  process.exit(1);
}

const items = JSON.parse(readFileSync(indexedJsonPath, 'utf-8'));
const flaggedMd = readFileSync(flagMdPath, 'utf-8');
const result = calcuTimestampByFlag(items, flaggedMd);

writeFileSync(outputJsonPath, JSON.stringify(result, null, 2));
console.log('Step 3 done:', result.length, 'sentences');
