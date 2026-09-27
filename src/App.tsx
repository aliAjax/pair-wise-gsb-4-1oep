import { useEffect, useState } from 'react';
import { Check, ChevronRight, Clock3, Mic, Volume2 } from 'lucide-react';
import { usePracticeStore } from './data/store';
import PracticeView from './views/PracticeView';
import RecordsView from './views/RecordsView';

type View = 'practice' | 'records';

export default function App() {
  const store = usePracticeStore();
  const { phrases, records } = store;
  const [view, setView] = useState<View>('practice');
  const [selected, setSelected] = useState(phrases[0]?.id ?? 0);
  const [filter, setFilter] = useState('全部');
  const [query, setQuery] = useState('');

  // 句子被删除后，选中项回退到列表第一句
  useEffect(() => {
    if (phrases.length > 0 && !phrases.some(p => p.id === selected)) {
      setSelected(phrases[0].id);
    }
  }, [phrases, selected]);

  const practiceAgain = (phraseId: number) => {
    setSelected(phraseId);
    setView('practice');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Volume2 size={19}/></div>
          <div><strong>声线练习室</strong><span>Pronounce / practice</span></div>
        </div>
        <div className="side-label">我的练习</div>
        <nav>
          <button className={view === 'practice' && filter !== '已掌握' ? 'side-link active' : 'side-link'} onClick={() => { setView('practice'); setFilter('全部'); }}>
            <Mic size={17}/>练习库 <b>{phrases.length}</b>
          </button>
          <button className={view === 'records' ? 'side-link active' : 'side-link'} onClick={() => setView('records')}>
            <Clock3 size={17}/>练习记录 <b>{records.length}</b>
          </button>
          <button className={view === 'practice' && filter === '已掌握' ? 'side-link active' : 'side-link'} onClick={() => { setView('practice'); setFilter('已掌握'); }}>
            <Check size={17}/>已掌握 <b>{phrases.filter(p => p.status === 'mastered').length}</b>
          </button>
        </nav>
        <div className="sidebar-foot">
          <div className="streak"><span>连续练习</span><strong>5 <small>天</small></strong><i>↗ +2</i></div>
          <div className="profile"><div className="avatar">YL</div><div><strong>Yuki Lin</strong><span>普通计划</span></div><ChevronRight size={16}/></div>
        </div>
      </aside>
      {view === 'practice' ? (
        <PracticeView
          store={store}
          selected={selected}
          onSelect={setSelected}
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
        />
      ) : (
        <RecordsView records={records} phrases={phrases} onPracticeAgain={practiceAgain} />
      )}
    </div>
  );
}
