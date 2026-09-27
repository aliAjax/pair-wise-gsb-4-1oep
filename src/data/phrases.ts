export type Level = '入门' | '进阶' | '挑战';
export type Status = 'new' | 'practice' | 'mastered';

/** 重点片段：能在句子中定位的一段文字 + 提示 */
export type Marker = {
  id: string;
  fragment: string;
  hint: string;
  start: number; // 在句子中的起始下标；改句后由匹配逻辑重新锚定
};

export type Phrase = {
  id: number;
  text: string;
  translation: string;
  tag: string;
  level: Level;
  status: Status;
  attempts: number;
  last?: string;
  markers: Marker[];        // 已定位的重点片段
  pendingMarkers: Marker[]; // 改句后定位不到、等待重标的片段
};

/** 练习记录：保存录音当时的句子与标记快照，之后改句、删句都不影响它 */
export type PracticeRecord = {
  id: number;
  phraseId: number;
  text: string;
  markers: Marker[];
  seconds: number;
  at: number;
};

export const seedPhrases: Phrase[] = [
  {
    id: 1, text: 'The morning light feels different today.', translation: '今天的晨光感觉不一样。',
    tag: '日常', level: '入门', status: 'practice', attempts: 3, last: '今天 09:24',
    markers: [
      { id: 'm1a', fragment: 'morning', hint: '重音在第一个音节：MOR-ning', start: 4 },
      { id: 'm1b', fragment: 'different', hint: '口语里常读两音节 DIF-rent，中间不要加音', start: 24 },
    ],
    pendingMarkers: [],
  },
  {
    id: 2, text: 'Could you walk me through the next step?', translation: '你能带我了解下一步吗？',
    tag: '工作', level: '进阶', status: 'new', attempts: 0,
    markers: [
      { id: 'm2a', fragment: 'through', hint: 'θ 轻咬舌尖，让气流从缝隙送出', start: 18 },
    ],
    pendingMarkers: [],
  },
  {
    id: 3, text: 'I appreciate your patience and thoughtful feedback.', translation: '感谢你的耐心和细致反馈。',
    tag: '表达', level: '挑战', status: 'mastered', attempts: 8, last: '昨天 18:10',
    markers: [
      { id: 'm3a', fragment: 'appreciate', hint: '重音在第二音节：a-PRE-ci-ate', start: 2 },
      { id: 'm3b', fragment: 'thoughtful', hint: 'th 咬舌尖，-ought- 读 /ɔː/', start: 31 },
    ],
    pendingMarkers: [],
  },
  {
    id: 4, text: 'Let’s make room for a little curiosity.', translation: '给好奇心留一点空间。',
    tag: '灵感', level: '入门', status: 'new', attempts: 0,
    markers: [
      { id: 'm4a', fragment: 'little', hint: 'tt 读弹舌音，接近 “li-dul”', start: 22 },
      { id: 'm4b', fragment: 'curiosity', hint: '重音在 -os-：cu-ri-OS-i-ty', start: 29 },
    ],
    pendingMarkers: [],
  },
];

export const seedRecords: PracticeRecord[] = [
  // 改句前的旧记录：句子后来从 felt 改成 feels，这条记录仍保留当时的文本
  {
    id: 1, phraseId: 1, text: 'The morning light felt different today.', seconds: 8,
    at: Date.now() - 26 * 3600 * 1000,
    markers: [
      { id: 'm1a', fragment: 'morning', hint: '重音在第一个音节：MOR-ning', start: 4 },
      { id: 'm1b', fragment: 'different', hint: '口语里常读两音节 DIF-rent，中间不要加音', start: 23 },
    ],
  },
];

const PHRASES_KEY = 'sound-lab-phrases';
const RECORDS_KEY = 'sound-lab-records';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as T) : fallback;
  } catch {
    return fallback;
  }
}

/** 读取句子库；兼容旧数据（没有标记字段时补空数组） */
export function loadPhrases(): Phrase[] {
  return read<Phrase[]>(PHRASES_KEY, seedPhrases).map(p => ({
    ...p,
    markers: p.markers ?? [],
    pendingMarkers: p.pendingMarkers ?? [],
  }));
}

export function savePhrases(phrases: Phrase[]): void {
  localStorage.setItem(PHRASES_KEY, JSON.stringify(phrases));
}

export function loadRecords(): PracticeRecord[] {
  return read<PracticeRecord[]>(RECORDS_KEY, seedRecords);
}

export function saveRecords(records: PracticeRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}
