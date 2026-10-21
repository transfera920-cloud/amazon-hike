import React from 'react';
import { Settings, ExternalLink } from 'lucide-react';
import { SiteData } from '../types';
import { PAGE_H1 } from '../data/seoContent';

interface HeaderProps {
  data: SiteData;
  onOpenAdmin: () => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ data, onOpenAdmin, isCloudConnected = false }) => {
  return (
    <>
      {/* 管理後台按鈕 (固定右上角) */}
      <button
        id="btn-admin-open"
        onClick={onOpenAdmin}
        className="absolute top-3 right-3 md:fixed md:top-4 md:right-4 z-40 bg-[#0a1b13]/90 hover:bg-[#102b1f] text-emerald-100 text-xs px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all border border-emerald-700/50 cursor-pointer"
        title="開啟網站內容管理後台"
      >
        <i className="fa-solid fa-gear text-emerald-400" aria-hidden="true"></i>
        <span>管理後台</span>
        {isCloudConnected && (
          <span
            className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
            title="已連線至 Firebase Firestore 雲端共用資料庫"
          ></span>
        )}
      </button>

      {/* 頁首區塊 Header */}
      <header className="bg-gradient-to-b from-[#04110a] via-[#092215] to-[#0a1f14] text-white pt-12 md:pt-14 pb-6 md:pb-10 px-4 text-center relative shadow-xl border-b border-emerald-900/60 overflow-hidden">
        {/* 背景裝飾光暈 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-3xl h-56 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* 品牌名稱超連結至主站 */}
          <div className="mb-3">
            <a
              id="site-brand"
              href="https://amazon-hike.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors text-sm md:text-base tracking-widest font-semibold py-1 px-3.5 rounded-full hover:bg-emerald-900/40 border border-emerald-700/30 hover:border-emerald-500/60 group"
              title="前往 亞馬遜高山接駁 官方主網站 (amazon-hike.com)"
            >
              <span>{data.siteTitle || "亞馬遜高山接駁"}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* 網站大標題 (H1：頁面搜尋主題) */}
          <h1
            id="site-title"
            className="text-3xl md:text-5xl font-extrabold tracking-wide mb-3.5 text-white drop-shadow-[0_2px_18px_rgba(0,200,83,0.35)]"
          >
            {PAGE_H1}
          </h1>

          {/* 副標題 / 標語 */}
          <p
            id="site-subtitle"
            className="text-emerald-200 text-sm md:text-base tracking-widest mb-4 font-medium drop-shadow-xs"
          >
            {data.siteSubtitle}
          </p>

          {/* 大 LINE 按鈕 */}
          <div className="flex justify-center">
            <a
              id="hero-line-link"
              href={data.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-gradient-to-r from-[#00c853] to-[#00b248] hover:from-[#00e676] hover:to-[#00c853] text-white font-bold px-9 py-4 rounded-full text-base md:text-lg shadow-[0_4px_25px_rgba(0,200,83,0.4)] hover:shadow-[0_6px_35px_rgba(0,200,83,0.55)] transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <i className="fa-brands fa-line text-2xl mr-2.5" aria-hidden="true"></i>
              <span id="hero-line-text">{data.heroLineText || "點我加 LINE 官方帳號預約"}</span>
            </a>
          </div>

          {/* 賣點/特色條標籤 */}
          <div
            id="features-container"
            className="mt-6 md:mt-9 pt-5 md:pt-7 border-t border-emerald-800/40 flex flex-wrap justify-center gap-2.5 md:gap-3.5 text-xs md:text-sm text-emerald-200"
          >
            {data.features && data.features.length > 0 ? (
              data.features.map((feat, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a2015]/80 border border-emerald-700/40 text-emerald-200 font-medium shadow-xs backdrop-blur-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_6px_rgba(0,230,118,0.8)]"></span>
                  <span>{feat}</span>
                </span>
              ))
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-[#0a2015]/80 border border-emerald-700/40 text-emerald-200">
                • 合法租賃營業車 • 職業駕照司機 • 準時接送不延誤 • 600萬乘客險
              </span>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
