export type Level = '入门' | '进阶' | '挑战';
export type PhraseStatus = 'new' | 'practice' | 'mastered';
export type MarkerState = 'anchored' | 'pending';

/** 句子里的重点片段标记。pending 表示改句后定位不到，等待重标，此时 start/end 为 -1 */
export interface Marker {
  id: number;
  start: number;
  end: number; // 相对句子文本的偏移，左闭右开
  fragment: string;
  hint: string;
  active: boolean; // 是否开启（点标记可切换）
  state: MarkerState;
}

export interface Phrase {
  id: number;
  text: string;
  translation: string;
  tag: string;
  level: Level;
  status: PhraseStatus;
  attempts: number;
  last?: string;
  markers: Marker[];
}

/** 完成录音那一刻的句子快照，之后句子怎么改都不影响已发出的记录 */
export interface AttemptMarker {
  fragment: string;
  hint: string;
  active: boolean;
}

export interface Attempt {
  id: number;
  phraseId: number;
  phraseText: string;
  translation: string;
  markers: AttemptMarker[];
  seconds: number;
  at: number;
}
