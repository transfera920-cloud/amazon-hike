import React from 'react';
import { ArrowLeft, ExternalLink, ClipboardList, CheckCircle2 } from 'lucide-react';
import type { SurveyItem } from '../types.js';
import { normalizeUrl } from '../utils/url.js';

interface SurveysViewProps {
  surveys?: SurveyItem[];
  onBack: () => void;
}

export const SurveysView: React.FC<SurveysViewProps> = ({ surveys = [], onBack }) => {
  const activeSurveys = surveys
    .filter((s) => s.enabled)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="問卷調查專區">
      {/* Breadcrumb / Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-1"
          id="surveys-back-btn"
        >
          <ArrowLeft size={14} />
          <span>回到上一頁</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              問卷調查選單
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              歡迎點選下方問卷標題，前往填寫協會活動滿意度、心得回饋與各項意見調查表單
            </p>
          </div>
        </div>
      </div>

      {/* Surveys List */}
      {activeSurveys.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-800 rounded-lg bg-neutral-900/40 space-y-2">
          <ClipboardList size={32} className="mx-auto text-neutral-600 mb-2" />
          <p className="text-sm font-medium text-neutral-400">目前暫無進行中的問卷調查</p>
          <p className="text-xs text-neutral-500">感謝您的關注，後續若有新活動問卷將第一時間在此發布！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSurveys.map((survey) => {
            const url = normalizeUrl(survey.url);

            return (
              <div
                key={survey.id}
                className="group border border-neutral-800 rounded-lg bg-neutral-900/40 p-5 hover:border-emerald-700/60 hover:bg-neutral-900/80 transition-all flex flex-col justify-between"
                id={`survey-card-${survey.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                      <CheckCircle2 size={12} />
                      <span>線上填寫</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      #{survey.sortOrder}
                    </span>
                  </div>

                  {/* 問卷標題：點擊直接開啟後台所設定的問卷超連結 */}
                  <a
                    href={url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-base sm:text-lg font-bold text-neutral-100 group-hover:text-emerald-400 transition-colors leading-snug"
                    id={`survey-title-link-${survey.id}`}
                  >
                    {survey.title}
                  </a>

                  {survey.description && (
                    <p className="text-xs text-neutral-400 leading-relaxed pt-1">
                      {survey.description}
                    </p>
                  )}
                </div>

                {/* 底部行動按鈕 */}
                <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">
                    點擊標題或按鈕前往問卷
                  </span>
                  <a
                    href={url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow"
                    id={`survey-btn-link-${survey.id}`}
                  >
                    <span>前往填寫問卷</span>
                    <ExternalLink size={13} className="shrink-0" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};
