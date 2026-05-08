import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

function backupIfExists(path: string): void {
  if (existsSync(path)) renameSync(path, path + '.back');
}

const [flagFullMdPath, indexedMdPath, outputPath] = process.argv.slice(2);
if (!flagFullMdPath || !indexedMdPath || !outputPath) {
  console.error('Usage: extractPartialIndexed.ts <flag_full_md> <indexed_md> <output_part_md>');
  process.exit(1);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

const flagFullMd = readFileSync(flagFullMdPath, 'utf-8');
const indexedMd = readFileSync(indexedMdPath, 'utf-8');

// Collect mi indices from problematic sentences
const miSet = new Set<number>();

for (const line of flagFullMd.split('\n')) {
  // Format: [n:+m1+m2+-m3] sentence_text
  const m = line.match(/^\[\d+:([^\]]+)\]\s*(.*)/);
  if (!m) continue;
  const sources = m[1];
  const sentenceText = m[2];

  const hasUnmatched = /\+-\d+/.test(sources);
  const tooLong = wordCount(sentenceText) > 40;

  if (!hasUnmatched && !tooLong) continue;

  const allMi = sources.match(/\+-?(\d+)/g) ?? [];
  for (const token of allMi) {
    miSet.add(parseInt(token.replace(/^\+-?/, ''), 10));
  }
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

backupIfExists(outputPath);
writeFileSync(outputPath, lines.map(l => l.line).join('\n') + '\n');
console.log(`Extracted ${lines.length} lines (${miSet.size} mi indices) to ${outputPath}`);
