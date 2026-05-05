import { readFileSync, writeFileSync } from 'node:fs';
import { formatWithChapters } from './formatWithChapters';

const [formattedJsonPath, infoJsonPath, outputMdPath] = process.argv.slice(2);
if (!formattedJsonPath || !outputMdPath) {
  console.error('Usage: step4.ts <formatted_json_path> <info_json_path_or_empty> <output_md_path>');
  process.exit(1);
}

const items = JSON.parse(readFileSync(formattedJsonPath, 'utf-8'));
let chapters: any[] = [];
if (infoJsonPath && infoJsonPath !== '""' && infoJsonPath !== "''") {
  const infoData = JSON.parse(readFileSync(infoJsonPath, 'utf-8'));
  chapters = infoData.chapters ?? infoData ?? [];
}

const md = formatWithChapters(items, chapters);
writeFileSync(outputMdPath, md);
console.log('Step 4 done');
