import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

function backupIfExists(path: string): void {
  if (existsSync(path)) renameSync(path, path + '.back');
}

const [mainFlagMdPath, partFlagMdPath, outputPath] = process.argv.slice(2);
if (!mainFlagMdPath || !partFlagMdPath || !outputPath) {
  console.error('Usage: mergePartialFlags.ts <main_flag_md> <part_flag_md> <output_flag_md>');
  process.exit(1);
}

function parseFlagMd(content: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of content.split('\n')) {
    const m = line.match(/^\[(\d+)\]/);
    if (!m) continue;
    map.set(parseInt(m[1], 10), line);
  }
  return map;
}

const mainMap = parseFlagMd(readFileSync(mainFlagMdPath, 'utf-8'));
const partMap = parseFlagMd(readFileSync(partFlagMdPath, 'utf-8'));

// Add/replace entries from part into main (keep all other main entries unchanged)
for (const [mi, line] of partMap) {
  mainMap.set(mi, line);
}

const sortedEntries = [...mainMap.entries()].sort((a, b) => a[0] - b[0]);
backupIfExists(outputPath);
writeFileSync(outputPath, sortedEntries.map(([, line]) => line).join('\n') + '\n');
console.log(`Merged ${partMap.size} entries from part. Output: ${outputPath} (${sortedEntries.length} flagged lines)`);
