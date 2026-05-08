import { expandFlagFullForDebug } from './calcuTimestampByFlag';

/**
 * Expands compact flag markers into a debug Markdown showing resulting sentences
 * with composite source indices. Format: [n:+m1+-m2+m3] sentence_text
 * This is a pure function with no side effects.
 */
export function expandFlagFull(items: any[], flagMd: string): string {
  return expandFlagFullForDebug(items, flagMd);
}
