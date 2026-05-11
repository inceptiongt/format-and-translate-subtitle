import { readFileSync, writeFileSync } from 'node:fs';

const [analyJsonPath, enMdPath, zhMdPath, outEnPartPath, outZhPartPath] = process.argv.slice(2);
if (!analyJsonPath || !enMdPath || !zhMdPath || !outEnPartPath || !outZhPartPath) {
  console.error('Usage: extractPartialSegments.ts <analy_json_path> <en_md_path> <zh_md_path> <out_en_part_path> <out_zh_part_path>');
  process.exit(1);
}

function extractLines(content: string, segmentList: number[]): string {
  const segmentSet = new Set(segmentList);
  return content
    .split('\n')
    .filter((line) => {
      const match = line.match(/^\[(\d+)\]/);
      return match && segmentSet.has(parseInt(match[1], 10));
    })
    .join('\n');
}

try {
  const analy = JSON.parse(readFileSync(analyJsonPath, 'utf-8'));
  const rawSegmentList = analy.all?.unmatchedSegmentsList ?? [];

  if (rawSegmentList.length === 0) {
    writeFileSync(outEnPartPath, '');
    writeFileSync(outZhPartPath, '');
    console.log('No unmatched segments found.');
    process.exit(0);
  }

  const enContent = readFileSync(enMdPath, 'utf-8');
  const zhContent = readFileSync(zhMdPath, 'utf-8');

  // Filter segmentList: only keep segments with >= 15 words in the English text
  const segmentList = rawSegmentList.filter((segmentId: number) => {
    // Find the line in enContent matching [segmentId]
    const match = enContent.match(new RegExp(`^\\[${segmentId}\\]\\s*(.*)`, 'm'));
    if (match) {
      const text = match[1];
      // Simple word count by splitting by whitespace
      const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      return wordCount >= 15;
    }
    return false;
  });

  if (segmentList.length === 0) {
    writeFileSync(outEnPartPath, '');
    writeFileSync(outZhPartPath, '');
    console.log('No unmatched segments with >= 15 words found.');
    process.exit(0);
  }

  writeFileSync(outEnPartPath, extractLines(enContent, segmentList));
  writeFileSync(outZhPartPath, extractLines(zhContent, segmentList));

  console.log(`Extracted ${segmentList.length} unmatched sentences to:`);
  console.log(` - ${outEnPartPath}`);
  console.log(` - ${outZhPartPath}`);
} catch (error) {
  console.error('Error in extractPartialSegments:', error);
  process.exit(1);
}
