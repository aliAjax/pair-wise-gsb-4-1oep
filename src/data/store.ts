import { useEffect, useState } from 'react';
import {
  loadPhrases, savePhrases, loadRecords, saveRecords,
  type Phrase, type PracticeRecord,
} from './phrases';
import { addMarkerAt, findOccurrences, overlaps, reanchorMarkers } from '../lib/marking';

/** 练习室数据层：句子库 + 练习记录，负责持久化与所有写操作 */
export function usePracticeStore() {
  const [phrases, setPhrases] = useState<Phrase[]>(loadPhrases);
  const [records, setRecords] = useState<PracticeRecord[]>(loadRecords);

  useEffect(() => savePhrases(phrases), [phrases]);
  useEffect(() => saveRecords(records), [records]);

  const patchPhrase = (id: number, fn: (p: Phrase) => Phrase) =>
    setPhrases(ps => ps.map(p => (p.id === id ? fn(p) : p)));

  const addPhrase = (text: string): number | null => {
    const t = text.trim();
    if (!t) return null;
    const id = Date.now();
    setPhrases(ps => [...ps, { id, text: t, translation: '待补充译文', tag: '自定义', level: '入门', status: 'new', attempts: 0, markers: [], pendingMarkers: [] }]);
    return id;
  };

  const removePhrase = (id: number) => setPhrases(ps => ps.filter(p => p.id !== id));

  /** 修改句子文字：能继续匹配的标记保留，定位不到的移入待重标 */
  const updatePhraseText = (id: number, text: string) => {
    patchPhrase(id, p => {
      const { kept, pending } = reanchorMarkers(text, p.markers);
      return { ...p, text, markers: kept, pendingMarkers: [...p.pendingMarkers, ...pending] };
    });
  };

  /** 新增重点片段；成功返回 null，失败返回错误信息 */
  const addMarker = (id: number, fragment: string, hint: string): string | null => {
    const phrase = phrases.find(p => p.id === id);
    if (!phrase) return '句子不存在';
    const located = addMarkerAt(phrase.text, phrase.markers, fragment);
    if ('error' in located) return located.error;
    patchPhrase(id, p => ({
      ...p,
      markers: [...p.markers, {
        id: `m${Date.now()}`,
        fragment: fragment.trim(),
        hint: hint.trim() || '注意这个片段的发音',
        start: located.start,
      }],
    }));
    return null;
  };

  const removeMarker = (id: number, markerId: string) =>
    patchPhrase(id, p => ({ ...p, markers: p.markers.filter(m => m.id !== markerId) }));

  /** 处理待重标：drop 为放弃，否则按（可修正过的）片段文字重新定位 */
  const resolvePending = (id: number, markerId: string, fragment: string, drop: boolean): string | null => {
    const phrase = phrases.find(p => p.id === id);
    if (!phrase) return '句子不存在';
    const marker = phrase.pendingMarkers.find(m => m.id === markerId);
    if (!marker) return null;
    if (drop) {
      patchPhrase(id, p => ({ ...p, pendingMarkers: p.pendingMarkers.filter(m => m.id !== markerId) }));
      return null;
    }
    const f = fragment.trim();
    if (!f) return '请输入片段文字';
    const hits = findOccurrences(phrase.text, f);
    if (hits.length === 0) return '片段仍不在句中，请按新句子修正片段文字';
    if (hits.length > 1) return '片段在句中出现多次，请写得更具体';
    const start = hits[0];
    if (phrase.markers.some(m => overlaps(m.start, m.fragment.length, start, f.length))) return '与已有重点片段重叠';
    patchPhrase(id, p => ({
      ...p,
      markers: [...p.markers, { ...marker, fragment: f, start }],
      pendingMarkers: p.pendingMarkers.filter(m => m.id !== markerId),
    }));
    return null;
  };

  /** 结束一次录音：写入练习记录（保留当时的句子与标记快照），并更新句子状态 */
  const finishRecording = (id: number, seconds: number) => {
    const phrase = phrases.find(p => p.id === id);
    if (!phrase) return;
    setRecords(rs => [{
      id: Date.now(),
      phraseId: id,
      text: phrase.text,
      markers: phrase.markers,
      seconds,
      at: Date.now(),
    }, ...rs]);
    patchPhrase(id, p => ({ ...p, attempts: p.attempts + 1, status: 'practice', last: '刚刚' }));
  };

  return {
    phrases, records,
    addPhrase, removePhrase, updatePhraseText,
    addMarker, removeMarker, resolvePending,
    finishRecording,
  };
}

export type PracticeStore = ReturnType<typeof usePracticeStore>;
