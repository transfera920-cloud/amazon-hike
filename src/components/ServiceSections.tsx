import React from 'react';
import { PopularRouteItem } from '../types';
import { HOME_FAQ } from '../data/homeFaq';
import { MORE_ROUTE_GROUPS } from '../data/moreRoutes';

interface SectionShellProps {
  title: string;
  children: React.ReactNode;
}

const SectionShell: React.FC<SectionShellProps> = ({ title, children }) => (
  <section className="bg-[#0e2318]/85 border border-emerald-900/60 rounded-2xl p-4 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md mb-4 md:mb-12 relative overflow-hidden">
    <h2 className="text-lg md:text-xl font-bold text-white mb-2.5 md:mb-4 flex items-center relative z-10">
      <span className="w-1.5 h-5 bg-gradient-to-b from-[#00e676] to-[#00c853] rounded-full mr-3 inline-block shadow-[0_0_8px_rgba(0,200,83,0.6)]"></span>
      <span>{title}</span>
    </h2>
    <div className="text-emerald-100/85 leading-relaxed text-sm md:text-base space-y-2.5 md:space-y-4 relative z-10">
      {children}
    </div>
  </section>
);

export const TrailheadCharterSection: React.FC = () => (
  <SectionShell title="登山口接送與登山包車">
    <p>
      提供北中南主要縣市與宜蘭出發的登山口包車接送。車型可選擇 9 人座商務車、7 人座休旅，或適合林道碎石路段的高底盤四驅車，並可依行程選擇來回包車或單程，也可選擇夜間或 D0 跨夜出發的時段。
    </p>
    <p>
      可使用上方「價格估算系統」，先試算各路線的包車費用；前往郡大山（望鄉部落、郡大林道）請改用
      <a
        href="https://shuttle.amazon-hike.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[#00e676] hover:text-white underline decoration-emerald-600/50 underline-offset-2 transition-colors"
      >
        郡大山專用價格估算系統
      </a>
      。
    </p>
  </SectionShell>
);

interface PopularRoutesSectionProps {
  title: string;
  routes: PopularRouteItem[];
}

export const PopularRoutesSection: React.FC<PopularRoutesSectionProps> = ({ title, routes }) => (
  <SectionShell title={title}>
    <ul className="space-y-2.5 list-none">
      {routes.filter((r) => r.name.trim() || r.description.trim()).map((route) => {
        const url = route.url.trim();
        const isExternal = /^https?:\/\//i.test(url);
        return (
          <li key={route.id}>
            {url ? (
              <a
                href={url}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="font-semibold text-[#00e676] hover:text-white underline underline-offset-2"
              >
                {route.name}
              </a>
            ) : (
              <span className="font-semibold text-white">{route.name}</span>
            )}
            {route.description && <span>：{route.description}</span>}
          </li>
        );
      })}
    </ul>
  </SectionShell>
);

export const MoreRoutesSection: React.FC = () => (
  <>
    {MORE_ROUTE_GROUPS.map((group) => (
      <SectionShell key={group.id} title={group.title}>
        <details>
          <summary className="cursor-pointer font-semibold text-[#00e676]">
            展開查看 {group.routes.length} 條路線
          </summary>
          <ul className="space-y-2.5 list-none mt-4">
            {group.routes.map((route) => (
              <li key={route.id}>
                <a
                  href={route.url}
                  className="font-semibold text-[#00e676] hover:text-white underline underline-offset-2"
                >
                  {route.name}
                </a>
                {route.description && <span>：{route.description}</span>}
              </li>
            ))}
          </ul>
        </details>
      </SectionShell>
    ))}
  </>
);

export const OneWayTripSection: React.FC = () => (
  <SectionShell title="A進B出與行程接送">
    <p>
      A進B出是指從一個登山口入山、由另一個登山口下山的行程（例如縱走），起點與終點不同。本站價格估算提供「來回包車」與「單程」兩種行程模式；若您的行程入山口與下山口不同，歡迎透過 LINE 說明入山口、下山口與日期。
    </p>
  </SectionShell>
);

export const ServiceProcessSection: React.FC = () => (
  <SectionShell title="登山接駁服務流程">
    <ol className="space-y-2.5 list-decimal list-inside">
      <li>於「價格估算系統」選擇目標百岳／登山口與出發城市。</li>
      <li>選擇車型、行程模式（來回或單程）、乘客人數，以及是否為夜間出發。</li>
      <li>查看試算的預估費用。</li>
      <li>點選「帶入報價加 LINE 預約」，系統會複製行程摘要並開啟 LINE，貼上訊息即可詢問預約日期是否有車趟。</li>
    </ol>
  </SectionShell>
);

