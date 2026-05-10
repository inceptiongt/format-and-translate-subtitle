import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { formatAndAddIndex, cleanSubtitleItems } from './formatAndAddIndex';

const [enJsonPath, outputDir] = process.argv.slice(2);
if (!enJsonPath || !outputDir) {
  console.error('Usage: step1.ts <en_json_path> <output_dir>');
  process.exit(1);
}

const data = JSON.parse(readFileSync(enJsonPath, 'utf-8'));
const events = data.events ?? data;

const md = formatAndAddIndex(events);
writeFileSync(outputDir + '/1.en.indexed.md', md);

const cleaned = cleanSubtitleItems(events);
writeFileSync(outputDir + '/1.en.indexed.json', JSON.stringify(cleaned, null, 2));

console.log('Step 1 done:', md.split('\n').filter(l => l.startsWith('[')).length, 'lines');
