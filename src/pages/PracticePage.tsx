import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Mic, Pause, Play, RotateCcw, PencilLine, AlertTriangle } from 'lucide-react';
import type { Attempt, Phrase } from '../data/types';
import { pendingCount } from '../matching/markers';
import MarkedText from '../components/MarkedText';

interface Props {
  phrases: Phrase[];
  selectedId: number;
  onSelect: (id: number) => void;
  query: string;
  scope: 'all' | 'mastered';
  onToggleMarker: (phraseId: number, markerId: number) => void;
  onEdit: (phrase: Phrase) => void;
  onOpenPending: (phrase: Phrase) => void;
  onRecordAttempt: (phrase: Phrase, seconds: number) => Attempt;
}

const bars = Array.from({ length: 68 }, (_, i) => 18 + ((i * 29) % 44));

export default function PracticePage({
  phrases, selectedId, onSelect, query, scope, onToggleMarker, onEdit, onOpenPending, onRecordAttempt,
}: Props) {
  const [filter, setFilter] = useState('全部');
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const inScope = useMemo(
    () => (scope === 'mastered' ? phrases.filter(p => p.status === 'mastered') : phrases),
    [phrases, scope],
  );
  const current = inScope.find(p => p.id === selectedId) ?? inScope[0];
  const filtered = useMemo(() => inScope.filter(p => {
    const filterOk = filter === '全部' || filter === '待练'
      ? (filter === '全部' || p.status !== 'mastered')
      : p.tag === filter || p.level === filter;
    return filterOk && p.text.toLowerCase().includes(query.toLowerCase());
  }), [inScope, filter, query]);

  const tags = ['全部', ...Array.from(new Set(phrases.map(p => p.tag))), '待练'];

  useEffect(() => () => window.clearInterval(timer.current), []);

  // 切换句子或句子文字变化时，结束播放/录音的展示态（已有记录不受影响）
  useEffect(() => { setRecorded(false); setPlaying(false); }, [selectedId, current?.text]);

  if (!current) {
    return <section className="library"><div className="empty">句子库还是空的，先添加一句吧。</div></section>;
  }

  const blocked = pendingCount(current) > 0;
  const activeHints = current.markers.filter(m => m.state === 'anchored' && m.active);

  const startRecord = () => {
    // 待重标没处理完，不能开始新录音
    if (!recording && blocked) { onOpenPending(current); return; }
    if (recording) {
      setRecording(false);
      window.clearInterval(timer.current);
      setRecorded(true);
      onRecordAttempt(current, seconds);
      return;
    }
    setSeconds(0);
    setRecorded(false);
    setRecording(true);
    timer.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
  };

  return (
    <div className="content-grid">
      <section className="library">
        <div className="section-head">
          <div><h2>句子库</h2><p>点句子里的高亮片段，可以开关重点提示</p></div>
          {scope !== 'mastered' && <button className="ghost" onClick={() => setFilter(f => f === '待练' ? '全部' : '待练')}>只看待练</button>}
        </div>
        <div className="filters">
          {scope === 'mastered'
            ? <span className="chip active">已掌握 {phrases.filter(p => p.status === 'mastered').length}</span>
            : tags.map(t => <button key={t} className={filter === t ? 'chip active' : 'chip'} onClick={() => setFilter(t)}>{t}</button>)}
        </div>
        <div className="phrase-list">
          {filtered.map(p => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(p.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p.id); } }}
              className={p.id === current.id ? 'phrase selected' : 'phrase'}
            >
              <div className="phrase-icon">{p.status === 'mastered' ? <Check size={15}/> : <Mic size={15}/>}</div>
              <div className="phrase-copy">
                <strong>
                  <MarkedText
                    text={p.text}
                    markers={p.markers}
                    compact
                    onToggle={id => { onSelect(p.id); onToggleMarker(p.id, id); }}
                  />
                </strong>
                <span>{p.translation}</span>
                <div className="phrase-meta">
                  <i>{p.tag}</i><i>{p.level}</i>
                  {p.attempts > 0 && <small>{p.attempts} 次练习</small>}
                  {pendingCount(p) > 0 && <small className="pending-badge">{pendingCount(p)} 个待重标</small>}
                </div>
              </div>
              <ChevronRight size={17}/>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty">没有找到匹配句子</div>}
        </div>
      </section>

      <section className="practice">
        <div className="practice-head">
          <div><span className="label">CURRENT PHRASE</span><h2>跟着感觉读</h2></div>
          <div className="practice-head-actions">
            <button className="icon-btn" onClick={() => onEdit(current)} title="编辑句子与重点（可删除）"><PencilLine size={16}/></button>
          </div>
        </div>

        <div className="focus-card">
          <div className="focus-tag">{current.tag} · {current.level} · 点击片段切换提示</div>
          <p className="focus-text">
            <MarkedText
              text={current.text}
              markers={current.markers}
              tone="dark"
              onToggle={id => onToggleMarker(current.id, id)}
            />
          </p>
          <p className="focus-translation">{current.translation}</p>
          <div className="audio-sample">
            <button className="round-btn" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button>
            <div className="sample-wave">{bars.map((h, i) => <i key={i} style={{height: `${h * (playing ? 1.15 : 0.72)}%`}}/>)}</div>
            <span>0:08</span>
          </div>
        </div>

        {blocked && (
          <div className="pending-banner">
            <AlertTriangle size={16}/>
            <p>这句有 <b>{pendingCount(current)}</b> 个重点片段改句后定位不到，重标完成前不能开始新录音。</p>
            <button className="primary small" onClick={() => onOpenPending(current)}>去重标</button>
          </div>
        )}

        <div className="hint-card">
          <div className="hint-card-head"><span>本句重点提示</span><em>{activeHints.length} 项开启</em></div>
          {activeHints.length === 0
            ? <p className="hint-empty">暂无开启的重点。在上方句子中点选高亮片段即可开关。</p>
            : <ol className="hint-list">
                {activeHints.map((m, i) => (
                  <li key={m.id}><b>{i + 1}</b><code>{m.fragment}</code><p>{m.hint}</p></li>
                ))}
              </ol>}
        </div>

        <div className="record-card">
          <div className="record-top">
            <div><span className="label">YOUR RECORDING</span><h3>{recorded ? '录音已保存，听听自己的声音' : '准备好后开始录音'}</h3></div>
            <span className="record-time">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
          </div>
          <div className="record-wave">{bars.slice(5, 58).map((h, i) => <i key={i} className={recording ? 'live' : ''} style={{height: `${h * (recording ? (0.4 + ((i % 5) / 7)) : 0.4)}%`}}/>)}</div>
          <div className="record-actions">
            <button
              className={recording ? 'record-button recording' : 'record-button'}
              onClick={startRecord}
              title={blocked ? '请先完成待重标' : undefined}
            >
              <span>{recording ? <Pause size={16}/> : <Mic size={16}/>}</span>
              {recording ? '结束录音' : recorded ? '重新录音' : blocked ? '先完成重标' : '开始录音'}
            </button>
            {recorded && <button className="secondary" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={15}/> : <Play size={15}/>} 回放</button>}
          </div>
        </div>

        <div className="tip">
          <span>练习小贴士</span>
          <p>{activeHints.length > 0 ? '先按提示把重点片段读准，再回到整句，自然地连起来。' : '放慢速度，先把每个音节读清楚，再自然地连起来。'}</p>
          <RotateCcw size={15}/>
        </div>
      </section>
    </div>
  );
}
