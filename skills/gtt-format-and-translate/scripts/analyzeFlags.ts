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
const unmatchedSentences: Array<{ n: number; words: number; text: string; miList: number[]; unmatchedMi: number[] }> = [];
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

  const wc = wordCount(sentenceText);

  const unmatchedTokens = sources.match(/\+-(\d+)/g) ?? [];
  if (unmatchedTokens.length > 0) {
    unmatchedSentences.push({
      n,
      words: wc,
      text: sentenceText,
      miList: allMiTokens.map(t => parseInt(t.replace(/^\+-?/, ''), 10)),
      unmatchedMi: unmatchedTokens.map(t => parseInt(t.slice(2), 10)),
    });
  }

  if (wc > 40) {
    const miList = allMiTokens.map(t => parseInt(t.replace(/^\+-?/, ''), 10));
    longSentences.push({ n, words: wc, text: sentenceText, miList });
  }
}

const unmatchedMiCount = unmatchedSentences.reduce((s, e) => s + e.unmatchedMi.length, 0);
const matchedMi = totalMi - unmatchedMiCount;
const matchedRate = totalMi > 0 ? matchedMi / totalMi : 1;

const stats = {
  totalMi,
  unmatchedMiCount,
  matchedRate: parseFloat(matchedRate.toFixed(4)),
  unmatchedSentences,
  longSentencesCount: longSentences.length,
  longSentences,
};

writeFileSync(outputJsonPath, JSON.stringify(stats, null, 2) + '\n');
console.log(`analyzeFlags: saved to ${outputJsonPath}`);

process.exit(matchedRate >= 0.8 ? 0 : 1);
