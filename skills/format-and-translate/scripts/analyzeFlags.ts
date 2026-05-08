import { readFileSync, writeFileSync } from 'node:fs';

const [flagFullMdPath, outputJsonPath] = process.argv.slice(2);
if (!flagFullMdPath || !outputJsonPath) {
  console.error('Usage: analyzeFlags.ts <flag_full_md> <output_json>');
  process.exit(1);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

const content = readFileSync(flagFullMdPath, 'utf-8');

let totalMi = 0;
const unmatchedMiList: number[] = [];
const longSentences: Array<{ n: number; words: number; text: string; miList: number[] }> = [];

for (const line of content.split('\n')) {
  // Format: [n:+m1+m2+-m3] sentence_text
  const m = line.match(/^\[(\d+):([^\]]+)\]\s*(.*)/);
  if (!m) continue;
  const n = parseInt(m[1], 10);
  const sources = m[2];
  const sentenceText = m[3];

  const allMiTokens = sources.match(/\+-?\d+/g) ?? [];
  totalMi += allMiTokens.length;

  for (const token of sources.match(/\+-(\d+)/g) ?? []) {
    unmatchedMiList.push(parseInt(token.slice(2), 10));
  }

  const wc = wordCount(sentenceText);
  if (wc > 40) {
    const miList = allMiTokens.map(t => parseInt(t.replace(/^\+-?/, ''), 10));
    longSentences.push({ n, words: wc, text: sentenceText, miList });
  }
}

const matchedMi = totalMi - unmatchedMiList.length;
const matchedRate = totalMi > 0 ? matchedMi / totalMi : 1;

const stats = {
  totalMi,
  unmatchedMiCount: unmatchedMiList.length,
  matchedRate: parseFloat(matchedRate.toFixed(4)),
  unmatchedMiList,
  longSentencesCount: longSentences.length,
  longSentences,
};

writeFileSync(outputJsonPath, JSON.stringify(stats, null, 2) + '\n');
console.error(`analyzeFlags: saved to ${outputJsonPath}`);

process.exit(matchedRate >= 0.8 ? 0 : 1);
