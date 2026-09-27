import type { Attempt, Marker, Phrase } from './types';
import { seedPhrases, SEED_NEXT_ID } from './seed';

const PHRASES_KEY = 'sound-lab-phrases-v2';
const ATTEMPTS_KEY = 'sound-lab-attempts-v1';
const NEXT_ID_KEY = 'sound-lab-next-id-v1';
const LEGACY_KEY = 'sound-lab-phrases';

function clampMarker(m: Partial<Marker>, textLen: number): Marker {
  const start = typeof m.start === 'number' && m.start >= 0 && m.start < textLen ? m.start : -1;
  const end = typeof m.end === 'number' && m.end > start && m.end <= textLen ? m.end : -1;
  const state: Marker['state'] = m.state === 'anchored' ? 'anchored' : 'pending';
  const located = state === 'anchored' && start >= 0 && end > start;
  return {
    id: typeof m.id === 'number' ? m.id : 0,
    start: located ? start : -1,
    end: located ? end : -1,
    fragment: typeof m.fragment === 'string' ? m.fragment : '',
    hint: typeof m.hint === 'string' ? m.hint : '',
    active: m.active !== false,
    state: located ? 'anchored' : 'pending',
  };
}

function normalizePhrase(p: Partial<Phrase>): Phrase | null {
  if (!p || typeof p.text !== 'string' || !p.text.trim()) return null;
  const textLen = p.text.length;
  return {
    id: typeof p.id === 'number' ? p.id : 0,
    text: p.text,
    translation: typeof p.translation === 'string' ? p.translation : '待补充译文',
    tag: typeof p.tag === 'string' ? p.tag : '自定义',
    level: (['入门', '进阶', '挑战'] as const).find(l => l === p.level) ?? '入门',
    status: (['new', 'practice', 'mastered'] as const).find(s => s === p.status) ?? 'new',
    attempts: typeof p.attempts === 'number' && p.attempts >= 0 ? p.attempts : 0,
    last: typeof p.last === 'string' ? p.last : undefined,
    markers: Array.isArray(p.markers) ? p.markers.map(m => clampMarker(m, textLen)) : [],
  };
}

function loadPhrases(): Phrase[] {
  try {
    const raw = localStorage.getItem(PHRASES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const list = parsed.map(normalizePhrase).filter((p): p is Phrase => p !== null);
        if (list.length) return list;
      }
    }
    // 从旧版（v1，无标记）迁移
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizePhrase).filter((p): p is Phrase => p !== null);
      }
    }
  } catch {
    /* 读取失败就用示例 */
  }
  return seedPhrases;
}

export interface LabData {
  phrases: Phrase[];
  attempts: Attempt[];
  nextId: number;
}

export function loadData(): LabData {
  const phrases = loadPhrases();
  let attempts: Attempt[] = [];
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) attempts = parsed;
    }
  } catch {
    attempts = [];
  }
  let nextId = SEED_NEXT_ID;
  const stored = Number(localStorage.getItem(NEXT_ID_KEY));
  if (Number.isFinite(stored) && stored > SEED_NEXT_ID) nextId = stored;
  // 防止与已有标记 id 撞号
  const maxMarker = phrases.reduce((m, p) => p.markers.reduce((x, k) => Math.max(x, k.id), m), 0);
  if (maxMarker >= nextId) nextId = maxMarker + 1;
  return { phrases, attempts, nextId };
}

export function savePhrases(phrases: Phrase[]): void {
  localStorage.setItem(PHRASES_KEY, JSON.stringify(phrases));
}

export function saveAttempts(attempts: Attempt[]): void {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function saveNextId(id: number): void {
  localStorage.setItem(NEXT_ID_KEY, String(id));
}

/** 生成新标记 id（句子 id 用时间戳，不会与标记 id 区间冲突） */
export function makePhraseId(): number {
  return Date.now();
}
