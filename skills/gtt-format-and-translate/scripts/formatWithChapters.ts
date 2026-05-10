import { FormattedSubtitleItem } from './calcuTimestampByFlag';

export interface Chapter {
  start_time: number;
  title: string;
  end_time: number;
}

export function formatWithChapters(
  formattedItems: FormattedSubtitleItem[],
  chapters: Chapter[]
): string {
  let output = '';
  let currentChapterIndex = 0;

  formattedItems.forEach((item, index) => {
    const itemStartS = item.tStartMs / 1000;

    while (
      currentChapterIndex < chapters.length &&
      itemStartS >= chapters[currentChapterIndex].start_time
    ) {
      output += `# ${chapters[currentChapterIndex].title}\n\n`;
      currentChapterIndex++;
    }

    const text = item.segs[0].utf8;
    output += `[${index + 1}] ${text}\n`;
  });

  return output.trim();
}
