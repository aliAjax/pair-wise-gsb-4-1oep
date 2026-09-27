import type { Marker } from '../data/types';
import { sortedMarkers } from '../matching/markers';

interface MarkedTextProps {
  text: string;
  markers: Marker[];
  onToggle?: (id: number) => void;
  /** dark = 练习区深色卡片上的渲染 */
  tone?: 'light' | 'dark';
  /** compact = 句子库里的小号展示 */
  compact?: boolean;
}

interface Segment {
  text: string;
  marker?: Marker;
  index: number; // 在已定位标记中的序号（从 1 开始）
}

/**
 * 句子卡片与当前练习区共用同一份标记渲染：
 * 只显示能在句中定位的标记，按偏移切段，天然保证互不重叠。
 */
export default function MarkedText({ text, markers, onToggle, tone = 'light', compact = false }: MarkedTextProps) {
  const located = sortedMarkers(
    markers.filter(m => m.state === 'anchored' && m.start >= 0 && m.end <= text.length && m.end > m.start),
  );
  const segments: Segment[] = [];
  let cursor = 0;
  located.forEach((m, i) => {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start), index: 0 });
    segments.push({ text: text.slice(m.start, m.end), marker: m, index: i + 1 });
    cursor = m.end;
  });
  if (cursor < text.length) segments.push({ text: text.slice(cursor), index: 0 });

  return (
    <span className={`marked-text ${tone} ${compact ? 'compact' : ''}`}>
      {segments.map((seg, i) =>
        seg.marker ? (
          <mark
            key={i}
            className={`mark ${seg.marker.active ? 'on' : 'off'}`}
            role="button"
            tabIndex={onToggle ? 0 : undefined}
            title={onToggle ? '点击切换重点提示' : seg.marker.hint}
            onClick={onToggle ? () => onToggle(seg.marker!.id) : undefined}
            onKeyDown={onToggle ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(seg.marker!.id); } } : undefined}
          >
            {seg.text}
            <sup className="mark-num">{seg.index}</sup>
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
