import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const [zhFilePath, enChunksDirPath, outputDirPath_arg] = process.argv.slice(2);

if (!zhFilePath || !enChunksDirPath) {
  console.error('Usage: splitZhByChunks.ts <zh_file> <en_chunks_dir> [output_dir]');
  console.error('  zh_file       : 5.en.formatted.indexed.zh.md');
  console.error('  en_chunks_dir : directory containing chunk-NN.md English source files');
  console.error('  output_dir    : optional, defaults to parent of en_chunks_dir');
  process.exit(1);
}

const outputDirPath = outputDirPath_arg ?? dirname(enChunksDirPath);

const INDEX_RE = /^\[(\d+)\]/;

// Step 1: find English chunk boundaries (first [N] index in each chunk file)
const chunkFiles = readdirSync(enChunksDirPath)
  .filter(f => /^chunk-\d+\.md$/.test(f))
  .sort();

if (chunkFiles.length === 0) {
  console.error(`No chunk-NN.md files found in: ${enChunksDirPath}`);
  process.exit(1);
}

const boundaries: { chunkNum: string; startIndex: number }[] = [];

for (const file of chunkFiles) {
  const content = readFileSync(join(enChunksDirPath, file), 'utf-8');
  const firstIndexLine = content.split('\n').find(l => INDEX_RE.test(l));
  if (!firstIndexLine) {
    console.error(`No [N] index found in ${file}`);
    process.exit(1);
  }
  const startIndex = parseInt(firstIndexLine.match(INDEX_RE)![1], 10);
  const chunkNum = file.match(/chunk-(\d+)\.md/)![1];
  boundaries.push({ chunkNum, startIndex });
}

boundaries.sort((a, b) => a.startIndex - b.startIndex);

// Step 2: read Chinese file and distribute lines into chunks
const zhLines = readFileSync(zhFilePath, 'utf-8').split('\n');

const chunkLines: Map<string, string[]> = new Map(
  boundaries.map(({ chunkNum }) => [chunkNum, []])
);

// Find which chunk an index belongs to (last boundary whose startIndex <= idx)
function findChunk(idx: number): string {
  let assigned = boundaries[0].chunkNum;
  for (const { chunkNum, startIndex } of boundaries) {
    if (idx >= startIndex) assigned = chunkNum;
    else break;
  }
  return assigned;
}

let currentChunk = boundaries[0].chunkNum;

for (const line of zhLines) {
  const match = line.match(INDEX_RE);
  if (match) {
    currentChunk = findChunk(parseInt(match[1], 10));
  }
  chunkLines.get(currentChunk)!.push(line);
}

// Step 3: write output files
mkdirSync(outputDirPath, { recursive: true });

for (const { chunkNum } of boundaries) {
  const lines = chunkLines.get(chunkNum)!;
  // trim trailing blank lines
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  const outputFile = join(outputDirPath, `chunk-${chunkNum}-zh.md`);
  writeFileSync(outputFile, lines.join('\n') + '\n');

  const firstIdx = lines.find(l => INDEX_RE.test(l))?.match(INDEX_RE)?.[1] ?? '?';
  const lastIdx = [...lines].reverse().find(l => INDEX_RE.test(l))?.match(INDEX_RE)?.[1] ?? '?';
  console.log(`  chunk-${chunkNum}-zh.md: ${lines.length} lines, indices [${firstIdx}]-[${lastIdx}]`);
}

console.log(`Done. Split into ${boundaries.length} zh chunks → ${outputDirPath}`);
