import { readFileSync, writeFileSync } from 'node:fs';

const [indexedJsonPath, formattedJsonPath, finalJsonPath, outputJsonPath] = process.argv.slice(2);

if (!indexedJsonPath || !formattedJsonPath || !finalJsonPath || !outputJsonPath) {
  console.error('Usage: report.ts <indexed_json_path> <formatted_json_path> <final_json_path> <output_json_path>');
  process.exit(1);
}

function countEnWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function countZhChars(text: string): number {
  return (text.match(/[\u4e00-\u9fa5]/g) || []).length;
}

interface Stats {
  enWords: number;
  zhChars: number;
  items: number;
}

function getStats(path: string, type: 'indexed' | 'formatted' | 'final'): Stats {
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    let enWords = 0;
    let zhChars = 0;
    let items = 0;

    if (type === 'indexed' || type === 'formatted') {
      items = data.length;
      for (const item of data) {
        const text = item.segs?.map((s: any) => s.utf8 ?? '').join('') ?? '';
        enWords += countEnWords(text);
        zhChars += countZhChars(text);
      }
    } else if (type === 'final') {
      items = data.length;
      for (const item of data) {
        enWords += countEnWords(item.original || '');
        zhChars += countZhChars(item.translation || '');
      }
    }

    return { enWords, zhChars, items };
  } catch (e) {
    console.warn(`Could not read or parse ${path}:`, e);
    return { enWords: 0, zhChars: 0, items: 0 };
  }
}

const report: Record<string, Stats> = {
  original: getStats(indexedJsonPath, 'indexed'),
  formatted: getStats(formattedJsonPath, 'formatted'),
  final: getStats(finalJsonPath, 'final'),
};

writeFileSync(outputJsonPath, JSON.stringify(report, null, 2));
console.log('Statistics report generated at:', outputJsonPath);
