import { readFileSync, writeFileSync } from 'node:fs';
import { expandSegmentFull } from './expandSegmentFull';
import type { FormattedSubtitleItem } from './calcuTimestampBySegmentation';

const [formattedJsonPath, zhMdPath, segMdPath, outputPath] = process.argv.slice(2);
if (!formattedJsonPath || !zhMdPath || !segMdPath || !outputPath) {
  console.error('Usage: runExpandSegmentFull.ts <formatted_json> <zh_md> <segment_md> <output_full_md>');
  process.exit(1);
}

try {
  const formattedJson: FormattedSubtitleItem[] = JSON.parse(readFileSync(formattedJsonPath, 'utf-8'));
  const zhMdContent = readFileSync(zhMdPath, 'utf-8');
  const segMdContent = readFileSync(segMdPath, 'utf-8');
  
  const { fullMd, analy } = expandSegmentFull(formattedJson, zhMdContent, segMdContent);
  writeFileSync(outputPath, fullMd);
  console.log('Done:', outputPath);

  const analyPath = outputPath.replace('.full.md', '.analy.json');
  writeFileSync(analyPath, JSON.stringify(analy, null, 2), 'utf-8');
  console.log('Analysis saved:', analyPath);
} catch (error) {
  console.error('Error in runExpandSegmentFull:', error);
  process.exit(1);
}
