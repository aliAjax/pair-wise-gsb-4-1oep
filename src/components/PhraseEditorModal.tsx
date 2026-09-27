import { useRef, useState } from 'react';
import type { Marker, Phrase } from '../data/types';
import { reconcileMarkers, sortedMarkers, validateFragment } from '../matching/markers';
import MarkedText from './MarkedText';
import { getSelectionOffsets } from './selection';

interface Props {
  phrase: Phrase;
  allocId: () => number;
  onSave: (patch: { text: string; translation: string; markers: Marker[] }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function PhraseEditorModal({ phrase, allocId, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(phrase.text);
  const [translation, setTranslation] = useState(phrase.translation);
  const [markers, setMarkers] = useState<Marker[]>(phrase.markers);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const changeText = (value: string) => {
    setText(value);
    setError(null);
    // 文字一变就重新匹配：还能定位的保留/迁移，定位不到的立即进入待重标
    setMarkers(prev => reconcileMarkers(prev, value).markers);
  };

  const addFromSelection = () => {
    if (!surfaceRef.current) return;
    const sel = getSelectionOffsets(surfaceRef.current);
    if (!sel) {
      setError('先在句子上拖选要重点练的片段，再加提示。');
      return;
    }
    const invalid = validateFragment(text, sel.start, sel.end, markers);
    if (invalid) {
      setError(invalid);
      return;
    }
    const marker: Marker = {
      id: allocId(),
      start: sel.start,
      end: sel.end,
      fragment: text.slice(sel.start, sel.end),
      hint: '',
      active: true,
      state: 'anchored',
    };
    setMarkers(prev => sortedMarkers([...prev, marker]));
    setError(null);
    window.getSelection()?.removeAllRanges();
  };

  const patchMarker = (id: number, patch: Partial<Marker>) =>
    setMarkers(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));

  const removeMarker = (id: number) =>
    setMarkers(prev => prev.filter(m => m.id !== id));

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('句子不能为空。');
      return;
    }
    if (markers.some(m => !m.hint.trim())) {
      setError('每个重点片段都要写一句练习提示。');
      return;
    }
    const { markers: matched } = reconcileMarkers(markers, trimmed);
    onSave({
      text: trimmed,
      translation: translation.trim() || '待补充译文',
      markers: matched.map(m => ({ ...m, hint: m.hint.trim() })),
    });
  };

  const pending = markers.filter(m => m.state === 'pending');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal editor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>编辑句子与重点片段</h2>
          <button className="icon-btn" onClick={onClose} title="关闭">×</button>
        </div>

        <label className="field-label">句子文字
          <textarea
            value={text}
            onChange={e => changeText(e.target.value)}
            className="editor-textarea"
            spellCheck={false}
          />
        </label>

        <div className="field-label">在原句上标记（拖选片段 → 添加重点）</div>
        <div className="mark-surface" ref={surfaceRef}>
          <MarkedText text={text} markers={markers} tone="light" />
        </div>
        <div className="mark-surface-actions">
          <button className="secondary" onMouseDown={e => e.preventDefault()} onClick={addFromSelection}>＋ 把选中片段加成重点</button>
          <span>{markers.filter(m => m.state === 'anchored').length} 个重点{pending.length > 0 && <em className="warn-count">，{pending.length} 个待重标</em>}</span>
        </div>

        <div className="marker-editor-list">
          {sortedMarkers(markers).map(m => (
            <div key={m.id} className={`marker-editor-row ${m.state === 'pending' ? 'pending' : ''}`}>
              <div className="marker-editor-top">
                <code className="marker-frag">{m.fragment || '（空）'}</code>
                {m.state === 'pending'
                  ? <span className="state-pill">改句后找不到 · 待重标</span>
                  : <span className="state-pill ok">已定位</span>}
                <label className="marker-active">
                  <input
                    type="checkbox"
                    checked={m.active}
                    onChange={e => patchMarker(m.id, { active: e.target.checked })}
                  />开启
                </label>
                <button className="icon-btn" title="删除该重点" onClick={() => removeMarker(m.id)}>×</button>
              </div>
              <input
                className="hint-input"
                value={m.hint}
                placeholder="给学员一句怎么读的提示，例如：咬舌尖发 /θ/"
                onChange={e => patchMarker(m.id, { hint: e.target.value })}
              />
            </div>
          ))}
          {markers.length === 0 && <p className="no-marker-hint">还没有重点片段。在上面的句子里拖选一段，学员就知道该盯哪里练。</p>}
        </div>

        <label className="field-label">译文
          <input
            className="hint-input"
            value={translation}
            onChange={e => setTranslation(e.target.value)}
            placeholder="句子的中文译文"
          />
        </label>

        {error && <p className="form-error">{error}</p>}
        {pending.length > 0 && !error && (
          <p className="form-warn">有 {pending.length} 个片段在新文字里定位不到，保存后需先完成重标，才能开始新录音。</p>
        )}

        <div className="modal-actions editor-actions">
          {confirmDelete ? (
            <span className="delete-confirm">
              确认删除这句？练习记录仍会保留
              <button className="secondary danger" onClick={onDelete}>确认删除</button>
              <button className="ghost" onClick={() => setConfirmDelete(false)}>取消</button>
            </span>
          ) : (
            <button className="ghost danger-text" onClick={() => setConfirmDelete(true)}>删除句子</button>
          )}
          <span className="editor-spacer" />
          <button className="secondary" onClick={onClose}>取消</button>
          <button className="primary" onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
}
