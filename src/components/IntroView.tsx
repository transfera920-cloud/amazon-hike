import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { IntroItem } from '../types.js';
import { normalizeUrl } from '../utils/url.js';

interface IntroViewProps {
  intros: IntroItem[];
  onBack: () => void;
}

export const IntroView: React.FC<IntroViewProps> = ({ intros, onBack }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="登山入門專區">
      {/* Breadcrumb / Back button (回到上一層) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-1"
          id="intro-back-btn"
        >
          <ArrowLeft size={14} />
          <span>回到上一頁</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              登山入門
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              高山健行觀念、裝備配置與山林實用常識專題指南
            </p>
          </div>
        </div>
      </div>

      {/* Articles List */}
      {intros.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-800 rounded bg-neutral-900/40">
          目前暫無登山入門專文資料
        </div>
      ) : (
        <div className="space-y-4">
          {intros.map((item) => {
            const hasExternalUrl = Boolean(item.url && item.url.trim());
            const directUrl = hasExternalUrl ? normalizeUrl(item.url) : '';
            const isExpanded = expandedId === item.id;

            return (
              <article
                key={item.id}
                className="border border-neutral-800 rounded bg-neutral-900/40 p-5 hover:border-neutral-700/80 transition-colors space-y-3"
              >
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-100">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Inline expanded content if present and no external url */}
                {isExpanded && item.content && (
                  <div className="pt-3 border-t border-neutral-800/80 text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-950/40 p-3 rounded">
                    {item.content}
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2 flex items-center justify-between">
                  {hasExternalUrl ? (
                    <a
                      href={directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors"
                      id={`read-full-${item.id}`}
                    >
                      <span>閱讀完整專文</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : item.content ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span>{isExpanded ? '收合內容' : '閱讀專文內容'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};
