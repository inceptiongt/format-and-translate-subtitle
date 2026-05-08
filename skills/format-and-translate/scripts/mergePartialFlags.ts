import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

const [partFlagMdPath, outputPath, statsJsonPath] = process.argv.slice(2);
if (!partFlagMdPath || !outputPath) {
  console.error('Usage: mergePartialFlags.ts <part_flag_md> <output_flag_md> [stats_json]');
  console.error('  Reads <output_flag_md>.back as base, derives flag.full.md from same dir.');
  process.exit(1);
}

const mainFlagMdPath = outputPath + '.back';
const flagFullMdPath = join(dirname(outputPath), basename(outputPath).replace('flag.md', 'flag.full.md'));

function parseFlagMd(content: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of content.split('\n')) {
    const m = line.match(/^\[(\d+)\]/);
    if (!m) continue;
    map.set(parseInt(m[1], 10), line);
  }
  return map;
}

// Collect unmatched mi: from stats JSON if provided, else re-parse flag.full.md
const unmatchedMiSet = new Set<number>();
if (statsJsonPath) {
  const stats = JSON.parse(readFileSync(statsJsonPath, 'utf-8'));
  for (const mi of stats.unmatchedMiList as number[]) unmatchedMiSet.add(mi);
} else {
  for (const line of readFileSync(flagFullMdPath, 'utf-8').split('\n')) {
    const header = line.match(/^\[\d+:([^\]]+)\]/);
    if (!header) continue;
    for (const token of header[1].match(/\+-(\d+)/g) ?? []) {
      unmatchedMiSet.add(parseInt(token.slice(2), 10));
    }
  }
}

// Base: correctly matched mi from main.back (exclude unmatched)
const mainMap = parseFlagMd(readFileSync(mainFlagMdPath, 'utf-8'));
const totalMain = mainMap.size;
for (const mi of unmatchedMiSet) mainMap.delete(mi);
const baseCount = mainMap.size;

// Add/replace with part entries
const partMap = parseFlagMd(readFileSync(partFlagMdPath, 'utf-8'));
for (const [mi, line] of partMap) mainMap.set(mi, line);

const sortedEntries = [...mainMap.entries()].sort((a, b) => a[0] - b[0]);
writeFileSync(outputPath, sortedEntries.map(([, line]) => line).join('\n') + '\n');
console.log(`main=${totalMain} unmatched_removed=${unmatchedMiSet.size} base=${baseCount} part=${partMap.size} → output=${sortedEntries.length} flagged lines`);
