import React from 'react';

/** 只允許站內連結（/ 開頭）或 amazon-hike.com 與其子網域（https），避免後台文字被塞入外部或危險連結 */
export function isSafePageTextHref(href: string): boolean {
  return /^\/(?!\/)/.test(href) || /^https:\/\/([a-z0-9-]+\.)*amazon-hike\.com(\/|$)/i.test(href);
}

/** 把 [文字](網址) 轉成連結，其餘維持純文字（不使用 dangerouslySetInnerHTML） */
function renderLinkedText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (isSafePageTextHref(m[2])) {
      nodes.push(
        <a
          key={`l-${i++}`}
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
          {renderLinkedText(p)}
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
