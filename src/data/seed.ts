import type { Marker, Phrase } from './types';

/** 重点片段偏移基于下方 text 精确计算，保证在原句中可定位且互不重叠 */
const seedMarkers: Record<number, Marker[]> = {
  1: [
    { id: 101, start: 4, end: 11, fragment: 'morning', hint: '双音节 mor-ning，/m/ 闭口起步，-ing 带上鼻音，不要读成“猫宁”。', active: true, state: 'anchored' },
  ],
  2: [
    { id: 201, start: 30, end: 34, fragment: 'next', hint: '注意 /n/ 到 /k/ 的过渡，/k/ 轻收，别在中间加元音。', active: true, state: 'anchored' },
    { id: 202, start: 35, end: 39, fragment: 'step', hint: '词尾 /p/ 只闭唇不送气，轻轻爆破即可。', active: true, state: 'anchored' },
  ],
  3: [
    { id: 301, start: 2, end: 12, fragment: 'appreciate', hint: '四个音节 ap-pre-ci-ate，重音在第二个音节 /ˈpriː/。', active: true, state: 'anchored' },
    { id: 302, start: 31, end: 41, fragment: 'thoughtful', hint: 'th 要咬舌尖发 /θ/，thought-ful 两拍，不要读成 fought。', active: true, state: 'anchored' },
  ],
  4: [
    { id: 401, start: 29, end: 38, fragment: 'curiosity', hint: '五个音节 cu-ri-os-i-ty，重音在第三个音节 /ˈɒs/。', active: true, state: 'anchored' },
  ],
};

const base: Omit<Phrase, 'markers'>[] = [
  { id: 1, text: 'The morning light feels different today.', translation: '今天的晨光感觉不一样。', tag: '日常', level: '入门', status: 'practice', attempts: 3, last: '今天 09:24' },
  { id: 2, text: 'Could you walk me through the next step?', translation: '你能带我了解下一步吗？', tag: '工作', level: '进阶', status: 'new', attempts: 0 },
  { id: 3, text: 'I appreciate your patience and thoughtful feedback.', translation: '感谢你的耐心和细致反馈。', tag: '表达', level: '挑战', status: 'mastered', attempts: 8, last: '昨天 18:10' },
  { id: 4, text: 'Let’s make room for a little curiosity.', translation: '给好奇心留一点空间。', tag: '灵感', level: '入门', status: 'new', attempts: 0 },
];

export const seedPhrases: Phrase[] = base.map(p => ({ ...p, markers: seedMarkers[p.id] ?? [] }));

/** 示例标记之外新增标记的 id 从此开始 */
export const SEED_NEXT_ID = 1000;
