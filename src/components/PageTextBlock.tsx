import React from 'react';

interface PageTextBlockProps {
  /** 後台輸入的文字（空白行分段）；空白時不顯示任何東西 */
  text?: string;
  /** top = 標題區下方、內容上方；bottom = 內容下方 */
  position: 'top' | 'bottom';
}

/**
 * 子頁面的「上方說明 / 下方說明」文字區塊（後台「前台導覽按鈕」編輯）。
 * 文字同時由 Worker 注入原始 HTML，搜尋引擎不必執行 JavaScript 就能讀到。
 */
export const PageTextBlock: React.FC<PageTextBlockProps> = ({ text, position }) => {
  const paragraphs = (text || '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  const body = (
    <div className="space-y-3 text-sm sm:text-base leading-relaxed text-neutral-300">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );

  if (position === 'top') {
    return (
      <section className="mb-6" aria-label="頁面說明" data-page-text="top">
        {body}
      </section>
    );
  }

  return (
    <section
      className="mt-10 pt-6 border-t border-neutral-800"
      aria-label="補充說明"
      data-page-text="bottom"
    >
      {body}
    </section>
  );
};
