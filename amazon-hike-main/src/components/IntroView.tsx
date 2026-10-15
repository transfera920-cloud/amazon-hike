import React from 'react';
import { ArrowLeft, BookOpen, ChevronRight, Calendar, ExternalLink } from 'lucide-react';
import { normalizeUrl } from '../utils/url.js';
import { isFormalChapterSlug } from '../utils/activitySeo.js';
import type { ChapterItem, IntroItem } from '../types.js';

interface IntroViewProps {
  chapters?: ChapterItem[];
  intros?: IntroItem[];
  onBack: () => void;
  onSelectChapter?: (slug: string) => void;
}

/** 只允許站內連結（/ 開頭或 https://amazon-hike.com），避免導讀內文被塞入外部或危險連結 */
function isSafeGuideHref(href: string): boolean {
  return /^\/(?!\/)/.test(href) || /^https:\/\/amazon-hike\.com(\/|$)/i.test(href);
}

/** 將導讀內文中的 [文字](網址) 轉為連結，其餘維持純文字（不使用 dangerouslySetInnerHTML） */
function renderGuideParagraph(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (isSafeGuideHref(m[2])) {
      nodes.push(
        <a
          key={`g-${i++}`}
          href={m[2]}
          className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
        >
          {m[1]}
        </a>
      );
    } else {
      nodes.push(m[1]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export const IntroView: React.FC<IntroViewProps> = ({
  chapters = [],
  intros = [],
  onBack,
  onSelectChapter,
}) => {
  // Prefer chapters if available, otherwise fallback to intros if any
  const hasChapters = chapters.length > 0;

  // 導讀置頂：pinned 的項目獨立顯示在最上方，不放入一般卡片列表
  const pinnedIntros = intros.filter((i) => i.pinned);
  const listIntros = intros.filter((i) => !i.pinned);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="登山入門專區">
      {/* Breadcrumb / Back button (回到上一層) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-1"
          id="intro-back-btn"
        >
          <ArrowLeft size={14} />
          <span>回到上一頁</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              登山入門
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              高山健行觀念、裝備配置與山林實用常識專題指南（共 {chapters.length || listIntros.length} 講）
            </p>
          </div>
        </div>
      </div>

      {/* 導讀（置頂） */}
      {pinnedIntros.map((guide) => {
        const paragraphs = (guide.content || guide.description || '')
          .split(/\n{2,}/)
          .map((t) => t.trim())
          .filter(Boolean);
        return (
          <section
            key={guide.id}
            id={`intro-guide-${guide.id}`}
            aria-label="登山入門導讀"
            className="mb-6 rounded border border-emerald-900/60 bg-emerald-950/20 p-5 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-bold text-emerald-300 mb-3">
              {guide.title}
            </h2>
            <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
              {paragraphs.map((para, idx) => (
                <p key={idx} className="whitespace-pre-line">
                  {renderGuideParagraph(para)}
                </p>
              ))}
            </div>
            {guide.url && (
              <a
                href={normalizeUrl(guide.url) || '#'}
                className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <span>延伸閱讀</span>
                <ChevronRight size={14} />
              </a>
            )}
          </section>
        );
      })}

      {/* Chapters / Articles List */}
      {!hasChapters && listIntros.length === 0 ? (
        pinnedIntros.length > 0 ? null : (
        <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-800 rounded bg-neutral-900/40">
          目前暫無登山入門專文資料
        </div>
        )
      ) : hasChapters ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapters.map((item) => {
            const isFormal = isFormalChapterSlug(item.slug);
            const href = isFormal ? `/${item.slug.toLowerCase()}/` : `/intro/${item.slug}`;

            return (
              <a
                key={item.id}
                href={href}
                onClick={(e) => {
                  if (isFormal) {
                    return;
                  }
                  e.preventDefault();
                  if (onSelectChapter) {
                    onSelectChapter(item.slug);
                  } else {
                    window.location.pathname = `/intro/${item.slug}`;
                  }
                }}
                className="group border border-neutral-800 rounded bg-neutral-900/40 p-5 hover:border-neutral-700/80 hover:bg-neutral-900/80 transition-all flex flex-col justify-between cursor-pointer"
                id={`chapter-card-${item.slug}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h2>
                    <ChevronRight size={16} className="text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 shrink-0 mt-1 transition-all" />
                  </div>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 group-hover:text-emerald-300">
                    閱讀完整專文
                  </span>
                  {item.updatedAt && (
                    <span className="text-neutral-500 inline-flex items-center gap-1 font-mono text-[11px]">
                      <Calendar size={11} />
                      {item.updatedAt}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listIntros.map((item) => {
            const url = normalizeUrl(item.url);
            return (
              <a
                key={item.id}
                href={url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-neutral-800 rounded bg-neutral-900/40 p-5 hover:border-neutral-700/80 hover:bg-neutral-900/80 transition-all flex flex-col justify-between"
                id={`intro-item-${item.id}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h2>
                    <ExternalLink size={14} className="text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-1 transition-colors" />
                  </div>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-neutral-800/60 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                  <span>閱讀完整專文</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
};


