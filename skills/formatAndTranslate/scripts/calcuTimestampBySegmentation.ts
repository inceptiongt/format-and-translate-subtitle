
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

export function calcuTimestampBySegmentation(
  formattedJson: FormattedSubtitleItem[],
  segmentationsMd: string
): SegmentResult[] {
  const lines = segmentationsMd.split('\n');
  const parentGroups = new Map<number, Map<number, { original?: string; translation?: string }>>();
  const segmentRegex = /^\[(\d+)\.(\d+)\]\s*(.*)$/;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const match = trimmed.match(segmentRegex);
    if (match) {
      const n = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const text = match[3];

      if (!parentGroups.has(n)) {
        parentGroups.set(n, new Map());
      }
      const mDataMap = parentGroups.get(n)!;

      if (!mDataMap.has(m)) {
        mDataMap.set(m, { original: text });
      } else {
        const existing = mDataMap.get(m)!;
        if (existing.translation === undefined) {
          existing.translation = text;
        } else {
          existing.translation = text;
        }
      }
    }
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
        original: data.original || '',
        translation: data.translation || '',
        length: (data.original || '').length || 1,
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
