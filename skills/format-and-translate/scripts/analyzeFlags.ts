import { readFileSync } from 'node:fs';

const [flagFullMdPath] = process.argv.slice(2);
if (!flagFullMdPath) {
  console.error('Usage: analyzeFlags.ts <flag_full_md>');
  process.exit(1);
}

const content = readFileSync(flagFullMdPath, 'utf-8');

let totalMi = 0;
let unmatchedMi = 0;

for (const line of content.split('\n')) {
  // Format: [n:+m1+m2+-m3] sentence_text
  const header = line.match(/^\[\d+:([^\]]+)\]/);
  if (!header) continue;
  const sources = header[1];
  // Count all mi tokens: +N or +-N
  const allMi = sources.match(/\+-?\d+/g) ?? [];
  totalMi += allMi.length;
  const unmatched = sources.match(/\+-\d+/g) ?? [];
  unmatchedMi += unmatched.length;
}

const matchedMi = totalMi - unmatchedMi;
const matchedRate = totalMi > 0 ? matchedMi / totalMi : 1;
const matchedRatePct = Math.round(matchedRate * 100);

console.log(`total_mi=${totalMi} unmatched_mi=${unmatchedMi} matched_rate=${matchedRatePct}%`);

process.exit(matchedRate >= 0.8 ? 0 : 1);
