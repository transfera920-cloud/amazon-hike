import React from 'react';
import { X, AlertTriangle, ShieldAlert, Clock, ExternalLink, CheckCircle2, Info, Compass } from 'lucide-react';

interface RoadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoadNotice {
  route: string;
  name: string;
  section: string;
  controlTime: string;
  targetMountains: string;
  description: string;
  status: 'normal' | 'controlled' | 'warning';
}

const ROAD_NOTICES: RoadNotice[] = [
  {
    route: '台21線',
    name: '新中橫公路 (水里-塔塔加段)',
    section: '110K (草坪頭) ~ 145K (塔塔加)',
    controlTime: '每日 17:30 至隔日 07:00 實施常態夜間預警性封閉管制',
    targetMountains: '玉山主峰、排雲山莊、鹿林麟趾山',
    description: '為維護夜間行車安全與野生動物生態，每日 17:30 準時封閉柵門。登山接駁若需一早起登，需在 07:00 後通過或提前於前一日 17:30 前抵達東埔山莊 D0。',
    status: 'controlled'
  },
  {
    route: '台14甲線',
    name: '合歡山景觀公路',
    section: '18K (翠峰) ~ 41.5K (大禹嶺)',
    controlTime: '視天候降雪狀況彈性啟動雪季管制；夜間視結冰情形實施預警封閉',
    targetMountains: '合歡主東石門、合歡北西峰、小奇萊、奇萊主北',
    description: '冬季若有低溫降雪結冰，翠峰至大禹嶺路段需加掛雪鍊方可通行。亞馬遜高山接駁車隊備有專業雪鍊裝備與經驗駕駛，隨時掌握即時監控。',
    status: 'warning'
  },
  {
    route: '台20線',
    name: '南橫公路 (梅山口-向陽段)',
    section: '臨105線 0K (梅山口) ~ 44K (向陽登山口)',
    controlTime: '每週二、每週四不開放通行（全日道路維護維修）',
    targetMountains: '嘉明湖 (向陽)、戒茂斯、南橫三星 (庫哈諾辛、塔關、關山嶺)',
    description: '開放通行時段為上午 07:00 至下午 14:00，下午 17:00 前需全數離開管制路段。欲攀登嘉明湖或南橫百岳的山友請務必避開二、四並提早規劃接駁。',
    status: 'controlled'
  },
  {
    route: '台7甲線',
    name: '中橫宜蘭支線',
    section: '四季至思源埡口段 (大同鄉至和平區交界)',
    controlTime: '整點放行 10~15 分鐘 (邊坡保固工程)',
    targetMountains: '雪山、武陵四秀、南湖大山、中央尖山',
    description: '颱風豪雨季後易有零星碎石，公路局定期進行護欄工程，平日日間配合現場管制人員放行。司機皆會提早 30 分鐘掌握路況動態。',
    status: 'normal'
  },
  {
    route: '郡大林道',
    name: '郡大林道 (望鄉-32K登山口)',
    section: '0K (檢查哨) ~ 32K (郡大山登山口)',
    controlTime: '林道開放時間 06:00 ~ 17:00 (夜間關閉)',
    targetMountains: '郡大山、望鄉山、無雙山',
    description: '路面崎嶇不平且多坑洞碎石，一般轎車切勿進入。亞馬遜高山接駁提供專用高底盤4WD四驅越野車與經驗司機帶路，確保全隊安全抵達。',
    status: 'controlled'
  },
  {
    route: '觀霧大鹿林道',
    name: '大鹿林道 (五峰-觀霧段)',
    section: '大鹿林道主線及東線 0.3K 管制站',
    controlTime: '大鹿林道東線除公務救災車外，禁止外車進入（山友需徒步或低碳自行車）',
    targetMountains: '大霸尖山、小霸尖山、伊澤山、加利山',
    description: '接駁車輛載送至觀霧山莊或大鹿林道 0.3K 管制站，山友登山口下車整裝後起登。',
    status: 'normal'
  }
];

export const RoadStatusModal: React.FC<RoadStatusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100">
        
        {/* Header */}
        <div className="bg-[#0f3822] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-[#00c853] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">高山道路與林道管制即時指南</h3>
              <p className="text-xs text-emerald-200">即時掌握施工封閉、管制時段 ‧ 接駁行程不延誤</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Links bar */}
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-emerald-900 flex items-center gap-1">
            <Compass className="w-4 h-4 text-emerald-700" />
            官方即時路況即查外部連結：
          </span>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://168.thb.gov.tw/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded font-medium transition"
            >
              <span>公路局 168 即時路況</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.forest.gov.tw/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded font-medium transition"
            >
              <span>林業署林道開放動態</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-4 flex-grow">
          {ROAD_NOTICES.map((road, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-xl p-4 shadow-sm space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-800 text-white font-extrabold text-xs px-2.5 py-1 rounded-md">
                    {road.route}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">{road.name}</span>
                </div>
                <div className="text-xs">
                  {road.status === 'controlled' ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      <Clock className="w-3 h-3" /> 定時封閉管制
                    </span>
                  ) : road.status === 'warning' ? (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      <ShieldAlert className="w-3 h-3" /> 冬季雪管/降雪注意
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle2 className="w-3 h-3" /> 正常通行 (邊坡注意)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div>
                  <span className="font-semibold text-slate-700">管制區間：</span>
                  <span>{road.section}</span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-800">影響百岳：</span>
                  <span className="text-emerald-900 font-medium">{road.targetMountains}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                <div className="font-bold text-red-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {road.controlTime}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {road.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>亞馬遜高山接駁司機群出車前均會主動追蹤即時路況，保障登山客順利出入山。</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition"
          >
            關閉視窗
          </button>
        </div>

      </div>
    </div>
  );
};
