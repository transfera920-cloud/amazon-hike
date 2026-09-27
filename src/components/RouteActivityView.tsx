import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  Link2,
  Youtube,
  Images,
  Calendar,
  MapPin,
  Mountain,
  TrendingUp,
  Clock,
  Backpack,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type { NavButtonItem, NavButtonActivity } from '../types.js';
import { getCategorySlug } from '../utils/activitySeo.js';
import { getYouTubeVideoId, normalizeUrl } from '../utils/url.js';
import {
  calculateTotalEstimatedHours,
  getDisplayDaysCount,
} from '../utils/itineraryHelper.js';

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
  siblingActivities,
  onBack,
  onNavigateHome,
}) => {
  const categorySlug = parentButton ? getCategorySlug(parentButton) : 'activity';
  const internalUrl = `https://amazon-hike.com/${categorySlug}/${activity.slug}/`;

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

          {/* Internal Canonical / Permalink display for SEO */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-3 pt-3 border-t border-neutral-800/40">
            <Link2 size={13} className="text-neutral-600 shrink-0" />
            <span className="break-all">主站內部網址：{internalUrl}</span>
          </div>
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
          activity.itinerary.days &&
          activity.itinerary.days.length > 0 && (() => {
            const itinerary = activity.itinerary;
            const totalDays = getDisplayDaysCount(itinerary);
            const totalHours = calculateTotalEstimatedHours(itinerary.days);

            let dateRangeText = '';
            if (itinerary.startDate) {
              if (itinerary.endDate && itinerary.endDate !== itinerary.startDate) {
                dateRangeText = `${itinerary.startDate} ~ ${itinerary.endDate} (共 ${totalDays} 天)`;
              } else {
                dateRangeText = `${itinerary.startDate} (共 ${totalDays} 天)`;
              }
            } else if (totalDays > 0) {
              dateRangeText = `共 ${totalDays} 天`;
            }

            return (
              <section className="my-8 pt-6 border-t border-neutral-800 space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Compass size={16} />
                  <span>登山行程規劃</span>
                </div>

                {/* 1. 行程摘要 */}
                <div className="rounded-lg bg-neutral-950/70 border border-neutral-800/80 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm text-neutral-300">
                    {dateRangeText && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={15} className="text-emerald-400 shrink-0" />
                        <span className="font-medium text-neutral-200">{dateRangeText}</span>
                      </div>
                    )}
                    {itinerary.totalDistanceKm !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={15} className="text-emerald-400 shrink-0" />
                        <span>預計里程：<strong className="text-neutral-100">{itinerary.totalDistanceKm}</strong> 公里</span>
                      </div>
                    )}
                    {itinerary.maxElevationM !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Mountain size={15} className="text-emerald-400 shrink-0" />
                        <span>最高海拔：<strong className="text-neutral-100">{itinerary.maxElevationM}</strong> 公尺</span>
                      </div>
                    )}
                    {(itinerary.elevationGainM !== undefined || itinerary.elevationLossM !== undefined) && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={15} className="text-emerald-400 shrink-0" />
                        <span>
                          爬升/下降：
                          <strong className="text-neutral-100">
                            {itinerary.elevationGainM !== undefined ? `+${itinerary.elevationGainM}m` : ''}
                            {itinerary.elevationGainM !== undefined && itinerary.elevationLossM !== undefined ? ' / ' : ''}
                            {itinerary.elevationLossM !== undefined ? `-${itinerary.elevationLossM}m` : ''}
                          </strong>
                        </span>
                      </div>
                    )}
                    {itinerary.difficulty && (
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={15} className="text-emerald-400 shrink-0" />
                        <span>路線難度：<strong className="text-neutral-100">{itinerary.difficulty}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. 每日行程 (Day 1 ~ Day N) */}
                <div className="space-y-6 pt-2">
                  {itinerary.days.map((day, dIdx) => (
                    <div key={day.id || dIdx} className="space-y-3">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-2">
                        <span className="text-emerald-400">第 {dIdx + 1} 天</span>
                      </h3>

                      {/* 時間地點節點列表 */}
                      <div className="space-y-3 pl-1 sm:pl-3">
                        {day.timePoints && day.timePoints.map((tp, tpIdx) => {
                          const isLinkActive = Boolean(tp.link && tp.link.showOnFrontend && tp.link.url);
                          const isExternal = Boolean(tp.link?.url && /^https?:\/\//i.test(tp.link.url));

                          return (
                            <div key={tp.id || tpIdx} className="text-sm sm:text-base leading-relaxed break-words">
                              <div className="text-neutral-200 flex flex-wrap items-baseline gap-x-2">
                                {tp.time && (
                                  <span className="font-mono text-emerald-400 font-semibold shrink-0">
                                    {tp.time}
                                  </span>
                                )}
                                {tp.time && <span className="text-neutral-600 select-none">｜</span>}
                                {isLinkActive ? (
                                  <a
                                    href={tp.link!.url}
                                    target={isExternal ? '_blank' : undefined}
                                    rel={isExternal ? 'noopener noreferrer' : undefined}
                                    title={tp.link!.description || tp.link!.name}
                                    className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-semibold transition-colors"
                                  >
                                    {tp.location}
                                  </a>
                                ) : (
                                  <span className="font-medium text-neutral-100">{tp.location}</span>
                                )}
                              </div>
                              {tp.description && (
                                <div className="text-xs sm:text-sm text-neutral-400 pl-3 sm:pl-4 mt-1 whitespace-pre-line border-l border-neutral-800">
                                  {tp.description}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 當日預估步程 */}
                      {day.estimatedHours !== undefined && day.estimatedHours > 0 && (
                        <div className="text-xs sm:text-sm text-neutral-400 pt-1 font-mono">
                          當日預估步程：{day.estimatedHours} 小時
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 3. 總預估步程 (即時計算，不使用獨立欄位) */}
                {totalHours > 0 && (
                  <div className="pt-4 border-t border-neutral-800 text-sm sm:text-base font-bold text-neutral-200 flex items-center gap-2 font-mono">
                    <Clock size={16} className="text-emerald-400 shrink-0" />
                    <span>總預估步程：{totalHours} 小時</span>
                  </div>
                )}

                {/* 4. 行前必備裝備 */}
                {itinerary.requiredGear && (
                  <div className="pt-6 border-t border-neutral-800 space-y-3">
                    <h4 className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-2">
                      <Backpack size={16} />
                      <span>行前必備裝備</span>
                    </h4>
                    <div className="space-y-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                      {itinerary.requiredGear.split(/\n\s*\n/).map((para, idx) => (
                        <p key={idx} className="whitespace-pre-line break-words">
                          {para.trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. 安全須知 */}
                {itinerary.safetyNotes && (
                  <div className="pt-6 border-t border-neutral-800 space-y-3">
                    <h4 className="text-sm sm:text-base font-bold text-rose-400 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>安全須知與風險提示</span>
                    </h4>
                    <div className="space-y-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                      {itinerary.safetyNotes.split(/\n\s*\n/).map((para, idx) => (
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

        {/* Sibling Activities in Same Category */}
        {siblingActivities && siblingActivities.length > 0 && parentButton && (
          <section className="mt-8 pt-6 border-t border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-4">
              <Compass size={15} />
              <span>同分類其他行程</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {siblingActivities.map((sibling) => (
                <a
                  key={sibling.id}
                  href={`/${getCategorySlug(parentButton)}/${sibling.slug}/`}
                  className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-emerald-700/60 hover:bg-neutral-900 transition-colors block group"
                >
                  <div className="text-sm font-bold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    {sibling.title}
                  </div>
                  {sibling.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {sibling.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
};
