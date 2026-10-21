import React, { useState } from 'react';
import { X, Calculator, MapPin, Car, Users, ArrowRight, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';

interface PriceCalcModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineUrl: string;
  phone: string;
}

interface MountainRoute {
  name: string;
  category: string;
  basePrices: Record<string, number>; // city: price for 9-seater
  description: string;
  estimatedHours: string;
}

export const DEPARTURE_CITIES = ['台北/新北', '桃園', '新竹', '台中', '彰化', '嘉義', '台南', '高雄', '宜蘭'];

export const ROUTES: MountainRoute[] = [
  {
    name: '合歡山群峰｜武嶺｜小奇萊',
    category: '合歡山系',
    basePrices: {
      '台北/新北': 8000,
      '桃園': 7500,
      '新竹': 7000,
      '台中': 5000,
      '彰化': 5500,
      '嘉義': 6500,
      '台南': 7500,
      '高雄': 8500,
      '宜蘭': 7500
    },
    description: '石門山、合歡群峰、小奇萊登山口',
    estimatedHours: '台中約 2.5 小時 / 台北約 4 小時'
  },
  {
    name: '雪山登山口服務站',
    category: '雪山山脈',
    basePrices: {
      '台北/新北': 7500,
      '桃園': 7500,
      '新竹': 7500,
      '台中': 7000,
      '彰化': 7500,
      '嘉義': 8500,
      '台南': 9500,
      '高雄': 10500,
      '宜蘭': 5500
    },
    description: '雪山主東峰',
    estimatedHours: '台北/宜蘭約 3~3.5 小時 / 台中約 4 小時'
  },
  {
    name: '武陵山莊',
    category: '雪山山脈',
    basePrices: {
      '台北/新北': 7500,
      '桃園': 7500,
      '新竹': 7500,
      '台中': 7000,
      '彰化': 7500,
      '嘉義': 8500,
      '台南': 9500,
      '高雄': 10500,
      '宜蘭': 5500
    },
    description: '武陵四秀（桃山、池有、品田、喀拉業）',
    estimatedHours: '台北/宜蘭約 3~3.5 小時 / 台中約 4 小時'
  },
  {
    name: '玉山登山口｜塔塔加停車場',
    category: '玉山山脈',
    basePrices: {
      '台北/新北': 9000,
      '桃園': 8500,
      '新竹': 8000,
      '台中': 6000,
      '彰化': 6000,
      '嘉義': 4500,
      '台南': 5500,
      '高雄': 6500,
      '宜蘭': 9500
    },
    description: '玉山群峰、麟趾山、鹿林山',
    estimatedHours: '嘉義約 2.5 小時 / 台中約 3 小時 / 台北約 4.5 小時'
  },
  {
    name: '嘉明湖｜向陽國家森林遊樂區',
    category: '南二段',
    basePrices: {
      '台北/新北': 12000,
      '桃園': 12000,
      '新竹': 12000,
      '台中': 11000,
      '彰化': 11000,
      '嘉義': 10000,
      '台南': 9500,
      '高雄': 9000,
      '宜蘭': 11000
    },
    description: '天使的眼淚嘉明湖、向陽山、三叉山，南橫台20線接駁',
    estimatedHours: '高雄約 3.5 小時 / 台北走花東約 6 小時'
  },
  {
    name: '奇萊南華｜屯原登山口',
    category: '中央山脈',
    basePrices: {
      '台北/新北': 8000,
      '桃園': 7500,
      '新竹': 7000,
      '台中': 5000,
      '彰化': 5500,
      '嘉義': 6500,
      '台南': 7500,
      '高雄': 8500,
      '宜蘭': 8000
    },
    description: '能高越嶺西段、奇萊南峰、南華山黃金大草原',
    estimatedHours: '台中約 2.5 小時 / 台北約 4 小時'
  },
  {
    name: '大霸尖山｜觀霧大鹿林道東線口',
    category: '雪山山脈',
    basePrices: {
      '台北/新北': 7500,
      '桃園': 7000,
      '新竹': 5500,
      '台中': 6500,
      '彰化': 7000,
      '嘉義': 8000,
      '台南': 9000,
      '高雄': 10000,
      '宜蘭': 8500
    },
    description: '世紀奇峰大霸群峰、觀霧遊憩區',
    estimatedHours: '新竹約 2.5 小時 / 台北約 3.5 小時'
  },
  {
    name: '郡大山｜望鄉部落 (含林道接駁)',
    category: '玉山山脈',
    basePrices: {
      '台北/新北': 9500,
      '桃園': 9000,
      '新竹': 8500,
      '台中': 6500,
      '彰化': 6500,
      '嘉義': 6500,
      '台南': 7500,
      '高雄': 8500,
      '宜蘭': 10000
    },
    description: '八大秀、郡大林道 32K 搖晃專車直達登山口',
    estimatedHours: '台中約 2.5 小時 + 林道約 2.5 小時'
  }
];

