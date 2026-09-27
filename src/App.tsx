import { useEffect, useState } from 'react';
import { Check, ChevronRight, Clock3, Mic, Plus, Search, Volume2 } from 'lucide-react';
import type { Attempt, Marker, Phrase } from './data/types';
import { loadData, makePhraseId, saveAttempts, saveNextId, savePhrases } from './data/storage';
import AddPhraseModal from './components/AddPhraseModal';
import PhraseEditorModal from './components/PhraseEditorModal';
import PendingReviewModal from './components/PendingReviewModal';
import PracticePage from './pages/PracticePage';
import HistoryPage from './pages/HistoryPage';

type View = 'practice' | 'history' | 'mastered';

const initial = loadData();

export default function App() {
  const [phrases, setPhrases] = useState<Phrase[]>(initial.phrases);
  const [attempts, setAttempts] = useState<Attempt[]>(initial.attempts);
  const [nextId, setNextId] = useState(initial.nextId);
  const [view, setView] = useState<View>('practice');
  const [selectedId, setSelectedId] = useState(initial.phrases[0]?.id ?? 0);
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Phrase | null>(null);
  const [pendingPhrase, setPendingPhrase] = useState<Phrase | null>(null);

  useEffect(() => savePhrases(phrases), [phrases]);
  useEffect(() => saveAttempts(attempts), [attempts]);
  useEffect(() => saveNextId(nextId), [nextId]);

  // 列表被筛空等情况下，选中句始终指向一条真实存在的句子
  useEffect(() => {
    if (!phrases.some(p => p.id === selectedId)) {
      setSelectedId(phrases[0]?.id ?? 0);
    }
  }, [phrases, selectedId]);

  const allocId = () => {
    const id = nextId;
    setNextId(n => n + 1);
    return id;
  };

  const selected = phrases.find(p => p.id === selectedId);
  const masteredCount = phrases.filter(p => p.status === 'mastered').length;
  const totalPending = phrases.reduce((n, p) => n + p.markers.filter(m => m.state === 'pending').length, 0);

  const updatePhrase = (id: number, patch: Partial<Phrase>) =>
    setPhrases(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const toggleMarker = (phraseId: number, markerId: number) =>
    updatePhrase(phraseId, {
      // 卡片与练习区共用同一份标记，点这里切换，另一处也同步
      markers: (phrases.find(p => p.id === phraseId)?.markers ?? []).map(m =>
        m.id === markerId ? { ...m, active: !m.active } : m,
      ),
    });

  const addPhrase = (text: string, translation: string) => {
    const id = makePhraseId();
    const phrase: Phrase = {
      id, text, translation: translation || '待补充译文', tag: '自定义', level: '入门',
      status: 'new', attempts: 0, markers: [],
    };
    setPhrases(ps => [...ps, phrase]);
    setSelectedId(id);
    setView('practice');
    setShowAdd(false);
  };

  const saveEdit = (patch: { text: string; translation: string; markers: Marker[] }) => {
    if (!editing) return;
    const id = editing.id;
    const pending = patch.markers.filter(m => m.state === 'pending').length;
    setPhrases(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));
    setEditing(null);
    // 还有定位不到的片段：立刻进待重标，处理完前不能开始新录音
    const next: Phrase = { ...editing, ...patch };
    setPendingPhrase(pending > 0 ? next : null);
  };

  const deletePhrase = () => {
    if (!editing) return;
    const id = editing.id;
    setPhrases(ps => ps.filter(p => p.id !== id));
    setEditing(null);
    setPendingPhrase(null);
    setSelectedId(curr => (curr === id ? phrases.find(p => p.id !== id)?.id ?? 0 : curr));
  };

  // PendingReviewModal 里句子内容不会变，只处理标记，直接用最新数据回写
  const livePending = pendingPhrase ? phrases.find(p => p.id === pendingPhrase.id) ?? null : null;
  const changePendingMarkers = (markers: Marker[]) => {
    if (!pendingPhrase) return;
    updatePhrase(pendingPhrase.id, { markers });
  };

  const recordAttempt = (phrase: Phrase, seconds: number): Attempt => {
    const attempt: Attempt = {
      id: nextId,
      phraseId: phrase.id,
      // 快照：练习记录永远保留录音当时的句子与标记
      phraseText: phrase.text,
      translation: phrase.translation,
      markers: phrase.markers
        .filter(m => m.state === 'anchored')
        .map(m => ({ fragment: m.fragment, hint: m.hint, active: m.active })),
      seconds,
      at: Date.now(),
    };
    setNextId(n => n + 1);
    setAttempts(list => [attempt, ...list]);
    setPhrases(ps => ps.map(p =>
      p.id === phrase.id ? { ...p, attempts: p.attempts + 1, status: 'practice', last: '刚刚' } : p,
    ));
    return attempt;
  };

  const openEditor = (phrase: Phrase) => setEditing(phrase);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Volume2 size={19}/></div>
          <div><strong>声线练习室</strong><span>Pronounce / practice</span></div>
        </div>
        <div className="side-label">我的练习</div>
        <nav>
          <button className={view === 'practice' ? 'side-link active' : 'side-link'} onClick={() => setView('practice')}>
            <Mic size={17}/>练习库 <b>{phrases.length}</b>
          </button>
          <button className={view === 'history' ? 'side-link active' : 'side-link'} onClick={() => setView('history')}>
            <Clock3 size={17}/>练习记录 <b>{attempts.length}</b>
          </button>
          <button className={view === 'mastered' ? 'side-link active' : 'side-link'} onClick={() => setView('mastered')}>
            <Check size={17}/>已掌握 <b>{masteredCount}</b>
          </button>
        </nav>
        {totalPending > 0 && (
          <button className="pending-side-note" onClick={() => {
            const first = phrases.find(p => p.markers.some(m => m.state === 'pending'));
            if (first) { setView('practice'); setSelectedId(first.id); setPendingPhrase(first); }
          }}>
            {totalPending} 个重点片段待重标，点此处理
          </button>
        )}
        <div className="sidebar-foot">
          <div className="streak"><span>连续练习</span><strong>5 <small>天</small></strong><i>↗ +2</i></div>
          <div className="profile"><div className="avatar">YL</div><div><strong>Yuki Lin</strong><span>普通计划</span></div><ChevronRight size={16}/></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">WEDNESDAY, SEP 12</p>
            <h1>{view === 'history' ? '练习记录' : view === 'mastered' ? '已经拿下的句子' : '今天练什么？'}</h1>
          </div>
          <div className="top-actions">
            <div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索句子"/></div>
            <button className="primary" onClick={() => setShowAdd(true)}><Plus size={17}/>添加句子</button>
          </div>
        </header>

        <section className="stats">
          <div><span>本周完成</span><strong>12 <em>/ 20</em></strong><div className="progress"><i style={{width: '60%'}}/></div></div>
          <div><span>练习时长</span><strong>38 <em>分钟</em></strong><small>比上周多 8 分钟</small></div>
          <div><span>最佳发音</span><strong>92 <em>分</em></strong><small className="green">↑ 6 分</small></div>
        </section>

        {view === 'history' ? (
          <HistoryPage attempts={attempts}/>
        ) : selected ? (
          <PracticePage
            phrases={phrases}
            selectedId={selectedId}
            onSelect={setSelectedId}
            query={query}
            scope={view === 'mastered' ? 'mastered' : 'all'}
            onToggleMarker={toggleMarker}
            onEdit={openEditor}
            onOpenPending={setPendingPhrase}
            onRecordAttempt={recordAttempt}
          />
        ) : (
          <section className="library"><div className="empty">句子库还是空的，点右上角“添加句子”开始吧。</div></section>
        )}
      </main>

      {showAdd && <AddPhraseModal onAdd={addPhrase} onClose={() => setShowAdd(false)}/>}

      {editing && (
        <PhraseEditorModal
          phrase={editing}
          allocId={allocId}
          onSave={saveEdit}
          onDelete={deletePhrase}
          onClose={() => setEditing(null)}
        />
      )}

      {livePending && !editing && (
        <PendingReviewModal
          phrase={livePending}
          onChange={changePendingMarkers}
          onEditSentence={() => { setEditing(livePending); setPendingPhrase(null); }}
          onClose={() => setPendingPhrase(null)}
        />
      )}
    </div>
  );
}
