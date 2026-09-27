import { Clock3, Mic } from 'lucide-react';
import MarkedText from '../components/MarkedText';
import type { Phrase, PracticeRecord } from '../data/phrases';

type Props = {
  records: PracticeRecord[];
  phrases: Phrase[];
  onPracticeAgain: (phraseId: number) => void;
};

const fmtTime = (t: number) => new Date(t).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtLen = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** 练习记录页：每条记录保留录音当时的句子与标记快照 */
export default function RecordsView({ records, phrases, onPracticeAgain }: Props) {
  return (
    <main className="main">
      <header className="topbar">
        <div><p className="eyebrow">PRACTICE HISTORY</p><h1>练习记录</h1></div>
      </header>
      <div className="record-list">
        {records.map(r => {
          const phrase = phrases.find(p => p.id === r.phraseId);
          const changed = phrase !== undefined && phrase.text !== r.text;
          return (
            <div className="record-item" key={r.id}>
              <div className="record-item-main">
                <div className="record-sentence"><MarkedText text={r.text} markers={r.markers}/></div>
                <div className="record-meta">
                  <Clock3 size={12}/>
                  <span>{fmtTime(r.at)}</span>
                  <span>时长 {fmtLen(r.seconds)}</span>
                  {!phrase && <i className="warn">原句已删除</i>}
                  {changed && <i className="warn">句子已修改，此处保留当时文本</i>}
                </div>
              </div>
              {phrase && <button className="secondary" onClick={() => onPracticeAgain(r.phraseId)}><Mic size={14}/>再练一次</button>}
            </div>
          );
        })}
        {records.length === 0 && <div className="empty">还没有练习记录，回到练习库完成一次录音吧</div>}
      </div>
    </main>
  );
}
