import React from 'react';
import { ArrowLeft, Video, ExternalLink } from 'lucide-react';
import type { HighlightItem } from '../types.js';
import { getYouTubeVideoId, normalizeUrl } from '../utils/url.js';

interface HighlightsViewProps {
  highlights: HighlightItem[];
  /** 後台「活動花絮」按鈕的列表頁導讀內容；沒填就顯示預設說明 */
  introContent?: string;
  onBack: () => void;
}

export const HighlightsView: React.FC<HighlightsViewProps> = ({ highlights, introContent, onBack }) => {
  const introParagraphs = (introContent || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="活動花絮影音專區">
      {/* Breadcrumb / Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-1"
          id="highlights-back-btn"
        >
          <ArrowLeft size={14} />
          <span>回到上一頁</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
            <Video size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              百岳登山影片與活動花絮
            </h1>
            {introParagraphs.length === 0 && (
              <p className="text-xs text-neutral-400 mt-0.5">
                協會各期高山縱走、攀登行程與戶外探索紀錄影音
              </p>
            )}
          </div>
        </div>
        {introParagraphs.length > 0 && (
          <div className="mt-4 space-y-3 text-sm text-neutral-300 leading-relaxed">
            {introParagraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Videos List */}
      {highlights.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-800 rounded bg-neutral-900/40">
          目前暫無活動花絮影音資料
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {highlights.map((item) => {
            const videoId = getYouTubeVideoId(item.youtubeUrl);
            const originalUrl = normalizeUrl(item.youtubeUrl);
            const itemTitle = (item.title || '').trim();
            const relatedPath = (item.relatedUrl || '').trim();
            const relatedHref = /^https?:\/\//i.test(relatedPath) || relatedPath.startsWith('/') ? relatedPath : '';

            return (
              <div
                key={item.id}
                className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden shadow-lg"
              >
                {videoId ? (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                      title={itemTitle || (item.description || '').split('\n')[0].trim().slice(0, 60) || 'YouTube video player'}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
                    <Video size={32} className="text-neutral-600 mb-2" />
                    <p className="text-xs text-neutral-400">影片連結格式不符或無法嵌入</p>
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>開啟原影片網址</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {itemTitle && (
                  <h2 className="px-4 pt-3 text-base font-bold text-neutral-100">
                    {itemTitle}
                  </h2>
                )}

                {item.description && (
                  <p className="px-4 pt-3 text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                    {item.description}
                  </p>
                )}

                {relatedHref && (
                  <p className="px-4 pt-2 pb-3 text-xs">
                    <a href={relatedHref} className="text-emerald-400 hover:text-emerald-300 underline">
                      查看{itemTitle ? `「${itemTitle}」` : ''}行程介紹
                    </a>
                  </p>
                )}

                <div className="p-3 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-end text-xs">
                  <a
                    href={originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>在 YouTube 觀看{itemTitle ? `「${itemTitle}」` : ''}</span>
                    <ExternalLink size={12} />
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