export const PriceCalcModal: React.FC<PriceCalcModalProps> = ({ isOpen, onClose, lineUrl, phone }) => {
  const [city, setCity] = useState('台北/新北');
  const [routeName, setRouteName] = useState(ROUTES[0].name);
  const [tripType, setTripType] = useState<'single' | 'round'>('round');
  const [vehicleType, setVehicleType] = useState<'9seater' | '7seater' | '4x4'>('9seater');
  const [passengers, setPassengers] = useState(7);
  const [isNightDrive, setIsNightDrive] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const currentRoute = ROUTES.find(r => r.name === routeName) || ROUTES[0];
  const basePriceForCity = currentRoute.basePrices[city] || 7000;

  // Multipliers
  let vehicleMultiplier = 1.0;
  if (vehicleType === '7seater') vehicleMultiplier = 0.9;
  if (vehicleType === '4x4') vehicleMultiplier = 1.15; // 專用四傳高底盤

  let tripMultiplier = tripType === 'round' ? 1.85 : 1.0; // Round trip discount
  let nightAddon = isNightDrive ? 800 : 0;

  const rawTotal = Math.round((basePriceForCity * vehicleMultiplier * tripMultiplier + nightAddon) / 100) * 100;
  const perPerson = passengers > 0 ? Math.round(rawTotal / passengers) : rawTotal;

  const getVehicleLabel = () => {
    if (vehicleType === '9seater') return '9人座商務高頂福斯/現代 (可載6~8人+大登山包)';
    if (vehicleType === '7seater') return '7人座舒適休旅 (適合3~4人+大包)';
    return '高底盤四驅車 (適合林道碎石深山路線)';
  };

  const bookingSummary = `您好！我在亞馬遜高山接駁網站試算行程：
【行程路線】${routeName}
【出發地點】${city}
【行程類型】${tripType === 'round' ? '來回包車接駁' : '單程包車'}
【選電車款】${vehicleType === '9seater' ? '9人座商務車' : vehicleType === '7seater' ? '7人座休旅' : '高底盤4WD'}
【乘客人數】${passengers} 人
【深夜時段】${isNightDrive ? '包含夜間/D0跨夜出發' : '一般白天時段'}
【試算預估】約 NT$ ${rawTotal.toLocaleString()} 元（平均每人 NT$ ${perPerson.toLocaleString()} 元）
請問欲預約日期是否有車趟？謝謝！`;

  const handleCopyAndLine = () => {
    navigator.clipboard.writeText(bookingSummary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
    window.open(lineUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100">
        
        {/* Header */}
        <div className="bg-[#0f3822] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-[#00c853] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">高山包車接駁價格快速估算</h3>
              <p className="text-xs text-emerald-200">價格透明化 ‧ 合法營業車輛 ‧ 乘客平安險保障</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Step 1: Route & City */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>1. 選擇接駁路線與出發城市</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">目標百岳 / 登山口</label>
                <select
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {ROUTES.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{currentRoute.description}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">出發地區 / 集合城市</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {DEPARTURE_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  ⏱ 車程估算：{currentRoute.estimatedHours}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Vehicle & Trip */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-700" />
              <span>2. 車型與行程模式</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">接送類型</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTripType('round')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition text-center ${
                      tripType === 'round'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    來回包車 (去+回程)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('single')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition text-center ${
                      tripType === 'single'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    單程送達 / 單程接回
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">車型選擇</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="9seater">9人座商務廂型車 (最多坐 7~8人 + 大背包)</option>
                  <option value="7seater">7人座休旅車 (最多坐 3~4人 + 大背包)</option>
                  <option value="4x4">4WD高底盤越野專車 (郡大等險阻林道)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{getVehicleLabel()}</p>
              </div>
            </div>

            {/* Extra Options */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-600">登山隊乘車人數：</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={passengers}
                  onChange={(e) => setPassengers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
                  className="w-14 border border-slate-300 rounded p-1 text-center font-bold text-slate-800 bg-white"
                />
                <span className="text-xs text-slate-500">人</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNightDrive}
                  onChange={(e) => setIsNightDrive(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs text-slate-700">D0跨夜 / 凌晨出發 (含夜間加成 $800)</span>
              </label>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-[#0f3822] text-white p-5 rounded-xl shadow-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-700/60 pb-3">
              <div>
                <span className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">包車總預估資費</span>
                <div className="text-3xl font-extrabold text-[#00c853] tracking-tight">
                  NT$ {rawTotal.toLocaleString()}
                  <span className="text-xs text-emerald-200 font-normal ml-2">元 / 車</span>
                </div>
              </div>

              <div className="text-right bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="text-xs text-emerald-200">隊員平均每人分攤</div>
                <div className="text-xl font-bold text-white">
                  約 NT$ {perPerson.toLocaleString()} <span className="text-xs">元 / 人</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-emerald-100 flex items-start gap-1.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-[#00c853] flex-shrink-0 mt-0.5" />
              <span>
                費用包含：車資、司機專業駕駛工資、油資、過路費、乘客500萬高額責任險。不含武陵農場等園區個人門票及司機D0外宿餐費（如需跨多日過夜留守請洽專員確認）。
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={`tel:${phone}`}
            className="text-xs text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            直接電話諮詢：<span className="underline font-bold text-emerald-800">{phone}</span>
          </a>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyAndLine}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00c853] hover:bg-[#00e676] text-white font-bold px-5 py-2.5 rounded-lg shadow-sm transition text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isCopied ? '已複製！開啟 LINE 預約中...' : '帶入報價加 LINE 預約'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
