import React from 'react';
import { ArrowLeft, Video, ExternalLink } from 'lucide-react';
import type { HighlightItem } from '../types.js';
import { getYouTubeVideoId, normalizeUrl } from '../utils/url.js';

interface HighlightsViewProps {
  highlights: HighlightItem[];
  onBack: () => void;
}

export const HighlightsView: React.FC<HighlightsViewProps> = ({ highlights, onBack }) => {
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
              活動花絮
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              協會各期高山縱走、攀登行程與戶外探索紀錄影音
            </p>
          </div>
        </div>
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

            return (
              <div
                key={item.id}
                className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden shadow-lg"
              >
                {videoId ? (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                      title="YouTube video player"
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

                <div className="p-3 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-mono truncate">
                    {item.youtubeUrl}
                  </span>
                  <a
                    href={originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 ml-2 text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>開啟 YouTube</span>
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
