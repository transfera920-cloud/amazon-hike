import React from 'react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

const FOOTER_LINKS = [
  { href: '/', text: '活動行事曆' },
  { href: '/intro', text: '登山入門教學' },
  { href: '/tools', text: '登山工具' },
  { href: '/highlights', text: '活動花絮' },
  { href: '/surveys', text: '問卷調查' },
  { href: '/policies', text: '政策與條款' },
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!onNavigate) return;
    // 讓瀏覽器處理 Ctrl / Cmd / Shift / Alt / 中鍵
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-6 text-center text-xs text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
        <nav aria-label="頁尾導覽">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {FOOTER_LINKS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className="hover:text-emerald-300 hover:underline transition-colors"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="合作服務">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <li>
              <a
                href="https://transfer.amazon-hike.com/"
                target="_blank"
                rel="noopener"
                className="hover:text-emerald-300 hover:underline transition-colors"
              >
                亞馬遜高山接駁（登山口包車）
              </a>
            </li>
            <li>
              <a
                href="https://price.amazon-hike.com/"
                target="_blank"
                rel="noopener"
                className="hover:text-emerald-300 hover:underline transition-colors"
              >
                接駁費用試算
              </a>
            </li>
          </ul>
        </nav>
        <div className="flex items-center justify-center gap-2">
          <a
            href="/"
            onClick={(e) => handleClick(e, '/')}
            className="hover:text-emerald-300 transition-colors"
            id="footer-brand-home-link"
          >
            亞馬遜國家山岳協會
          </a>
          <span className="text-neutral-600">｜</span>
          <a
            href="https://lin.ee/TJJLV36"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
            id="footer-line-consultation"
          >
            LINE 官方諮詢
          </a>
        </div>
      </div>
    </footer>
  );
};
