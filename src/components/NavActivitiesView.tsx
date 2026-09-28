import React from 'react';
import { ArrowLeft, Compass, ExternalLink, Link2, ChevronRight } from 'lucide-react';
import { normalizeUrl } from '../utils/url.js';
import { getCategorySlug } from '../utils/activitySeo.js';
import type { NavButtonItem, NavButtonActivity, NavButtonEntry } from '../types.js';

interface NavActivitiesViewProps {
  button: NavButtonItem;
  activities: NavButtonActivity[];
  entries?: NavButtonEntry[];
  onBack: () => void;
  onSelectActivity?: (slug: string) => void;
  onNavigateEntry?: (url: string) => void;
}

export const NavActivitiesView: React.FC<NavActivitiesViewProps> = ({
  button,
  activities,
  entries,
  onBack,
  onSelectActivity,
  onNavigateEntry,
}) => {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8" aria-label={`${button.title}活動清單`}>
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors py-1.5 px-2.5 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
          id="nav-activities-back-btn"
        >
          <ArrowLeft size={14} />
          <span>返回協會首頁</span>
        </button>

        <span className="text-xs text-neutral-500 font-mono">
          /nav/{button.id}
        </span>
      </div>

      {/* Header section */}
      <header className="border-b border-neutral-800 pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
          <Compass size={18} />
          <span>行程活動專區</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
          {button.title}
        </h1>
        <p className="text-sm text-neutral-400 mt-2">
          歡迎瀏覽本專區推薦之健行登山行程，點選活動可查看詳細說明或前往外部頁面報名。
        </p>
      </header>

      {/* 相關連結專區 (NavButtonEntries) */}
      {entries && entries.length > 0 && (
        <section className="mb-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link2 size={15} />
            <span>相關連結與資訊</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.map((entry) => {
              const rawUrl = (entry.url || '').trim();
              const isExternal = /^https?:\/\//i.test(rawUrl);
              const url = rawUrl || '#';

              if (isExternal) {
                return (
                  <a
                    key={entry.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-emerald-700/60 hover:bg-neutral-900 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                        {entry.title || '相關外部連結'}
                      </div>
                      {entry.description && (
                        <div className="text-xs text-neutral-400 leading-relaxed">
                          {entry.description}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={14} className="text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                  </a>
                );
              }

              return (
                <a
                  key={entry.id}
                  href={url}
                  onClick={(e) => {
                    if (onNavigateEntry && url !== '#') {
                      e.preventDefault();
                      onNavigateEntry(url);
                    }
                  }}
                  className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-emerald-700/60 hover:bg-neutral-900 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                      {entry.title || '站內專區項目'}
                    </div>
                    {entry.description && (
                      <div className="text-xs text-neutral-400 leading-relaxed">
                        {entry.description}
                      </div>
                    )}
                  </div>
                  <Compass size={14} className="text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Activity list */}
      {activities.length > 0 ? (
        <div className="space-y-2.5 sm:space-y-3">
          {activities.map((activity) => {
            const hasContent = Boolean((activity.content || '').trim());
            return (
              <article
                key={activity.id}
                className="group p-3 sm:p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900 transition-all flex flex-row items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-xl font-bold text-neutral-100">
                      {onSelectActivity ? (
                        <a
                          href={`/${getCategorySlug(button)}/${activity.slug}/`}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                            e.preventDefault();
                            onSelectActivity(activity.slug);
                          }}
                          className={`inline-flex items-center gap-1 transition-colors text-left ${
                            hasContent
                              ? 'underline decoration-neutral-600 underline-offset-4 hover:decoration-emerald-400 hover:text-emerald-400'
                              : 'hover:text-emerald-400'
                          }`}
                          title="查看活動詳細資訊"
                        >
                          <span>{activity.title}</span>
                          {hasContent && (
                            <ChevronRight
                              size={16}
                              className="text-neutral-500 group-hover:text-emerald-400 transition-colors shrink-0"
                            />
                          )}
                        </a>
                      ) : (
                        activity.title
                      )}
                    </h2>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-neutral-300 leading-relaxed line-clamp-3">
                      {activity.description}
                    </p>
                  )}
                </div>

                {activity.externalUrl && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <a
                      href={normalizeUrl(activity.externalUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
                    >
                      <span>查看行程</span>
                      <ExternalLink size={14} className="text-emerald-200" />
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-lg bg-neutral-900/30">
          <p className="text-neutral-400 text-sm mb-4">目前此專區尚無發布中的活動行程。</p>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
          >
            返回首頁查看活動行事曆
          </button>
        </div>
      )}
    </main>
  );
};
