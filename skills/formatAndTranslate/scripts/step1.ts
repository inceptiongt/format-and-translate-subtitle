import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { formatAndAddIndex, cleanSubtitleItems } from './formatAndAddIndex';

const [enJsonPath, debugDir] = process.argv.slice(2);
if (!enJsonPath || !debugDir) {
  console.error('Usage: step1.ts <en_json_path> <debug_dir>');
  process.exit(1);
}

mkdirSync(debugDir, { recursive: true });

const data = JSON.parse(readFileSync(enJsonPath, 'utf-8'));
const events = data.events ?? data;

const md = formatAndAddIndex(events);
writeFileSync(debugDir + '/1.en.indexed.md', md);

const cleaned = cleanSubtitleItems(events);
writeFileSync(debugDir + '/1.en.indexed.json', JSON.stringify(cleaned, null, 2));

console.log('Step 1 done:', md.split('\n').filter(l => l.startsWith('[')).length, 'lines');
