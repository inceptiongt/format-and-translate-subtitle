import { applySplits, parseCompactSplitMd } from './calcuTimestampBySegmentation';
import type { FormattedSubtitleItem } from './calcuTimestampBySegmentation';

/**
 * Expands compact segmentation into a full bilingual Markdown string for debugging.
 * This is a pure function with no side effects.
 */
export function expandSegmentFull(
  formattedJson: FormattedSubtitleItem[],
  zhMdContent: string,
  segMdContent: string
): string {
  const zhLines = new Map<number, string>();
  for (const line of zhMdContent.split('\n')) {
    const match = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (match) zhLines.set(parseInt(match[1], 10), match[2]);
  }

  const descriptors = parseCompactSplitMd(segMdContent);
  const resultLines: string[] = [];

  formattedJson.forEach((item, n) => {
    const idx = n + 1;
    const enText = item.segs.map((s) => s.utf8).join('');
    const zhText = zhLines.get(idx) ?? '';
    const desc = descriptors.get(idx);

    const enParts =
      desc && desc.enSplits.length > 0 ? applySplits(enText, desc.enSplits) : [enText.trim()];

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
      resultLines.push(`[${idx}.1:en] ${enParts[0] ?? ''}`);
      resultLines.push(`[${idx}.1:zh] ${zhParts[0] ?? ''}`);
    } else {
      for (let m = 1; m <= count; m++) {
        resultLines.push(`[${idx}.${m}:en] ${enParts[m - 1] ?? ''}`);
        resultLines.push(`[${idx}.${m}:zh] ${zhParts[m - 1] ?? ''}`);
      }
    }
    resultLines.push('');
  });

  return resultLines.join('\n');
}
