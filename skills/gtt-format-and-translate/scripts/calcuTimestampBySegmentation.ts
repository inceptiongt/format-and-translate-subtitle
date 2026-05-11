
export interface SegmentResult {
  startMs: number;
  durationMs: number;
  original: string;
  translation: string;
}

export interface FormattedSubtitleItem {
  tStartMs: number;
  dDurationMs: number;
  segs: { utf8: string }[];
}

export interface SplitPoint {
  before: string;
  after: string | null;
}

export interface SplitDescriptor {
  enSplits: SplitPoint[];
  zhSplits: SplitPoint[];
  zhCopyCount: number;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applySplits(text: string, splits: SplitPoint[]): { parts: string[]; unmatched: number } {
  if (splits.length === 0) return { parts: [text.trim()], unmatched: 0 };

  const parts: string[] = [];
  let remaining = text;
  let unmatched = 0;

  for (const { before, after } of splits) {
    const regex = after
      ? new RegExp(`(${escapeRegex(before)})(\\s*)(${escapeRegex(after)})`)
      : new RegExp(`(${escapeRegex(before)})\\s*$`);

    const match = regex.exec(remaining);
    if (!match) {
      unmatched++;
      continue;
    }

    const leftEnd = match.index + match[1].length;
    const rightStart = after ? leftEnd + match[2].length : remaining.length;

    parts.push(remaining.slice(0, leftEnd).trim());
    remaining = remaining.slice(rightStart);
  }

  parts.push(remaining.trim());
  return { parts: parts.filter((p) => p.length > 0), unmatched };
}

export function parseCompactSplitMd(compactSplitMd: string): Map<number, SplitDescriptor> {
  const descriptors = new Map<number, SplitDescriptor>();

  for (const line of compactSplitMd.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const enMatch = trimmed.match(/^\[(\d+)\.(\d+):en\]\s*(.+?)\[segment\](.*)$/);
    if (enMatch) {
      const n = parseInt(enMatch[1], 10);
      if (!descriptors.has(n)) descriptors.set(n, { enSplits: [], zhSplits: [], zhCopyCount: 0 });
      descriptors.get(n)!.enSplits.push({ before: enMatch[3].trim(), after: enMatch[4].trim() || null });
      continue;
    }

    // Fallback for malformed English split lines
    const enMalformedMatch = trimmed.match(/^\[(\d+)(?:\.\d+)?:en\]/);
    if (enMalformedMatch) {
      const n = parseInt(enMalformedMatch[1], 10);
      if (!descriptors.has(n)) descriptors.set(n, { enSplits: [], zhSplits: [], zhCopyCount: 0 });
      descriptors.get(n)!.enSplits.push({ before: '\0MALFORMED_EN\0', after: null });
      continue;
    }

    const zhCopyMatch = trimmed.match(/^\[(\d+)\.(\d+):zh\]\s*\[copy\]$/);
    if (zhCopyMatch) {
      const n = parseInt(zhCopyMatch[1], 10);
      if (!descriptors.has(n)) descriptors.set(n, { enSplits: [], zhSplits: [], zhCopyCount: 0 });
      descriptors.get(n)!.zhCopyCount += 1;
      continue;
    }

    const zhMatch = trimmed.match(/^\[(\d+)\.(\d+):zh\]\s*(.+?)\[segment\](.*)$/);
    if (zhMatch) {
      const n = parseInt(zhMatch[1], 10);
      if (!descriptors.has(n)) descriptors.set(n, { enSplits: [], zhSplits: [], zhCopyCount: 0 });
      descriptors.get(n)!.zhSplits.push({ before: zhMatch[3].trim(), after: zhMatch[4].trim() || null });
      continue;
    }

    // Fallback for malformed Chinese split lines
    const zhMalformedMatch = trimmed.match(/^\[(\d+)(?:\.\d+)?:zh\]/);
    if (zhMalformedMatch) {
      const n = parseInt(zhMalformedMatch[1], 10);
      if (!descriptors.has(n)) descriptors.set(n, { enSplits: [], zhSplits: [], zhCopyCount: 0 });
      descriptors.get(n)!.zhSplits.push({ before: '\0MALFORMED_ZH\0', after: null });
      continue;
    }
  }

  return descriptors;
}

export function calcuTimestampBySegmentation(
  formattedJson: FormattedSubtitleItem[],
  compactSplitMd: string,
  zhLines: Map<number, string>
): SegmentResult[] {
  const splitDescriptors = parseCompactSplitMd(compactSplitMd);

  const parentGroups = new Map<number, Map<number, { original: string; translation: string }>>();

  formattedJson.forEach((item, n) => {
    const idx = n + 1;
    const enText = item.segs.map((s) => s.utf8).join('');
    const zhText = zhLines.get(idx) ?? '';
    const desc = splitDescriptors.get(idx);

    const enParts =
      desc && desc.enSplits.length > 0 ? applySplits(enText, desc.enSplits).parts : [enText.trim()];

    let zhParts: string[];
    if (desc && (desc.zhSplits.length > 0 || desc.zhCopyCount > 0)) {
      zhParts = applySplits(zhText, desc.zhSplits).parts;
      for (let i = 0; i < desc.zhCopyCount; i++) zhParts.push('[copy]');
    } else {
      zhParts = [zhText.trim()];
    }

    const mDataMap = new Map<number, { original: string; translation: string }>();
    const count = Math.max(enParts.length, zhParts.length);
    for (let m = 1; m <= count; m++) {
      mDataMap.set(m, {
        original: enParts[m - 1] ?? '',
        translation: zhParts[m - 1] ?? '[copy]',
      });
    }

    parentGroups.set(n, mDataMap);
  });

  const results: SegmentResult[] = [];
  const sortedN = Array.from(parentGroups.keys()).sort((a, b) => a - b);

  sortedN.forEach(n => {
    const parentItem = formattedJson[n];
    if (!parentItem) return;

    const mDataMap = parentGroups.get(n)!;
    const sortedM = Array.from(mDataMap.keys()).sort((a, b) => a - b);

    const tStartMs = parentItem.tStartMs;
    const dDurationMs = parentItem.dDurationMs;

    const segments = sortedM.map(m => {
      const data = mDataMap.get(m)!;
      return {
        m,
        original: data.original,
        translation: data.translation,
        length: data.original.length || 1,
      };
    });

    const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
    let currentStartMs = tStartMs;
    let lastNonCopyTranslationText = '';

    segments.forEach((seg, index) => {
      const isLast = index === segments.length - 1;
      const share = seg.length / totalLength;
      const durationMs = share * dDurationMs;
      const nextStartMs = isLast ? (tStartMs + dDurationMs) : (currentStartMs + durationMs);

      let finalTranslation = seg.translation;
      if (finalTranslation.trim() === '[copy]') {
        finalTranslation = lastNonCopyTranslationText;
      } else {
        lastNonCopyTranslationText = finalTranslation;
      }

      results.push({
        startMs: Math.round(currentStartMs),
        durationMs: Math.round(nextStartMs - currentStartMs),
        original: seg.original,
        translation: finalTranslation,
      });

      currentStartMs = nextStartMs;
    });
  });

  return results;
}
