import React from 'react';
import { ArrowLeft, Compass, ExternalLink } from 'lucide-react';
import { normalizeUrl } from '../utils/url.js';
import type { NavButtonItem, NavButtonActivity } from '../types.js';

interface NavActivitiesViewProps {
  button: NavButtonItem;
  activities: NavButtonActivity[];
  onBack: () => void;
  onSelectActivity?: (slug: string) => void;
}

export const NavActivitiesView: React.FC<NavActivitiesViewProps> = ({
  button,
  activities,
  onBack,
  onSelectActivity,
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

      {/* Activity list */}
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <article
              key={activity.id}
              className="p-5 sm:p-6 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-100">
                    {onSelectActivity ? (
                      <button
                        type="button"
                        onClick={() => onSelectActivity(activity.slug)}
                        className="hover:text-emerald-400 transition-colors text-left"
                        title="查看活動詳細資訊"
                      >
                        {activity.title}
                      </button>
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

              <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
                <a
                  href={normalizeUrl(activity.externalUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                >
                  <span>查看活動說明</span>
                  <ExternalLink size={14} className="text-emerald-200" />
                </a>
              </div>
            </article>
          ))}
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
