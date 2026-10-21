import React from 'react';
import { SiteData } from '../types';

interface FooterProps {
  data: SiteData;
}

export const Footer: React.FC<FooterProps> = ({ data }) => {
  const phoneHref = `tel:${data.phone || ''}`;
  const emailHref = `mailto:${data.email || ''}`;

  return (
    <footer className="bg-[#040e08] text-white py-5 px-6 mt-auto border-t border-emerald-900/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-center items-center gap-6 md:gap-10">
        <div className="text-center md:text-left flex-shrink-0">
          <h4 id="footer-banner-title" className="font-bold text-lg text-white drop-shadow-xs">
            {data.footerBannerTitle || "高山登山接駁專屬預約"}
          </h4>
          <p id="footer-banner-sub" className="text-xs text-emerald-200/90 mt-0.5">
            {data.footerBannerSub || "合法租賃車輛 ‧ 行程彈性安排 ‧ 歡迎提早預約包車"}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* 來電諮詢 */}
          <a
            id="footer-phone-link"
            href={phoneHref}
            className="bg-[#0e271a] hover:bg-[#133725] text-emerald-100 border border-emerald-700/60 font-bold px-4 py-2 rounded-lg text-sm flex items-center transition shadow-xs cursor-pointer"
            title={`撥打電話：${data.phone}`}
          >
            <i className="fa-solid fa-phone text-[#00e676] mr-2" aria-hidden="true"></i>
            <span>來電諮詢</span>
          </a>

          {/* Email 聯絡 */}
          <a
            id="footer-email-link"
            href={emailHref}
            className="bg-[#091f14] hover:bg-[#0f2e1e] text-emerald-200 border border-emerald-800/60 font-bold px-4 py-2 rounded-lg text-sm flex items-center transition shadow-xs cursor-pointer"
            title={`發送電子郵件：${data.email}`}
          >
            <i className="fa-solid fa-envelope text-emerald-400 mr-2" aria-hidden="true"></i>
            <span>Email 聯絡</span>
          </a>

          {/* LINE 立即預約 */}
          <a
            id="footer-line-link"
            href={data.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#00c853] to-[#00b248] hover:from-[#00e676] hover:to-[#00c853] text-white font-bold px-5 py-2 rounded-lg text-sm flex items-center transition shadow-[0_0_20px_rgba(0,200,83,0.35)] cursor-pointer"
            title="開啟 LINE 官方帳號"
          >
            <i className="fa-brands fa-line text-lg mr-2" aria-hidden="true"></i>
            <span>LINE 立即預約</span>
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-4 pt-3 border-t border-emerald-950/80 text-center text-xs text-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 亞馬遜高山接駁 ‧ 專業百岳高山包車接送</span>
        <a
          href="https://amazon-hike.com/"
          target="_blank"
          rel="noopener"
          className="hover:text-emerald-200 hover:underline transition-colors"
        >
          相關組織：亞馬遜國家山岳協會（與本站為同一經營者的獨立單位，提供登山教學與百岳介紹）
        </a>
      </div>
    </footer>
  );
};
