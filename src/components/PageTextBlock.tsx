import React from 'react';

/** 允許站內連結（/ 開頭）、http/https 網址、電話（tel:+886...）與電子郵件（mailto:）；擋掉 javascript: 等危險寫法 */
export function isSafePageTextHref(href: string): boolean {
  return (
    /^\/(?!\/)/.test(href) ||
    /^https?:\/\/[^\s]+$/i.test(href) ||
    /^tel:\+?[0-9]{6,15}$/.test(href) ||
    /^mailto:[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/i.test(href)
  );
}

/** 圖片網址只允許站內路徑（/ 開頭）或 https/http；不允許 data: 或 javascript: */
export function isSafeImageSrc(src: string): boolean {
  return /^\/(?!\/)/.test(src) || /^https?:\/\/[^\s]+$/i.test(src);
}

/**
 * 把 [文字](網址) 轉成連結、![說明](圖片網址) 轉成圖片，其餘維持純文字（不使用 dangerouslySetInnerHTML）。
 * 圖片的「說明」會成為 alt 文字（圖片 SEO 重點），請務必填寫。
 */
export function renderLinkedText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const isImage = m[1] === '!';
    if (isImage) {
      if (isSafeImageSrc(m[3])) {
        const caption = (m[4] || '').trim();
        // 網址結尾的 #寬x高（例如 #1600x1200）只用來預留版面空間，避免載入時畫面跳動
        const dims = m[3].match(/#(\d{1,5})x(\d{1,5})$/);
        nodes.push(
          <span key={`i-${i++}`} className="block my-4 max-w-2xl">
            <img
              src={m[3].replace(/#\d{1,5}x\d{1,5}$/, '')}
              width={dims ? Number(dims[1]) : undefined}
              height={dims ? Number(dims[2]) : undefined}
              alt={m[2]}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto rounded-lg border border-neutral-800"
            />
            {caption && <span className="block mt-1.5 text-xs sm:text-sm text-neutral-400">{caption}</span>}
          </span>
        );
      }
    } else if (m[2] && isSafePageTextHref(m[3])) {
      nodes.push(
        <a
          key={`l-${i++}`}
          href={m[3]}
          className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
        >
          {m[2]}
        </a>
      );
    } else if (m[2]) {
      nodes.push(m[2]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/**
 * 內文標題語法：獨立一行寫「## 大標題」或「### 小標題」→ H2 / H3。
 * levelOffset：外層已有 H2 的區塊（首頁區塊、按鈕區塊）用 1，內文的 ## 會變 H3、### 變 H4，避免標題層級重複。
 * 標題後面若緊接內文（沒空行），會自動拆成標題 + 段落。
 */
export function renderParagraph(
  p: string,
  key: React.Key,
  opts: { className?: string; levelOffset?: number } = {}
): React.ReactNode {
  const className = opts.className ?? 'whitespace-pre-line';
  const lines = p.split('\n');
  const hm = lines[0].match(/^(#{2,3})[ \t]+(.+?)\s*$/);
  if (!hm) {
    return (
      <p key={key} className={className}>
        {renderLinkedText(p)}
      </p>
    );
  }
  const level = Math.min(6, hm[1].length + (opts.levelOffset ?? 0));
  const headingClass =
    level <= 2
      ? 'text-lg sm:text-xl font-bold text-neutral-100 mt-8 first:mt-0'
      : level === 3
      ? 'text-base sm:text-lg font-semibold text-neutral-100 mt-6 first:mt-0'
      : 'text-sm sm:text-base font-semibold text-neutral-200 mt-5 first:mt-0';
  const Tag = `h${level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const rest = lines.slice(1).join('\n').trim();
  return (
    <React.Fragment key={key}>
      <Tag className={headingClass}>{renderLinkedText(hm[2])}</Tag>
      {rest && <p className={className}>{renderLinkedText(rest)}</p>}
    </React.Fragment>
  );
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
        renderParagraph(p, i, { className: "whitespace-pre-line" })
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
