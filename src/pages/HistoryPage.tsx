import type { Attempt } from '../data/types';
import { Clock3, Mic } from 'lucide-react';

interface Props {
  attempts: Attempt[];
}

function formatAt(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

export default function HistoryPage({ attempts }: Props) {
  const sorted = [...attempts].sort((a, b) => b.at - a.at);
  return (
    <section className="history-page">
      <div className="section-head">
        <div><h2>练习记录</h2><p>记录保存的是录音当时的句子和重点，之后改句不影响这里</p></div>
      </div>
      {sorted.length === 0 ? (
        <div className="empty history-empty"><Clock3 size={20}/><p>还没有练习记录，回到练习库读第一句吧。</p></div>
      ) : (
        <div className="history-list">
          {sorted.map(a => (
            <article key={a.id} className="history-card">
              <div className="history-card-head">
                <div className="history-icon"><Mic size={14}/></div>
                <div>
                  <strong className="history-text">{a.phraseText}</strong>
                  <span>{a.translation}</span>
                </div>
                <div className="history-meta">
                  <time>{formatAt(a.at)}</time>
                  <i>{formatDuration(a.seconds)}</i>
                </div>
              </div>
              {a.markers.length > 0 && (
                <ul className="history-marks">
                  {a.markers.map((m, i) => (
                    <li key={i} className={m.active ? 'on' : 'off'}>
                      <b>{i + 1}</b><code>{m.fragment}</code>{m.hint && <span>{m.hint}</span>}
                      {!m.active && <em>已关闭</em>}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
