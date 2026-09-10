import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-6 text-center text-xs text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
        <span>亞馬遜國家山岳協會</span>
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
    </footer>
  );
};
