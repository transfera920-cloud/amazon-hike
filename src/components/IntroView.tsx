import React from 'react';
import { ArrowLeft, ExternalLink, BookOpen } from 'lucide-react';
import type { IntroItem } from '../types.js';
import { normalizeUrl } from '../utils/url.js';

interface IntroViewProps {
  intros: IntroItem[];
  onBack: () => void;
}

export const IntroView: React.FC<IntroViewProps> = ({ intros, onBack }) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intros.map((item) => {
            const url = normalizeUrl(item.url);

            return (
              <a
                key={item.id}
                href={url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-neutral-800 rounded bg-neutral-900/40 p-5 hover:border-neutral-700/80 hover:bg-neutral-900/80 transition-all flex flex-col justify-between"
                id={`intro-item-${item.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h2>
                    <ExternalLink size={14} className="text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-1 transition-colors" />
                  </div>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-neutral-800/60 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                  <span>閱讀完整專文</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
};

