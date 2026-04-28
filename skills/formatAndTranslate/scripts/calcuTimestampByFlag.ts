import { SubtitleItem } from './formatAndAddIndex';

export interface FormattedSubtitleItem {
  tStartMs: number;
  dDurationMs: number;
  segs: { utf8: string }[];
}

function joinText(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  if (a.endsWith(' ') || b.startsWith(' ')) return a + b;
  return a + ' ' + b;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function flushWithinLineParts(
  parts: string[],
  startMs: number,
  timePerChar: number,
  results: FormattedSubtitleItem[]
): number {
  let text = '';
  let itemStart = startMs;
  let duration = 0;

  for (const part of parts) {
    text = joinText(text, part);
    duration += part.length * timePerChar;
    startMs += part.length * timePerChar;

    if (wordCount(part) >= 10) {
      if (text.trim()) {
        results.push({ tStartMs: Math.round(itemStart), dDurationMs: Math.round(duration), segs: [{ utf8: text.trim() }] });
      }
      text = '';
      itemStart = startMs;
      duration = 0;
    }
  }

  if (text.trim()) {
    results.push({ tStartMs: Math.round(itemStart), dDurationMs: Math.round(duration), segs: [{ utf8: text.trim() }] });
  }

  return startMs;
}

export function calcuTimestampByFlag(
  originalItems: SubtitleItem[],
  flaggedMd: string
): FormattedSubtitleItem[] {
  const results: FormattedSubtitleItem[] = [];

  let accText = '';
  let accStart: number | null = null;
  let accDuration = 0;
  let accLineIndex: number | null = null;

  for (const line of flaggedMd.split('\n')) {
    const match = line.match(/^\[(\d+)\]\s*(.*)$/);
    if (!match) continue;

    const index = parseInt(match[1], 10);
    const content = match[2];
    const originalItem = originalItems[index];
    if (!originalItem) continue;

    const cleanLength = content.replace(/\[end\]/g, '').length;
    const timePerChar = cleanLength > 0 ? originalItem.dDurationMs / cleanLength : 0;
    const parts = content.split('[end]');
    let lineStartMs = originalItem.tStartMs;

    if (parts.length === 1) {
      if (accText === '') {
        accStart = lineStartMs;
        accLineIndex = index;
      }
      accText = joinText(accText, parts[0]);
      accDuration += parts[0].length * timePerChar;
    } else {
      const completedParts = parts.slice(0, -1);
      const trailingPart = parts[parts.length - 1];
      const hasCrossLine = accText !== '' && accLineIndex !== index;

      if (hasCrossLine) {
        const first = completedParts[0];
        accText = joinText(accText, first);
        accDuration += first.length * timePerChar;
        lineStartMs += first.length * timePerChar;
        if (accText.trim()) {
          results.push({
            tStartMs: Math.round(accStart!),
            dDurationMs: Math.round(accDuration),
            segs: [{ utf8: accText.trim() }],
          });
        }
        accText = '';
        accStart = null;
        accDuration = 0;
        accLineIndex = null;

        if (completedParts.length > 1) {
          lineStartMs = flushWithinLineParts(completedParts.slice(1), lineStartMs, timePerChar, results);
        }
      } else {
        lineStartMs = flushWithinLineParts(completedParts, lineStartMs, timePerChar, results);
        accText = '';
        accStart = null;
        accDuration = 0;
        accLineIndex = null;
      }

      if (trailingPart.trim()) {
        accText = trailingPart;
        accStart = lineStartMs;
        accDuration = trailingPart.length * timePerChar;
        accLineIndex = index;
      }
    }
  }

  if (accText.trim() && accStart !== null) {
    results.push({
      tStartMs: Math.round(accStart),
      dDurationMs: Math.round(accDuration),
      segs: [{ utf8: accText.trim() }],
    });
  }

  return results;
}
