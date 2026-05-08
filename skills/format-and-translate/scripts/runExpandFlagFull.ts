import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { expandFlagFull } from './expandFlagFull';

const [indexedJsonPath, flagMdPath, outputPath] = process.argv.slice(2);
if (!indexedJsonPath || !flagMdPath || !outputPath) {
  console.error('Usage: runExpandFlagFull.ts <indexed_json> <flag_md> <output_full_md>');
  process.exit(1);
}

try {
  const items = JSON.parse(readFileSync(indexedJsonPath, 'utf-8'));
  const flagMd = readFileSync(flagMdPath, 'utf-8');
  const fullMd = expandFlagFull(items, flagMd);
  if (existsSync(outputPath)) renameSync(outputPath, outputPath + '.back');
  writeFileSync(outputPath, fullMd);
  console.log('Done:', outputPath);
} catch (error) {
  console.error('Error in runExpandFlagFull:', error);
  process.exit(1);
}
