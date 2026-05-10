import { readFileSync, writeFileSync } from 'node:fs';

const [partMdPath, mainMdPath] = process.argv.slice(2);
if (!partMdPath || !mainMdPath) {
  console.error('Usage: mergePartialSegments.ts <part_segmented_md> <main_segmented_md>');
  process.exit(1);
}

function parseBlocks(content: string): Map<number, string[]> {
  const blocks = new Map<number, string[]>();
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\[(\d+)\./);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!blocks.has(n)) blocks.set(n, []);
      blocks.get(n)!.push(line);
    }
  }
  return blocks;
}

try {
  const partBlocks = parseBlocks(readFileSync(partMdPath, 'utf-8'));
  const mainContent = readFileSync(mainMdPath, 'utf-8');
  const mainLines = mainContent.split('\n');

  const resultLines: string[] = [];
  const processedN = new Set<number>();

  for (let i = 0; i < mainLines.length; i++) {
    const line = mainLines[i];
    const match = line.match(/^\[(\d+)\./);

    if (match) {
      const n = parseInt(match[1], 10);
      if (partBlocks.has(n)) {
        if (!processedN.has(n)) {
          // Replace entire block
          resultLines.push(...partBlocks.get(n)!);
          processedN.add(n);
        }
        // Skip subsequent lines of the same block in main file
        continue;
      }
    }
    resultLines.push(line);
  }

  // Handle case where some N in partBlocks wasn't in main file (shouldn't happen but for robustness)
  for (const [n, blockLines] of partBlocks.entries()) {
    if (!processedN.has(n)) {
        resultLines.push('', ...blockLines, '');
    }
  }

  writeFileSync(mainMdPath, resultLines.join('\n').replace(/\n{3,}/g, '\n\n'), 'utf-8');
  console.log(`Merged segments for indices: ${Array.from(partBlocks.keys()).join(', ')}`);
} catch (error) {
  console.error('Error in mergePartialSegments:', error);
  process.exit(1);
}
