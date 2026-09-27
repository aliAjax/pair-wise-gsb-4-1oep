import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Mic, Pause, Pencil, Play, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import MarkedText from '../components/MarkedText';
import type { PracticeStore } from '../data/store';

type Props = {
  store: PracticeStore;
  selected: number;
  onSelect: (id: number) => void;
  query: string;
  onQuery: (q: string) => void;
  filter: string;
  onFilter: (f: string) => void;
};

const bars = Array.from({ length: 68 }, (_, i) => 18 + ((i * 29) % 44));

export default function PracticeView({ store, selected, onSelect, query, onQuery, filter, onFilter }: Props) {
  const { phrases } = store;
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [fragment, setFragment] = useState('');
  const [hint, setHint] = useState('');
  const [markerError, setMarkerError] = useState('');
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, string>>({});
  const [pendingError, setPendingError] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const current = phrases.find(p => p.id === selected) ?? phrases[0];
  const filtered = phrases.filter(p =>
    (filter === '全部' || p.tag === filter || p.level === filter ||
      (filter === '待练' && p.status !== 'mastered') ||
      (filter === '已掌握' && p.status === 'mastered')) &&
    (p.text.toLowerCase().includes(query.toLowerCase()) || p.translation.includes(query)));
  const tags = ['全部', ...Array.from(new Set(phrases.map(p => p.tag)))];
  const pendingCount = current?.pendingMarkers.length ?? 0;

  useEffect(() => () => window.clearInterval(timer.current), []);
  // 切换句子时重置练习状态
  useEffect(() => {
    window.clearInterval(timer.current);
    setRecording(false);
    setRecorded(false);
    setSeconds(0);
    setMarkerError('');
    setPendingError('');
  }, [current?.id]);

  const startRecord = () => {
    if (!current) return;
    if (recording) {
      setRecording(false);
      window.clearInterval(timer.current);
      setRecorded(true);
      store.finishRecording(current.id, seconds);
      return;
    }
    if (pendingCount > 0) return; // 待重标未处理完，不能开始新录音
    setSeconds(0);
    setRecording(true);
    timer.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const addPhrase = () => {
    const id = store.addPhrase(newText);
    if (id === null) return;
    onSelect(id);
    setNewText('');
    setShowAdd(false);
  };

  const openEdit = () => {
    if (!current) return;
    setEditText(current.text);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!current || !editText.trim()) return;
    store.updatePhraseText(current.id, editText.trim());
    setEditing(false);
  };

  const submitMarker = () => {
    if (!current) return;
    const err = store.addMarker(current.id, fragment, hint);
    setMarkerError(err ?? '');
    if (!err) {
      setFragment('');
      setHint('');
    }
  };

  const retryPending = (markerId: string, fallback: string) => {
    if (!current) return;
    const err = store.resolvePending(current.id, markerId, pendingDrafts[markerId] ?? fallback, false);
    setPendingError(err ?? '');
  };

  const dropPending = (markerId: string) => {
    if (!current) return;
    store.resolvePending(current.id, markerId, '', true);
    setPendingError('');
  };

  return (
    <main className="main">
      <header className="topbar">
        <div><p className="eyebrow">WEDNESDAY, SEP 12</p><h1>今天练什么？</h1></div>
        <div className="top-actions">
          <div className="search"><Search size={16}/><input value={query} onChange={e => onQuery(e.target.value)} placeholder="搜索句子"/></div>
          <button className="primary" onClick={() => setShowAdd(true)}><Plus size={17}/>添加句子</button>
        </div>
      </header>
      <section className="stats">
        <div><span>本周完成</span><strong>12 <em>/ 20</em></strong><div className="progress"><i style={{ width: '60%' }}/></div></div>
        <div><span>练习时长</span><strong>38 <em>分钟</em></strong><small>比上周多 8 分钟</small></div>
        <div><span>最佳发音</span><strong>92 <em>分</em></strong><small className="green">↑ 6 分</small></div>
      </section>
      <div className="content-grid">
        <section className="library">
          <div className="section-head">
            <div><h2>句子库</h2><p>选择一句开始你的声音训练</p></div>
            <button className="ghost" onClick={() => onFilter('待练')}>只看待练</button>
          </div>
          <div className="filters">{tags.map(t => <button key={t} className={filter === t ? 'chip active' : 'chip'} onClick={() => onFilter(t)}>{t}</button>)}</div>
          <div className="phrase-list">
            {filtered.map(p => (
              <div key={p.id} role="button" onClick={() => onSelect(p.id)} className={p.id === selected ? 'phrase selected' : 'phrase'}>
                <div className="phrase-icon">{p.status === 'mastered' ? <Check size={15}/> : <Mic size={15}/>}</div>
                <div className="phrase-copy">
                  <strong><MarkedText text={p.text} markers={p.markers}/></strong>
                  <span>{p.translation}</span>
                  <div className="phrase-meta">
                    <i>{p.tag}</i><i>{p.level}</i>
                    {p.pendingMarkers.length > 0 && <i className="warn">待重标 {p.pendingMarkers.length}</i>}
                    {p.attempts > 0 && <small>{p.attempts} 次练习</small>}
                  </div>
                </div>
                <ChevronRight size={17}/>
              </div>
            ))}
            {filtered.length === 0 && <div className="empty">没有找到匹配句子</div>}
          </div>
        </section>
        {current && (
          <section className="practice">
            <div className="practice-head">
              <div><span className="label">CURRENT PHRASE</span><h2>跟着感觉读</h2></div>
              <div className="practice-actions">
                <button className="icon-btn" onClick={openEdit} title="修改句子"><Pencil size={17}/></button>
                <button className="icon-btn" onClick={() => store.removePhrase(current.id)} title="删除句子"><Trash2 size={17}/></button>
              </div>
            </div>
            <div className="focus-card">
              <div className="focus-tag">{current.tag} · {current.level}</div>
              <p className="focus-text"><MarkedText text={current.text} markers={current.markers}/></p>
              <p className="focus-translation">{current.translation}</p>
              <div className="audio-sample">
                <button className="round-btn" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button>
                <div className="sample-wave">{bars.map((h, i) => <i key={i} style={{ height: `${h * (playing ? 1.15 : 0.72)}%` }}/>)}</div>
                <span>0:08</span>
              </div>
            </div>
            {current.pendingMarkers.length > 0 && (
              <div className="pending-panel">
                <div className="pending-head">
                  <AlertTriangle size={14}/>
                  <strong>{current.pendingMarkers.length} 条重点片段待重标</strong>
                  <span>处理完之前不能开始新录音</span>
                </div>
                {current.pendingMarkers.map(m => (
                  <div className="pending-item" key={m.id}>
                    <div className="pending-info">
                      <strong>“{m.fragment}”</strong>
                      <span>{m.hint}</span>
                    </div>
                    <input
                      value={pendingDrafts[m.id] ?? m.fragment}
                      onChange={e => setPendingDrafts(d => ({ ...d, [m.id]: e.target.value }))}
                      placeholder="按新句子修正片段"
                    />
                    <div className="pending-actions">
                      <button className="secondary" onClick={() => retryPending(m.id, m.fragment)}>重新定位</button>
                      <button className="ghost" onClick={() => dropPending(m.id)}>放弃</button>
                    </div>
                  </div>
                ))}
                {pendingError && <p className="form-error">{pendingError}</p>}
              </div>
            )}
            <div className="marker-panel">
              <div className="marker-panel-head">
                <span className="label">重点片段 · 点击句中标记可切换提示</span>
                <span className="marker-count">{current.markers.length} 个</span>
              </div>
              {current.markers.length > 0 && (
                <div className="marker-list">
                  {current.markers.map(m => (
                    <span className="marker-chip" key={m.id}>
                      <strong>{m.fragment}</strong>
                      <em>{m.hint}</em>
                      <button className="chip-x" onClick={() => store.removeMarker(current.id, m.id)} title="移除标记">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="marker-form">
                <input value={fragment} onChange={e => setFragment(e.target.value)} placeholder="重点片段（须能在句中定位）"/>
                <input value={hint} onChange={e => setHint(e.target.value)} placeholder="提示，如：th 咬舌尖"/>
                <button className="secondary" onClick={submitMarker}>添加标记</button>
              </div>
              {markerError && <p className="form-error">{markerError}</p>}
            </div>
            <div className="record-card">
              <div className="record-top">
                <div><span className="label">YOUR RECORDING</span><h3>{recorded ? '录音已保存，听听自己的声音' : '准备好后开始录音'}</h3></div>
                <span className="record-time">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
              </div>
              <div className="record-wave">{bars.slice(5, 58).map((h, i) => <i key={i} className={recording ? 'live' : ''} style={{ height: `${h * (recording ? (0.4 + ((i % 5) / 7)) : 0.4)}%` }}/>)}</div>
              {pendingCount > 0 && (
                <p className="record-blocked"><AlertTriangle size={13}/>有 {pendingCount} 条重点片段待重标，处理完才能开始新录音</p>
              )}
              <div className="record-actions">
                <button className={recording ? 'record-button recording' : 'record-button'} onClick={startRecord} disabled={!recording && pendingCount > 0}>
                  <span>{recording ? <Pause size={16}/> : <Mic size={16}/>}</span>
                  {recording ? '结束录音' : recorded ? '重新录音' : '开始录音'}
                </button>
                {recorded && <button className="secondary" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={15}/> : <Play size={15}/>} 回放</button>}
              </div>
            </div>
            <div className="tip"><span>练习小贴士</span><p>放慢速度，先把每个音节读清楚，再自然地连起来。</p><RotateCcw size={15}/></div>
          </section>
        )}
      </div>
      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h2>添加练习句子</h2><button className="icon-btn" onClick={() => setShowAdd(false)}>×</button></div>
            <label>英文句子<textarea autoFocus value={newText} onChange={e => setNewText(e.target.value)} placeholder="例如：I can make this happen."/></label>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowAdd(false)}>取消</button>
              <button className="primary" onClick={addPhrase}>加入句子库</button>
            </div>
          </div>
        </div>
      )}
      {editing && current && (
        <div className="modal-backdrop" onClick={() => setEditing(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h2>修改句子</h2><button className="icon-btn" onClick={() => setEditing(false)}>×</button></div>
            <label>英文句子<textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)}/></label>
            <p className="modal-note">保存后，仍能定位的重点片段会自动保留并重新对齐；定位不到的片段会移入「待重标」，处理完之前不能开始新录音。已保存的练习记录仍保留当时的句子。</p>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setEditing(false)}>取消</button>
              <button className="primary" onClick={saveEdit}>保存修改</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
