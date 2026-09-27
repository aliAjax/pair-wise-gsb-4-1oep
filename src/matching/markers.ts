import type { Marker, Phrase } from '../data/types';

export interface Range {
  start: number;
  end: number;
}

export function overlaps(a: Range, b: Range): boolean {
  return a.start < b.end && b.start < a.end;
}

export function overlapsAny(r: Range, others: Range[]): boolean {
  return others.some(o => overlaps(r, o));
}

/** 按起点升序排列的标记（返回新数组，不改入参顺序） */
export function sortedMarkers<T extends Marker | Range>(marks: T[]): T[] {
  return [...marks].sort((a, b) => a.start - b.start);
}

/** 检查片段落在句内、非空、与给定标记不重叠（忽略 markerId 自身与待重标项） */
export function validateFragment(
  text: string,
  start: number,
  end: number,
  marks: Marker[],
  selfId?: number,
): string | null {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return '请选择一个片段';
  if (start < 0 || end > text.length || start >= end) return '片段必须落在句子文字范围内';
  const others = marks
    .filter(m => m.state === 'anchored' && m.id !== selfId)
    .map(m => ({ start: m.start, end: m.end }));
  if (overlapsAny({ start, end }, others)) return '该片段和已有重点重叠了，换一处试试';
  return null;
}

/** 在句中为 fragment 找一个不与 taken 重叠的出现位置，找不到返回 null */
export function findFreeSlot(text: string, fragment: string, taken: Range[]): Range | null {
  if (!fragment) return null;
  let from = 0;
  for (;;) {
    const idx = text.indexOf(fragment, from);
    if (idx < 0) return null;
    const r = { start: idx, end: idx + fragment.length };
    if (!overlapsAny(r, taken)) return r;
    from = idx + 1;
  }
}

export interface ReconcileResult {
  markers: Marker[];
  pendingCount: number;
}

/**
 * 句子文字变更后重新匹配：
 * 1. 原偏移处仍是同一片段 → 保留原位置；
 * 2. 否则在句中按原顺序找下一处不与已保留标记重叠的出现 → 迁移过去；
 * 3. 都找不到 → 进待重标（start/end = -1, state = pending）。
 */
export function reconcileMarkers(oldMarkers: Marker[], newText: string): ReconcileResult {
  const taken: Range[] = [];
  const result: Marker[] = [];
  for (const m of sortedMarkers(oldMarkers)) {
    const stillFits =
      m.start >= 0 &&
      m.end <= newText.length &&
      newText.slice(m.start, m.end) === m.fragment &&
      !overlapsAny({ start: m.start, end: m.end }, taken);
    let range: Range | null = stillFits
      ? { start: m.start, end: m.end }
      : findFreeSlot(newText, m.fragment, taken);
    if (range) {
      taken.push(range);
      result.push({ ...m, start: range.start, end: range.end, state: 'anchored' });
    } else {
      result.push({ ...m, start: -1, end: -1, state: 'pending' });
    }
  }
  return { markers: result, pendingCount: result.filter(m => m.state === 'pending').length };
}

/** 给一条待重标标记指定新位置（句内选区），成功返回新标记列表 */
export function relocatePending(markers: Marker[], id: number, range: Range, text: string): Marker[] | null {
  const target = markers.find(m => m.id === id);
  if (!target) return null;
  const fragment = text.slice(range.start, range.end);
  const others = markers
    .filter(m => m.state === 'anchored' && m.id !== id)
    .map(m => ({ start: m.start, end: m.end }));
  if (!fragment || overlapsAny(range, others)) return null;
  return markers.map(m =>
    m.id === id
      ? { ...m, start: range.start, end: range.end, fragment, state: 'anchored' as const }
      : m,
  );
}

/** 用“自动定位”找下一处空闲出现位置 */
export function autoLocatePending(markers: Marker[], id: number, text: string): Marker[] | null {
  const target = markers.find(m => m.id === id);
  if (!target) return null;
  const taken = markers
    .filter(m => m.state === 'anchored' && m.id !== id)
    .map(m => ({ start: m.start, end: m.end }));
  const range = findFreeSlot(text, target.fragment, taken);
  if (!range) return null;
  return relocatePending(markers, id, range, text);
}

export function pendingCount(phrase: Phrase | undefined): number {
  return phrase ? phrase.markers.filter(m => m.state === 'pending').length : 0;
}

export function anchoredMarkers(phrase: Phrase | undefined): Marker[] {
  return phrase ? phrase.markers.filter(m => m.state === 'anchored') : [];
}
