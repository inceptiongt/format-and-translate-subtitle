import { readFileSync, writeFileSync } from 'node:fs';
import { calcuTimestampBySegmentation } from './calcuTimestampBySegmentation';
import { genDualSrt } from './genDualSrt';

const [formattedJsonPath, segMdPath, outputSrtPath] = process.argv.slice(2);
if (!formattedJsonPath || !segMdPath || !outputSrtPath) {
  console.error('Usage: step7.ts <formatted_json_path> <segmentation_md_path> <output_srt_path>');
  process.exit(1);
}

const formattedJson = JSON.parse(readFileSync(formattedJsonPath, 'utf-8'));
const segMd = readFileSync(segMdPath, 'utf-8');
const segments = calcuTimestampBySegmentation(formattedJson, segMd);
const srt = genDualSrt(segments);

writeFileSync(outputSrtPath, srt);
console.log('Step 7 done:', segments.length, 'segments →', outputSrtPath);
