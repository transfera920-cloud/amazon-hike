import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  Youtube,
  Images,
  Backpack,
  AlertTriangle,
} from 'lucide-react';
import type { NavButtonItem, NavButtonActivity } from '../types.js';
import { getYouTubeVideoId, normalizeUrl } from '../utils/url.js';

interface RouteActivityViewProps {
  activity: NavButtonActivity;
  parentButton?: NavButtonItem;
  siblingActivities?: NavButtonActivity[];
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
    const pageTitle =
      (activity.seoTitle || '').trim() ||
      `${activity.title} | ${parentButton ? parentButton.title + ' - ' : ''}亞馬遜國家山岳協會 | Amazon Alpine Association`;
    document.title = pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        (activity.metaDescription || '').trim() ||
          (activity.description || '').slice(0, 160) ||
          `${activity.title} - 亞馬遜國家山岳協會登山行程活動說明與完整報名資訊。`
      );
    }
  }, [activity, parentButton]);

  // Split description by double newlines into paragraphs
  const paragraphs = activity.description
    ? activity.description.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  const contentParagraphs = activity.content
    ? activity.content.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  const youtubeId = activity.youtubeUrl ? getYouTubeVideoId(activity.youtubeUrl) : null;
  const showYoutube = activity.showYoutube !== false && Boolean(youtubeId);
  const showExternal = activity.showExternalUrl !== false && Boolean(activity.externalUrl);

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
            <span>{parentButton ? parentButton.title : '登山健行行程'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight leading-tight">
            {activity.title}
          </h1>

          {activity.itinerary?.subtitle && (
            <p className="text-base sm:text-lg text-emerald-400 font-medium mt-2 leading-relaxed">
              {activity.itinerary.subtitle}
            </p>
          )}
        </header>

        {/* Cover Image if present */}
        {activity.coverImage && (
          <div className="mb-6 rounded-lg overflow-hidden border border-neutral-800">
            <img
              src={activity.coverImage}
              alt={activity.title}
              className="w-full max-h-[420px] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Activity Short Description */}
        {paragraphs.length > 0 && (
          <section className="space-y-4 text-neutral-200 text-sm sm:text-base leading-relaxed mb-6">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line text-neutral-300">
                {p}
              </p>
            ))}
          </section>
        )}

        {/* Activity Extended Content */}
        {contentParagraphs.length > 0 && (
          <section className="space-y-4 text-neutral-200 text-sm sm:text-base leading-relaxed mb-6 pt-6 border-t border-neutral-800/60">
            {contentParagraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line text-neutral-200">
                {p}
              </p>
            ))}
          </section>
        )}

        {/* Embedded Hiking Itinerary Section */}
        {activity.itinerary &&
          activity.itinerary.enabled &&
          Boolean(activity.itinerary.requiredGear || activity.itinerary.safetyNotes) && (() => {
            const itinerary = activity.itinerary;
            const hasGear = Boolean(itinerary.requiredGear && itinerary.requiredGear.trim());
            const hasSafety = Boolean(itinerary.safetyNotes && itinerary.safetyNotes.trim());

            if (!hasGear && !hasSafety) {
              return null;
            }

            return (
              <section className="my-8 pt-6 border-t border-neutral-800 space-y-6">
                {/* 4. 行前必備裝備 */}
                {hasGear && (
                  <div className="space-y-3">
                    <h4 className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-2">
                      <Backpack size={16} />
                      <span>行前必備裝備</span>
                    </h4>
                    <div className="space-y-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                      {itinerary.requiredGear!.split(/\n\s*\n/).map((para, idx) => (
                        <p key={idx} className="whitespace-pre-line break-words">
                          {para.trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. 安全須知 */}
                {hasSafety && (
                  <div className={`space-y-3 ${hasGear ? 'pt-6 border-t border-neutral-800' : ''}`}>
                    <h4 className="text-sm sm:text-base font-bold text-rose-400 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>安全須知與風險提示</span>
                    </h4>
                    <div className="space-y-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                      {itinerary.safetyNotes!.split(/\n\s*\n/).map((para, idx) => (
                        <p key={idx} className="whitespace-pre-line break-words">
                          {para.trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })()}

        {/* YouTube Video Section */}
        {showYoutube && youtubeId && (
          <section className="my-8 pt-6 border-t border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3">
              <Youtube size={16} className="text-red-500" />
              <span>活動影片紀錄</span>
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-neutral-800 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                title={`${activity.title} - YouTube 影片`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Photo Gallery */}
        {activity.gallery && activity.gallery.length > 0 && (
          <section className="my-8 pt-6 border-t border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3">
              <Images size={16} />
              <span>活動相簿花絮 ({activity.gallery.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activity.gallery.map((imgUrl, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 aspect-video">
                  <img
                    src={imgUrl}
                    alt={`${activity.title} 相片 ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action: 完整行程／報名 */}
        {showExternal && activity.externalUrl && (
          <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-neutral-400">準備好踏上山林旅程了嗎？</div>
              <div className="text-sm font-semibold text-neutral-200">
                點擊前往外部專屬報名表與詳細行程資訊
              </div>
            </div>

            <a
              href={normalizeUrl(activity.externalUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base transition-colors shadow-lg shadow-emerald-950/60"
              id="activity-external-signup-btn"
            >
              <span>完整行程／報名</span>
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </article>
    </main>
  );
};
