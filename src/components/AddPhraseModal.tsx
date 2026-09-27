import { useState } from 'react';

interface Props {
  onAdd: (text: string, translation: string) => void;
  onClose: () => void;
}

export default function AddPhraseModal({ onAdd, onClose }: Props) {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, translation.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>添加练习句子</h2>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        <label className="field-label">句子
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="例如：I can make this happen."
            className="editor-textarea small"
            spellCheck={false}
          />
        </label>
        <label className="field-label">译文（可选）
          <input
            className="hint-input"
            value={translation}
            onChange={e => setTranslation(e.target.value)}
            placeholder="例如：我能把这件事做成。"
          />
        </label>
        <p className="no-marker-hint">加入后可在练习区点“编辑句子”，为它添加重点片段和提示。</p>
        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>取消</button>
          <button className="primary" onClick={submit} disabled={!text.trim()}>加入句子库</button>
        </div>
      </div>
    </div>
  );
}
