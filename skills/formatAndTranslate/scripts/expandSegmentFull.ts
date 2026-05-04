import { readFileSync, writeFileSync } from 'node:fs';
import { applySplits, parseCompactSplitMd } from './calcuTimestampBySegmentation';
import type { FormattedSubtitleItem } from './calcuTimestampBySegmentation';

const [formattedJsonPath, zhMdPath, segMdPath, outputPath] = process.argv.slice(2);
if (!formattedJsonPath || !zhMdPath || !segMdPath || !outputPath) {
  console.error('Usage: expandSegmentFull.ts <formatted_json> <zh_md> <segment_md> <output_full_md>');
  process.exit(1);
}

const formattedJson: FormattedSubtitleItem[] = JSON.parse(readFileSync(formattedJsonPath, 'utf-8'));

const zhLines = new Map<number, string>();
for (const line of readFileSync(zhMdPath, 'utf-8').split('\n')) {
  const match = line.match(/^\[(\d+)\]\s*(.+)$/);
  if (match) zhLines.set(parseInt(match[1], 10), match[2]);
}

const descriptors = parseCompactSplitMd(readFileSync(segMdPath, 'utf-8'));

const resultLines: string[] = [];

formattedJson.forEach((item, n) => {
  const enText = item.segs.map(s => s.utf8).join('');
  const zhText = zhLines.get(n) ?? '';
  const desc = descriptors.get(n);

  const enParts = desc && desc.enSplits.length > 0
    ? applySplits(enText, desc.enSplits)
    : [enText.trim()];

  let zhParts: string[];
  if (desc && (desc.zhSplits.length > 0 || desc.zhCopyCount > 0)) {
    zhParts = applySplits(zhText, desc.zhSplits);
    const lastZh = zhParts[zhParts.length - 1] ?? zhText.trim();
    for (let i = 0; i < desc.zhCopyCount; i++) zhParts.push(lastZh);
  } else {
    zhParts = [zhText.trim()];
  }

  const count = Math.max(enParts.length, zhParts.length);
  if (count === 1) {
    resultLines.push(`[${n}.1:en] ${enParts[0] ?? ''}`);
    resultLines.push(`[${n}.1:zh] ${zhParts[0] ?? ''}`);
  } else {
    for (let m = 1; m <= count; m++) {
      resultLines.push(`[${n}.${m}:en] ${enParts[m - 1] ?? ''}`);
      resultLines.push(`[${n}.${m}:zh] ${zhParts[m - 1] ?? ''}`);
    }
  }
});

writeFileSync(outputPath, resultLines.join('\n'));
console.log('Done:', outputPath);
