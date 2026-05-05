
export interface SubtitleSeg {
  utf8?: string;
  tOffsetMs?: number;
}

export interface SubtitleItem {
  tStartMs: number;
  dDurationMs: number;
  segs?: SubtitleSeg[];
}

function getRawText(item: SubtitleItem): string {
  return item.segs?.map((seg) => seg.utf8 ?? '').join('') ?? '';
}

function isValidItem(item: SubtitleItem): boolean {
  if (!item.segs || item.segs.length === 0) return false;
  const cleaned = getRawText(item).replace(/\[music\]/gi, '').replace(/\n/g, '').trim();
  return cleaned.length > 0;
}

function cleanRawText(raw: string): string {
  return raw.replace(/\[music\]/gi, '').replace(/\n/g, '').replace(/\s+/g, ' ').trim();
}

export function formatAndAddIndex(subtitleItems: SubtitleItem[]): string {
  return subtitleItems
    .filter(isValidItem)
    .map((item, index) => `[${index}] ${cleanRawText(getRawText(item))}`)
    .join('\n');
}

export function cleanSubtitleItems(subtitleItems: SubtitleItem[]): SubtitleItem[] {
  const valid = subtitleItems.filter(isValidItem);
  return valid.map((item, i) => {
    const lastOffset = [...item.segs!].reverse().find((seg) => seg.tOffsetMs !== undefined)?.tOffsetMs;
    const candidate = lastOffset !== undefined ? lastOffset + 800 : item.dDurationMs;
    const nextStart = valid[i + 1]?.tStartMs;
    const dDurationMs = nextStart !== undefined ? Math.min(candidate, nextStart - item.tStartMs) : candidate;
    return {
      tStartMs: item.tStartMs,
      dDurationMs,
      segs: [{ utf8: cleanRawText(getRawText(item)) }],
    };
  });
}