export const RoadStatusGuideSection: React.FC = () => (
  <SectionShell title="高山道路與林道管制即時指南">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-900/60 text-xs text-emerald-200">
      <div className="flex items-center gap-2">
        <span>官方即時路況查詢：</span>
        <a
          href="https://168.thb.gov.tw/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00e676] hover:text-white underline decoration-emerald-600/50 underline-offset-2 transition-colors font-medium"
        >
          公路局 168 即時路況
        </a>
        <span className="text-emerald-700">|</span>
        <a
          href="https://www.forest.gov.tw/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00e676] hover:text-white underline decoration-emerald-600/50 underline-offset-2 transition-colors font-medium"
        >
          林業署林道動態
        </a>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
      <div className="bg-[#071a10]/80 p-4 rounded-xl border border-emerald-800/40">
        <div className="mb-2"><span className="text-xs text-amber-300 font-semibold">夜間常態管制</span></div>
        <h3 className="font-bold text-white text-sm mb-1">台21線 新中橫公路（草坪頭至塔塔加段）</h3>
        <p className="text-xs text-amber-200/90 font-medium mb-1.5">每日 17:30 至隔日 07:00 實施常態夜間預警性封閉管制</p>
        <p className="text-xs text-emerald-100/70 leading-relaxed">
          影響百岳：玉山主峰、排雲山莊、鹿林麟趾山。登山接駁若欲一早起登，需在 07:00 後通過或提前於前一日 17:30 前抵達東埔山莊 D0。
        </p>
      </div>

      <div className="bg-[#071a10]/80 p-4 rounded-xl border border-emerald-800/40">
        <div className="mb-2"><span className="text-xs text-blue-300 font-semibold">雪季／天候管制</span></div>
        <h3 className="font-bold text-white text-sm mb-1">台14甲線 合歡山景觀公路（翠峰至大禹嶺段）</h3>
        <p className="text-xs text-blue-200/90 font-medium mb-1.5">視降雪與路面結冰彈性啟動雪季管制，夜間常態預警封閉</p>
        <p className="text-xs text-emerald-100/70 leading-relaxed">
          影響百岳：合歡主東石門、合歡北西峰、奇萊主北。冬季低溫結冰期翠峰至大禹嶺需加掛雪鍊，亞馬遜高山接駁車隊備有專業雪鍊裝備與經驗駕駛。
        </p>
      </div>

      <div className="bg-[#071a10]/80 p-4 rounded-xl border border-emerald-800/40">
        <div className="mb-2"><span className="text-xs text-red-300 font-semibold">每週二四全日封閉</span></div>
        <h3 className="font-bold text-white text-sm mb-1">台20線 南橫公路（梅山口至向陽登山口）</h3>
        <p className="text-xs text-red-200/90 font-medium mb-1.5">每週二、週四不開放；開放日 07:00~14:00 放行，17:00 前淨空</p>
        <p className="text-xs text-emerald-100/70 leading-relaxed">
          影響百岳：嘉明湖（向陽）、戒茂斯、南橫三星。欲攀登向陽嘉明湖請務必避開二、四道路維護日，亞馬遜高山接駁依通行規定彈性調度車趟。
        </p>
      </div>

      <div className="bg-[#071a10]/80 p-4 rounded-xl border border-emerald-800/40">
        <div className="mb-2"><span className="text-xs text-amber-300 font-semibold">四驅專用／日間開放</span></div>
        <h3 className="font-bold text-white text-sm mb-1">郡大林道（檢查哨至 32K 登山口）</h3>
        <p className="text-xs text-amber-200/90 font-medium mb-1.5">開放時間 06:00 ~ 17:00（夜間關閉）；限高底盤四驅車進入</p>
        <p className="text-xs text-emerald-100/70 leading-relaxed">
          路面崎嶇不平且多坑洞碎石，一般轎車切勿進入。亞馬遜高山接駁提供專用高底盤 4WD 四驅越野車與經驗司機帶路，確保全隊安全抵達。
        </p>
      </div>
    </div>
  </SectionShell>
);

const FAQ_LINK_CLASS =
  'font-semibold text-[#00e676] hover:text-white underline decoration-emerald-600/50 underline-offset-2 transition-colors';

export const HomeFaqSection: React.FC = () => (
  <SectionShell title="常見問題">
    <div className="space-y-4">
      {HOME_FAQ.map((item) => (
        <div key={item.question}>
          <h3 className="font-bold text-white text-sm md:text-base mb-1">{item.question}</h3>
          <p>
            {item.answer.map((part, i) => {
              if (typeof part === 'string') return <React.Fragment key={i}>{part}</React.Fragment>;
              const external = /^https?:\/\//i.test(part.href);
              return (
                <a
                  key={i}
                  href={part.href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={FAQ_LINK_CLASS}
                >
                  {part.text}
                </a>
              );
            })}
          </p>
        </div>
      ))}
    </div>
  </SectionShell>
);
