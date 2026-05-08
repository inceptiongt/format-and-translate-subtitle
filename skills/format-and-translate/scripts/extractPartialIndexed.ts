import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

function backupIfExists(path: string): void {
  if (existsSync(path)) renameSync(path, path + '.back');
}

const [analyJsonPath, indexedMdPath, outputPath] = process.argv.slice(2);
if (!analyJsonPath || !indexedMdPath || !outputPath) {
  console.error('Usage: extractPartialIndexed.ts <analy_json> <indexed_md> <output_part_md>');
  process.exit(1);
}

const analy = JSON.parse(readFileSync(analyJsonPath, 'utf-8'));
const indexedMd = readFileSync(indexedMdPath, 'utf-8');

// Collect mi indices from unmatched entries and long sentences
const miSet = new Set<number>();

for (const mi of analy.unmatchedMiList as number[]) miSet.add(mi);
for (const s of analy.longSentences as Array<{ miList: number[] }>) {
  for (const mi of s.miList) miSet.add(mi);
}

if (miSet.size === 0) {
  backupIfExists(outputPath);
  writeFileSync(outputPath, '');
  console.log('No problematic sentences found. Output is empty.');
  process.exit(0);
}

// Extract matching lines from indexed_md, sorted by mi
const lines: { mi: number; line: string }[] = [];
for (const line of indexedMd.split('\n')) {
  const m = line.match(/^\[(\d+)\]/);
  if (!m) continue;
  const mi = parseInt(m[1], 10);
  if (miSet.has(mi)) {
    lines.push({ mi, line });
  }
}
lines.sort((a, b) => a.mi - b.mi);

const outputLines: string[] = [];
for (let i = 0; i < lines.length; i++) {
  if (i > 0 && lines[i].mi !== lines[i - 1].mi + 1) outputLines.push('');
  outputLines.push(lines[i].line);
}

backupIfExists(outputPath);
writeFileSync(outputPath, outputLines.join('\n') + '\n');
console.log(`Extracted ${lines.length} lines (${miSet.size} mi indices) to ${outputPath}`);
