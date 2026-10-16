import React from 'react';
import type { HomeIntro } from '../types.js';

interface HomeIntroSectionProps {
  intro?: HomeIntro;
}

/**
 * 首頁行事曆下方的說明區塊（後台「活動行事曆」分頁可編輯）。
 * 文字同時由 Worker 注入首頁原始 HTML，讓搜尋引擎不必執行 JavaScript 就能讀到。
 */
export const HomeIntroSection: React.FC<HomeIntroSectionProps> = ({ intro }) => {
  const title = (intro?.title || '').trim();
  const paragraphs = (intro?.content || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!title && paragraphs.length === 0) return null;

  return (
    <section
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12"
      aria-label="協會介紹"
      id="home-intro"
    >
      <div className="border-t border-neutral-800 pt-8">
        {title && <h2 className="text-lg sm:text-xl font-bold text-neutral-100 mb-4">{title}</h2>}
        <div className="space-y-3 text-sm sm:text-base leading-relaxed text-neutral-300">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};
