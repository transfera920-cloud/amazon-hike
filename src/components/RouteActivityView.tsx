import React, { useEffect } from 'react';
import { ArrowLeft, Compass, ExternalLink, Link2 } from 'lucide-react';
import type { NavButtonItem, NavButtonActivity } from '../types.js';

interface RouteActivityViewProps {
  activity: NavButtonActivity;
  parentButton?: NavButtonItem;
  onBack: () => void;
  onNavigateHome: () => void;
}

export const RouteActivityView: React.FC<RouteActivityViewProps> = ({
  activity,
  parentButton,
  onBack,
  onNavigateHome,
}) => {
  // Update document title and meta description on client side for SPA navigation
  useEffect(() => {
    document.title = `${activity.title} | 亞馬遜國家山岳協會 | Amazon Alpine Association`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        activity.description || `${activity.title} - 亞馬遜國家山岳協會登山行程活動說明與完整報名資訊。`
      );
    }
  }, [activity]);

  // Split description by double newlines into paragraphs
  const paragraphs = activity.description
    ? activity.description.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  const internalUrl = `https://amazon-hike.com/route/${activity.slug}`;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8" aria-label={activity.title}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="活動導覽路徑" className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-emerald-400 transition-colors"
          >
            首頁
          </button>
          <span>/</span>
          {parentButton ? (
            <button
              type="button"
              onClick={onBack}
              className="hover:text-emerald-400 transition-colors"
            >
              {parentButton.title}
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="hover:text-emerald-400 transition-colors"
            >
              活動列表
            </button>
          )}
          <span>/</span>
          <span className="text-neutral-200 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {activity.title}
          </span>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors py-1.5 px-2.5 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
          id="route-activity-back-btn"
        >
          <ArrowLeft size={14} />
          <span>返回活動列表</span>
        </button>
      </nav>

      {/* Main Activity Article Container */}
      <article className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-6 sm:p-10 shadow-lg">
        {/* Header */}
        <header className="border-b border-neutral-800 pb-6 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2.5">
            <Compass size={16} />
            <span>登山健行行程</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight leading-tight">
            {activity.title}
          </h1>

          {/* Internal Canonical / Permalink display for SEO */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-3 pt-3 border-t border-neutral-800/40">
            <Link2 size={13} className="text-neutral-600 shrink-0" />
            <span className="break-all">主站內部網址：{internalUrl}</span>
          </div>
        </header>

        {/* Activity Description */}
        <section className="space-y-4 text-neutral-200 text-sm sm:text-base leading-relaxed mb-8">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line text-neutral-300">
                {p}
              </p>
            ))
          ) : (
            <p className="text-neutral-400 italic">此行程暫無額外文字說明，請直接點選下方按鈕前往完整行程與報名頁面。</p>
          )}
        </section>

        {/* Call to Action: 完整行程／報名 */}
        <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-neutral-400">準備好踏上山林旅程了嗎？</div>
            <div className="text-sm font-semibold text-neutral-200">
              點擊前往外部專屬報名表與詳細行程資訊
            </div>
          </div>

          <a
            href={activity.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base transition-colors shadow-lg shadow-emerald-950/60"
            id="activity-external-signup-btn"
          >
            <span>完整行程／報名</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </article>
    </main>
  );
};
