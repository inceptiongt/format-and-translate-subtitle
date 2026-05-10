import { applySplits, parseCompactSplitMd } from './calcuTimestampBySegmentation';
import type { FormattedSubtitleItem } from './calcuTimestampBySegmentation';

export interface SegmentAnalysis {
  all: {
    matchedRate: number;
    unmatchedSegments: number;
    unmatchedSegmentsList: number[];
  };
  en: {
    totalSegments: number;
    unmatchedSegments: number;
    unmatchedSegmentsList: number[];
  };
  zh: {
    totalSegments: number;
    unmatchedSegments: number;
    unmatchedSegmentsList: number[];
  };
}

/**
 * Expands compact segmentation into a full bilingual Markdown string for outputging.
 * This is a pure function with no side effects.
 */
export function expandSegmentFull(
  formattedJson: FormattedSubtitleItem[],
  zhMdContent: string,
  segMdContent: string
): { fullMd: string; analy: SegmentAnalysis } {
  const zhLines = new Map<number, string>();
  for (const line of zhMdContent.split('\n')) {
    const match = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (match) zhLines.set(parseInt(match[1], 10), match[2]);
  }

  const descriptors = parseCompactSplitMd(segMdContent);
  const resultLines: string[] = [];

  const analy: SegmentAnalysis = {
    all: { matchedRate: 1, unmatchedSegments: 0, unmatchedSegmentsList: [] },
    en: { totalSegments: 0, unmatchedSegments: 0, unmatchedSegmentsList: [] },
    zh: { totalSegments: 0, unmatchedSegments: 0, unmatchedSegmentsList: [] },
  };

  formattedJson.forEach((item, n) => {
    const idx = n + 1;
    const enText = item.segs.map((s) => s.utf8).join('');
    const zhText = zhLines.get(idx) ?? '';
    const desc = descriptors.get(idx);

    // English analysis
    if (desc) analy.en.totalSegments += desc.enSplits.length;
    const enSplitResult =
      desc && desc.enSplits.length > 0
        ? applySplits(enText, desc.enSplits)
        : { parts: [enText.trim()], unmatched: 0 };
    const enParts = enSplitResult.parts;
    analy.en.unmatchedSegments += enSplitResult.unmatched;
    if (enSplitResult.unmatched > 0) analy.en.unmatchedSegmentsList.push(idx);

    // Chinese analysis
    if (desc) analy.zh.totalSegments += desc.zhSplits.length;
    let zhParts: string[];
    if (desc && (desc.zhSplits.length > 0 || desc.zhCopyCount > 0)) {
      const zhSplitResult = applySplits(zhText, desc.zhSplits);
      zhParts = zhSplitResult.parts;
      analy.zh.unmatchedSegments += zhSplitResult.unmatched;
      if (zhSplitResult.unmatched > 0) analy.zh.unmatchedSegmentsList.push(idx);

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

  const totalPossible = analy.en.totalSegments + analy.zh.totalSegments;
  analy.all.unmatchedSegments = analy.en.unmatchedSegments + analy.zh.unmatchedSegments;
  const rawRate = totalPossible > 0 ? (totalPossible - analy.all.unmatchedSegments) / totalPossible : 1;
  analy.all.matchedRate = Number(rawRate.toFixed(2));
  analy.all.unmatchedSegmentsList = Array.from(new Set([...analy.en.unmatchedSegmentsList, ...analy.zh.unmatchedSegmentsList])).sort((a, b) => a - b);

  return { fullMd: resultLines.join('\n'), analy };
}


