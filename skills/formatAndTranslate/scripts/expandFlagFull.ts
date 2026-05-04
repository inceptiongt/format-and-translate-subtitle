import { expandCompactFlags } from './calcuTimestampByFlag';

/**
 * Expands compact flag markers into a full Markdown string for debugging.
 * This is a pure function with no side effects.
 */
export function expandFlagFull(items: any[], flagMd: string): string {
  return expandCompactFlags(items, flagMd);
}
