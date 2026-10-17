import React, { useState } from 'react';
import { ArrowLeft, Video, ExternalLink, Play } from 'lucide-react';
import type { HighlightItem } from '../types.js';
import { getYouTubeVideoId, normalizeUrl } from '../utils/url.js';
import { renderLinkedText } from './PageTextBlock.js';

interface HighlightsViewProps {
  highlights: HighlightItem[];
  /** 後台「活動花絮」按鈕的列表頁導讀內容；沒填就顯示預設說明 */
  introContent?: string;
  /** 後台「活動花絮」按鈕的下方說明；沒填就不顯示 */
  footerContent?: string;
  onBack: () => void;
}

/**
 * 點擊才載入的影片播放器：
 * 一開始只顯示縮圖（很輕），按下播放後才載入 YouTube 播放器，
 * 避免一頁幾十支影片同時載入造成畫面卡頓。
 */
const LazyYouTube: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`播放影片：${title}`}
      className="group relative block w-full h-full bg-black"
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        decoding="async"
        width={480}
        height={360}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center justify-center w-14 h-14 rounded-full bg-black/60 border border-white/40 text-white group-hover:bg-emerald-600 transition-colors">
          <Play size={24} fill="currentColor" />
        </span>
      </span>
    </button>
  );
};

export const HighlightsView: React.FC<HighlightsViewProps> = ({ highlights, introContent, footerContent, onBack }) => {
  const introParagraphs = (introContent || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const footerParagraphs = (footerContent || '')
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
                {renderLinkedText(p)}
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
                    <LazyYouTube
                      videoId={videoId}
                      title={itemTitle || (item.description || '').split('\n')[0].trim().slice(0, 60) || 'YouTube video player'}
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

                <div className="relative pb-4">
                  {videoId && (
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`在 YouTube 觀看${itemTitle ? `「${itemTitle}」` : ''}`}
                      aria-label={`在 YouTube 觀看${itemTitle ? `「${itemTitle}」` : ''}`}
                      className="absolute top-3 right-4 p-1 text-neutral-400 hover:text-emerald-400 transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}

                  {itemTitle && (
                    <h2 className="px-4 pt-3 pr-12 text-base font-bold text-neutral-100">
                      {itemTitle}
                    </h2>
                  )}

                  {item.description && (
                    <p
                      className={`px-4 pt-3 text-sm text-neutral-200 leading-relaxed whitespace-pre-line ${
                        itemTitle ? '' : 'pr-12'
                      }`}
                    >
                      {item.description}
                    </p>
                  )}

                  {relatedHref && (
                    <p className="px-4 pt-2 text-xs">
                      <a href={relatedHref} className="text-emerald-400 hover:text-emerald-300 underline">
                        查看{itemTitle ? `「${itemTitle}」` : ''}行程介紹
                      </a>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {footerParagraphs.length > 0 && (
        <section
          aria-label="活動花絮說明"
          className="mt-10 border-t border-neutral-800 pt-6 space-y-3 text-sm text-neutral-300 leading-relaxed"
        >
          {footerParagraphs.map((p, idx) => (
            <p key={idx} className="whitespace-pre-line">
              {renderLinkedText(p)}
            </p>
          ))}
        </section>
      )}
    </main>
  );
};
