import React from 'react';
import { ArrowLeft, ExternalLink, Wrench } from 'lucide-react';
import type { ToolItem } from '../types.js';
import { normalizeUrl } from '../utils/url.js';

interface ToolsViewProps {
  tools: ToolItem[];
  onBack: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ tools, onBack }) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="登山工具專區">
      {/* Breadcrumb / Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-1"
          id="tools-back-btn"
        >
          <ArrowLeft size={14} />
          <span>回到上一頁</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
            <Wrench size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              登山工具
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              高山氣象查詢、入山入園申辦、步道路況與實用數位山林工具
            </p>
          </div>
        </div>
      </div>

      {/* Tools List */}
      {tools.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-800 rounded bg-neutral-900/40">
          目前暫無登山工具資料
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const url = normalizeUrl(tool.url);

            return (
              <a
                key={tool.id}
                href={url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-neutral-800 rounded bg-neutral-900/40 p-5 hover:border-neutral-700/80 hover:bg-neutral-900/80 transition-all flex flex-col justify-between"
                id={`tool-item-${tool.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                      {tool.title}
                    </h2>
                    <ExternalLink size={14} className="text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-1 transition-colors" />
                  </div>
                  {tool.description && (
                    <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                      {tool.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-neutral-800/60 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                  <span>前往工具服務</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
};
