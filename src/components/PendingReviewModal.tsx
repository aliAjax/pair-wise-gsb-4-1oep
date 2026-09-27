import { useRef, useState } from 'react';
import type { Marker, Phrase } from '../data/types';
import { autoLocatePending, relocatePending, sortedMarkers } from '../matching/markers';
import { getSelectionOffsets } from './selection';

interface Props {
  phrase: Phrase;
  onChange: (markers: Marker[]) => void;
  onEditSentence: () => void;
  onClose: () => void;
}

/**
 * 待重标清单：改句后定位不到的片段都在这里逐条处理。
 * 处理完之前练习区不允许开始新录音（由 PracticePage 的录音按钮把关）。
 */
export default function PendingReviewModal({ phrase, onChange, onEditSentence, onClose }: Props) {
  const pending = phrase.markers.filter(m => m.state === 'pending');
  const [activeId, setActiveId] = useState<number | null>(pending[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const active = phrase.markers.find(m => m.id === activeId) ?? null;

  const apply = (next: Marker[] | null, errMsg: string) => {
    if (!next) {
      setError(errMsg);
      return;
    }
    const rest = next.filter(m => m.state === 'pending');
    setError(null);
    onChange(next);
    if (rest.length === 0) {
      setActiveId(null);
      onClose();
    } else {
      setActiveId(cur => (rest.some(m => m.id === cur) ? cur : rest[0].id));
    }
  };

  const handleAuto = () => {
    if (!active) return;
    apply(autoLocatePending(phrase.markers, active.id, phrase.text), `原文字里找不到不重叠的 “${active.fragment}”，请用拖选手动重标。`);
  };

  const handleSelect = () => {
    if (!active || !surfaceRef.current) return;
    const range = getSelectionOffsets(surfaceRef.current);
    if (!range) {
      setError('请先在下方句子上拖选这个片段新的位置。');
      return;
    }
    apply(relocatePending(phrase.markers, active.id, range, phrase.text), '选区和已有重点重叠了，请换一处。');
  };

  const handleDiscard = () => {
    if (!active) return;
    const next = phrase.markers.filter(m => m.id !== active.id);
    const rest = next.filter(m => m.state === 'pending');
    setError(null);
    onChange(next);
    if (rest.length === 0) {
      onClose();
    } else {
      setActiveId(rest[0].id);
    }
  };

  const located = sortedMarkers(phrase.markers.filter(m => m.state === 'anchored'));

  return (
    <div className="modal-backdrop">
      <div className="modal pending-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>重标重点片段</h2>
          <button className="icon-btn" onClick={onClose} title="稍后处理">×</button>
        </div>

        <p className="pending-intro">
          句子改过之后，<b>{pending.length}</b> 个片段在新文字里定位不到。全部处理完才能开始新录音；已经发出的练习记录不受影响。
        </p>

        <ul className="pending-list">
          {pending.map(m => (
            <li key={m.id}>
              <button
                className={m.id === activeId ? 'pending-item active' : 'pending-item'}
                onClick={() => { setActiveId(m.id); setError(null); }}
              >
                <code>{m.fragment}</code>
                <span>{m.hint}</span>
              </button>
            </li>
          ))}
        </ul>

        {active && (
          <>
            <div className="field-label">在句中拖选 “{active.fragment}” 现在的位置（也可覆盖成新片段）</div>
            <div className="mark-surface relocating" ref={surfaceRef}>
              {phrase.text}
            </div>
            <div className="mark-surface-actions">
              <button className="primary" onMouseDown={e => e.preventDefault()} onClick={handleSelect}>把选区设为该重点</button>
              <button className="secondary" onClick={handleAuto}>自动定位原片段</button>
              <button className="ghost danger-text" onClick={handleDiscard}>放弃这个重点</button>
            </div>
            {error && <p className="form-error">{error}</p>}
          </>
        )}

        {pending.length === 0 && <p className="form-ok">所有重点片段都已重新定位，可以开始练习了。</p>}

        <div className="pending-located">
          <span>已定位 {located.length} 个</span>
          <div className="pending-located-tags">
            {located.map(m => <code key={m.id}>{m.fragment}</code>)}
          </div>
        </div>

        <div className="modal-actions">
          <button className="ghost" onClick={onEditSentence}>回去改句子文字</button>
          <span className="editor-spacer" />
          <button className="secondary" onClick={onClose} disabled={pending.length > 0}>
            {pending.length > 0 ? `还有 ${pending.length} 个待重标` : '完成'}
          </button>
        </div>
      </div>
    </div>
  );
}
