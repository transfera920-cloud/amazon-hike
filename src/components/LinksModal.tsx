import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { CardItem } from '../types';

interface LinksModalProps {
  card: CardItem | null;
  onClose: () => void;
}

export const LinksModal: React.FC<LinksModalProps> = ({ card, onClose }) => {
  if (!card) return null;
  const links = (card.links || []).filter((l) => l.label?.trim() && l.url?.trim());

  // 依分類分組，保留原本順序
  const groups: { name: string; items: typeof links }[] = [];
  links.forEach((l) => {
    const name = (l.group || '').trim();
    const g = groups.find((x) => x.name === name);
    if (g) g.items.push(l);
    else groups.push({ name, items: [l] });
  });

  const toHref = (u: string) => {
    const t = u.trim();
    return /^(https?:|tel:|mailto:|line:)/i.test(t) ? t : `https://${t}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-emerald-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0f3822] text-white px-5 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-lg truncate">{card.title}</h3>
            {card.desc && !/^https?:\/\//i.test(card.desc.trim()) && (
              <p className="text-xs text-emerald-200 truncate">{card.desc}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {groups.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">尚未設定連結</p>
          )}
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.name && (
                <div className="text-xs font-bold text-emerald-800 mb-1.5">{g.name}</div>
              )}
              <div className="space-y-2">
                {g.items.map((l, i) => (
                  <a
                    key={i}
                    href={toHref(l.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-500 text-emerald-900 font-semibold text-sm transition"
                  >
                    <span>{l.label}</span>
                    <ExternalLink className="w-4 h-4 shrink-0 text-emerald-600" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
