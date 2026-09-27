import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import type { Marker } from '../data/phrases';
import { splitByMarkers } from '../lib/marking';

type Props = { text: string; markers: Marker[] };

/** 按同一份标记渲染句子：句子卡片、练习区、练习记录共用；点击标记可切换提示 */
export default function MarkedText({ text, markers }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const parts = splitByMarkers(text, markers);
  const open = markers.find(m => m.id === openId);
  return (
    <span className="marked-text">
      {parts.map((part, i) => {
        const marker = part.marker;
        if (!marker) return <span key={`t${i}`}>{part.text}</span>;
        return (
          <button
            key={marker.id}
            type="button"
            className={openId === marker.id ? 'marker open' : 'marker'}
            onClick={e => {
              e.stopPropagation();
              setOpenId(id => (id === marker.id ? null : marker.id));
            }}
          >
            {part.text}
          </button>
        );
      })}
      {open && (
        <span className="marker-hint">
          <Lightbulb size={12}/>
          <b>“{open.fragment}”</b>
          {open.hint}
        </span>
      )}
    </span>
  );
}
