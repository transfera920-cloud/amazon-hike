import React from 'react';
import type { HomeBlockItem } from '../types.js';
import { renderLinkedText, renderParagraph } from './PageTextBlock.js';

interface HomeBlocksSectionProps {
  blocks?: HomeBlockItem[];
}

/**
 * 首頁行事曆下方的「內容區塊」（後台「首頁區塊管理」可新增、編輯、排序、停用）。
 * 標題為 H2；內文以空白行分段，支援 [文字](網址) 連結。
 * 同樣的內容也由 Worker 注入首頁原始 HTML，搜尋引擎不必執行 JavaScript 就能讀到。
 */
export const HomeBlocksSection: React.FC<HomeBlocksSectionProps> = ({ blocks }) => {
  const list = (blocks || [])
    .filter((b) => b.enabled && (b.title || '').trim() && (b.content || '').trim())
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  if (list.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-12" data-home-blocks>
      {list.map((block) => {
        const paragraphs = block.content
          .replace(/\r\n?/g, '\n')
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        return (
          <section key={block.id} className="border-t border-neutral-800 pt-8 mt-8 first:mt-0">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-100 mb-4">{block.title}</h2>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-neutral-300">
              {paragraphs.map((p, i) => (
                renderParagraph(p, i, { className: "whitespace-pre-line", levelOffset: 1 })
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
