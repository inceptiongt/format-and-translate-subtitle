import { SegmentResult } from './calcuTimestampBySegmentation';

export function genDualSrt(segments: SegmentResult[]): string {
  if (segments.length === 0) return '';

  const msToSrtTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  };

  return segments
    .map((item, index) => {
      const startTime = msToSrtTime(item.startMs);
      const endTime = msToSrtTime(item.startMs + item.durationMs);
      const text = `${item.translation}\n${item.original}`;
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
    })
    .join('\n');
}
