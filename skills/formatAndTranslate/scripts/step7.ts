import { readFileSync, writeFileSync } from 'node:fs';
import { calcuTimestampBySegmentation } from './calcuTimestampBySegmentation';
import { genDualSrt } from './genDualSrt';

const [formattedJsonPath, compactSplitPath, zhMdPath, outputSrtPath] = process.argv.slice(2);
if (!formattedJsonPath || !compactSplitPath || !zhMdPath || !outputSrtPath) {
  console.error('Usage: step7.ts <formatted_json_path> <compact_split_path> <zh_md_path> <output_srt_path>');
  process.exit(1);
}

const formattedJson = JSON.parse(readFileSync(formattedJsonPath, 'utf-8'));
const compactSplitMd = readFileSync(compactSplitPath, 'utf-8');

const zhLines = new Map<number, string>();
for (const line of readFileSync(zhMdPath, 'utf-8').split('\n')) {
  const match = line.match(/^\[(\d+)\]\s*(.+)$/);
  if (match) zhLines.set(parseInt(match[1], 10), match[2]);
}

const segments = calcuTimestampBySegmentation(formattedJson, compactSplitMd, zhLines);
const srt = genDualSrt(segments);

writeFileSync(outputSrtPath, srt);
console.log('Step 7 done:', segments.length, 'segments →', outputSrtPath);
