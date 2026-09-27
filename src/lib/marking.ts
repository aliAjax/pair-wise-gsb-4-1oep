import type { Marker } from '../data/phrases';

export type TextPart = { text: string; marker: Marker | null };

/** 片段在句子中出现的所有位置 */
export function findOccurrences(text: string, fragment: string): number[] {
  if (!fragment) return [];
  const at: number[] = [];
  let i = text.indexOf(fragment);
  while (i !== -1) {
    at.push(i);
    i = text.indexOf(fragment, i + 1);
  }
  return at;
}

/** 定位标记：优先原来的位置，其次句中唯一出现的位置；找不到返回 null */
export function locateMarker(text: string, marker: Marker): number | null {
  if (!marker.fragment) return null;
  if (text.startsWith(marker.fragment, marker.start)) return marker.start;
  const hits = findOccurrences(text, marker.fragment);
  return hits.length === 1 ? hits[0] : null;
}

export function overlaps(aStart: number, aLength: number, bStart: number, bLength: number): boolean {
  return aStart < bStart + bLength && bStart < aStart + aLength;
}

/**
 * 句子文字变化后重新锚定标记：
 * 能继续匹配（且不互相重叠）的保留并更新位置，其余进入待重标。
 */
export function reanchorMarkers(text: string, markers: Marker[]): { kept: Marker[]; pending: Marker[] } {
  const kept: Marker[] = [];
  const pending: Marker[] = [];
  const ordered = [...markers].sort((a, b) => a.start - b.start);
  for (const marker of ordered) {
    const at = locateMarker(text, marker);
    const clash = at !== null && kept.some(k => overlaps(k.start, k.fragment.length, at, marker.fragment.length));
    if (at === null || clash) {
      pending.push(marker);
    } else {
      kept.push({ ...marker, start: at });
    }
  }
  return { kept, pending };
}

/** 校验新片段能否加入：必须在句中唯一定位且不与已有标记重叠 */
export function addMarkerAt(text: string, markers: Marker[], fragment: string): { start: number } | { error: string } {
  const f = fragment.trim();
  if (!f) return { error: '请输入片段文字' };
  const hits = findOccurrences(text, f);
  if (hits.length === 0) return { error: '片段不在当前句子中' };
  if (hits.length > 1) return { error: '片段在句中出现多次，请写得更具体' };
  const start = hits[0];
  if (markers.some(m => overlaps(m.start, m.fragment.length, start, f.length))) return { error: '与已有重点片段重叠' };
  return { start };
}

/** 把句子按标记切成有序片段，供卡片与练习区按同一份标记渲染 */
export function splitByMarkers(text: string, markers: Marker[]): TextPart[] {
  const located = markers
    .map(marker => ({ marker, at: locateMarker(text, marker) }))
    .filter((x): x is { marker: Marker; at: number } => x.at !== null)
    .sort((a, b) => a.at - b.at);
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const { marker, at } of located) {
    if (at < cursor) continue; // 防御：同一位置只取一个标记
    if (at > cursor) parts.push({ text: text.slice(cursor, at), marker: null });
    parts.push({ text: text.slice(at, at + marker.fragment.length), marker });
    cursor = at + marker.fragment.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), marker: null });
  return parts;
}
