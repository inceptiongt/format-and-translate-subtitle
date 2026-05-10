import { readFileSync, writeFileSync } from 'node:fs';

const [analyJsonPath, enMdPath, zhMdPath, outEnPartPath, outZhPartPath] = process.argv.slice(2);
if (!analyJsonPath || !enMdPath || !zhMdPath || !outEnPartPath || !outZhPartPath) {
  console.error('Usage: extractPartialSegments.ts <analy_json_path> <en_md_path> <zh_md_path> <out_en_part_path> <out_zh_part_path>');
  process.exit(1);
}

function extractLines(content: string, miList: number[]): string {
  const miSet = new Set(miList);
  return content
    .split('\n')
    .filter((line) => {
      const match = line.match(/^\[(\d+)\]/);
      return match && miSet.has(parseInt(match[1], 10));
    })
    .join('\n');
}

try {
  const analy = JSON.parse(readFileSync(analyJsonPath, 'utf-8'));
  const miList = analy.all?.unmatchedSegmentsList ?? [];

  if (miList.length === 0) {
    writeFileSync(outEnPartPath, '');
    writeFileSync(outZhPartPath, '');
    console.log('No unmatched segments found.');
    process.exit(0);
  }

  const enContent = readFileSync(enMdPath, 'utf-8');
  const zhContent = readFileSync(zhMdPath, 'utf-8');

  writeFileSync(outEnPartPath, extractLines(enContent, miList));
  writeFileSync(outZhPartPath, extractLines(zhContent, miList));

  console.log(`Extracted ${miList.length} unmatched sentences to:`);
  console.log(` - ${outEnPartPath}`);
  console.log(` - ${outZhPartPath}`);
} catch (error) {
  console.error('Error in extractPartialSegments:', error);
  process.exit(1);
}
