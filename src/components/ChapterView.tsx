import React, { useEffect } from 'react';
import { ArrowLeft, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import type { ChapterItem } from '../types.js';

interface ChapterViewProps {
  chapter: ChapterItem;
  prevChapter?: ChapterItem;
  nextChapter?: ChapterItem;
  onBack: () => void;
  onNavigateChapter: (slug: string) => void;
}

export const ChapterView: React.FC<ChapterViewProps> = ({
  chapter,
  prevChapter,
  nextChapter,
  onBack,
  onNavigateChapter,
}) => {
  // Update document title and meta description on client side for SPA navigation
  useEffect(() => {
    document.title = `${chapter.title} | 亞馬遜國家山岳協會 | Amazon Alpine Association`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', chapter.description || chapter.title);
    }
  }, [chapter]);

  // Split content by double newlines into paragraphs
  const paragraphs = chapter.content
    ? chapter.content.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6" aria-label={chapter.title}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-1"
          id="chapter-back-btn"
        >
          <ArrowLeft size={14} />
          <span>返回登山入門章節目錄</span>
        </button>

        <span className="text-xs text-neutral-500 font-mono">
          /{chapter.slug}
        </span>
      </div>

      {/* Chapter Article Container */}
      <article className="border border-neutral-800 rounded bg-neutral-900/40 p-6 sm:p-8">
        {/* Header */}
        <header className="border-b border-neutral-800/80 pb-6 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
            <BookOpen size={16} />
            <span>登山入門專文</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight leading-tight">
            {chapter.title}
          </h1>

          {chapter.description && (
            <p className="text-sm sm:text-base text-neutral-300 mt-3 leading-relaxed">
              {chapter.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 mt-4 pt-3 border-t border-neutral-800/40">
            {chapter.updatedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-neutral-500" />
                <span>更新時間：{chapter.updatedAt}</span>
              </span>
            )}
            <span>亞馬遜國家山岳協會 教育委員會編撰</span>
          </div>
        </header>

        {/* Optional Cover Image */}
        {chapter.coverImage && (
          <div className="mb-6 rounded overflow-hidden border border-neutral-800">
            <img
              src={chapter.coverImage}
              alt={chapter.title}
              className="w-full h-auto max-h-96 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="space-y-4 text-neutral-200 text-sm sm:text-base leading-relaxed">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {p}
              </p>
            ))
          ) : (
            <p className="text-neutral-400 whitespace-pre-line">
              {chapter.content || '專文內容整理中，敬請期待。'}
            </p>
          )}
        </div>

        {/* Article Footer & Prev/Next Navigation */}
        <footer className="mt-10 pt-6 border-t border-neutral-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevChapter ? (
              <button
                type="button"
                onClick={() => onNavigateChapter(prevChapter.slug)}
                className="group p-4 border border-neutral-800 rounded bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900 text-left transition-all"
                id={`prev-chapter-${prevChapter.slug}`}
              >
                <div className="text-xs text-neutral-400 flex items-center gap-1 mb-1">
                  <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>上一講</span>
                </div>
                <div className="text-sm font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {prevChapter.title}
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextChapter && (
              <button
                type="button"
                onClick={() => onNavigateChapter(nextChapter.slug)}
                className="group p-4 border border-neutral-800 rounded bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900 text-right transition-all sm:col-start-2"
                id={`next-chapter-${nextChapter.slug}`}
              >
                <div className="text-xs text-neutral-400 flex items-center justify-end gap-1 mb-1">
                  <span>下一講</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-sm font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {nextChapter.title}
                </div>
              </button>
            )}
          </div>
        </footer>
      </article>
    </main>
  );
};
