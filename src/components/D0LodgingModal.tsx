import React, { useState } from 'react';
import { X, Hotel, MapPin, Phone, ExternalLink, Search, Coffee, Moon, Shield } from 'lucide-react';

interface D0LodgingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LodgingItem {
  name: string;
  region: string;
  mountains: string;
  phone: string;
  address: string;
  driveTime: string;
  features: string[];
  priceRange: string;
  notes: string;
}

const LODGINGS: LodgingItem[] = [
  {
    name: '春陽溫泉瑪莉溫泉景觀山莊',
    region: '仁愛鄉 / 廬山春陽',
    mountains: '奇萊南華、能高越嶺、合歡山群峰',
    phone: '049-2803222',
    address: '南投縣仁愛鄉春陽村虎門巷100號',
    driveTime: '車程約 35 分鐘至屯原登山口',
    features: ['天然溫泉舒緩', '登山客專屬床位', '有接駁車專用停車場', '大背包放置區'],
    priceRange: '背包房 $600~800 / 通鋪套房 $2000 起',
    notes: '登奇萊南華最經典的 D0 基地，下山還能泡溫泉洗滌疲勞。'
  },
  {
    name: '清境天池山莊前哨優質客棧',
    region: '仁愛鄉 / 清境霧社',
    mountains: '合歡主東峰、北西峰、小奇萊',
    phone: '049-2802188',
    address: '南投縣仁愛鄉仁和路',
    driveTime: '車程約 40 分鐘至武嶺 / 小奇萊',
    features: ['高海拔適應良好 (約2000m)', '提供早早起外帶餐盒', '24小時冷熱開水供應'],
    priceRange: '$700~1200 / 人',
    notes: '適合第一天先在海拔2000公尺適應高山氣壓，預防高山症。'
  },
  {
    name: '環山部落喜瑪恩民宿',
    region: '台中和平 / 環山部落',
    mountains: '志佳陽大山、雪山主東峰、武陵四秀',
    phone: '0912-345999',
    address: '台中市和平區平等里中興路三段環山部落',
    driveTime: '步行 5 分鐘抵達志佳陽四季蘭溪吊橋登山口',
    features: ['志佳陽單攻最佳起點', '泰雅族接待家庭', '清晨 02:00 可出發', '可借用廚房熱食'],
    priceRange: '$600~900 / 床位',
    notes: '志佳陽大山單攻或雪山單攻不可或缺的 D0 庇護所。'
  },
  {
    name: '武陵富野渡假村 / 武陵農場國民賓館',
    region: '台中和平 / 武陵農場內',
    mountains: '雪山登山口、桃山、池有、品田、喀拉業',
    phone: '04-25901259',
    address: '台中市和平區武陵路3-1號',
    driveTime: '園區內接駁 10 分鐘直抵雪山大水池登山口',
    features: ['直接位於園區內', '免去清晨進武陵門票排隊', '完登洗澡餐飲充足'],
    priceRange: '$2800~4500 / 間 (亦有露營區 $1000)',
    notes: '提早進駐武陵農場，省去半夜從宜蘭或梨山趕車的疲累。'
  },
  {
    name: '東埔山莊 (玉山登山口前哨)',
    region: '南投信義 / 塔塔加',
    mountains: '玉山主峰、前西東北峰、鹿林麟趾山',
    phone: '049-2702213',
    address: '南投縣信義鄉同富村太平巷118號 (台21線144K)',
    driveTime: '步行 10 分鐘到塔塔加排雲管制站，轉乘接駁車',
    features: ['海拔 2,580 公尺適應極佳', '通鋪床位附暖被', '提供微波爐與熱水', '清晨登山不疾不徐'],
    priceRange: '$400 / 床位 (需提前抽籤或預訂)',
    notes: '攀登玉山群峰無可取代的 D0 聖地，高度適應首選。'
  },
  {
    name: '望鄉部落谷立香草民宿',
    region: '南投信義 / 望鄉部落',
    mountains: '郡大山、西巒大山、八通關古道',
    phone: '0928-360815',
    address: '南投縣信義鄉望美村望和巷',
    driveTime: '郡大林道 0K 起點旁，接駁車直達',
    features: ['布農族部落氛圍', '可代訂 4WD 郡大林道專車', '可洗熱水澡', '視野開闊見玉山主峰'],
    priceRange: '$800~1200 / 人',
    notes: '坐擁玉山群峰景致，前往郡大山 32K 登山口前一晚最溫暖的家。'
  },
  {
    name: '向陽國家森林遊樂區營地 / 關山天龍飯店',
    region: '台東海端 / 霧鹿南橫',
    mountains: '嘉明湖 (向陽登山口)、戒茂斯、南橫三星',
    phone: '089-935075',
    address: '台東縣海端鄉霧鹿村1-1號 (南橫公路)',
    driveTime: '車程約 45 分鐘抵達向陽派出所登山口',
    features: ['南橫地熱溫泉', '舒緩下肢緊繃', '備有清晨接駁配合時段'],
    priceRange: '$1800 起 / 間',
    notes: '爬嘉明湖與庫哈諾辛山前一晚的高規格休養首選。'
  },
  {
    name: '觀霧雲山房 / 觀霧山莊',
    region: '苗栗泰安 / 新竹五峰',
    mountains: '大霸尖山 (大鹿林道東線)、榛山、觀霧榛山步道',
    phone: '03-5856380',
    address: '苗栗縣泰安鄉梅園村觀霧1-3號',
    driveTime: '距離大鹿林道 0.3K 管制站僅 5~10 分鐘',
    features: ['霧林帶清幽空氣', '免開2小時深山夜路', '床位舒適附暖氣'],
    priceRange: '$1200~3200 / 人',
    notes: '踢大鹿林道 19K 前一晚最能保持充沛體力的起點。'
  }
];

export const D0LodgingModal: React.FC<D0LodgingModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('全部');

  if (!isOpen) return null;

  const regions = ['全部', '合歡/奇萊', '雪山/武陵', '玉山/塔塔加', '嘉明湖/南橫', '大霸/觀霧'];

  const filteredLodgings = LODGINGS.filter(item => {
    const matchesSearch = item.name.includes(searchTerm) ||
      item.mountains.includes(searchTerm) ||
      item.region.includes(searchTerm);

    if (selectedRegion === '全部') return matchesSearch;
    if (selectedRegion === '合歡/奇萊') return matchesSearch && (item.mountains.includes('合歡') || item.mountains.includes('奇萊') || item.mountains.includes('能高'));
    if (selectedRegion === '雪山/武陵') return matchesSearch && (item.mountains.includes('雪山') || item.mountains.includes('志佳陽') || item.mountains.includes('武陵'));
    if (selectedRegion === '玉山/塔塔加') return matchesSearch && (item.mountains.includes('玉山') || item.mountains.includes('郡大') || item.mountains.includes('望鄉'));
    if (selectedRegion === '嘉明湖/南橫') return matchesSearch && (item.mountains.includes('嘉明湖') || item.mountains.includes('向陽') || item.mountains.includes('南橫'));
    if (selectedRegion === '大霸/觀霧') return matchesSearch && (item.mountains.includes('大霸') || item.mountains.includes('觀霧'));
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100">
        
        {/* Header */}
        <div className="bg-[#0f3822] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-[#00c853] flex items-center justify-center">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">D0 前哨住宿精選推薦</h3>
              <p className="text-xs text-emerald-200">登山口周邊優質民宿 ‧ 高海拔適應 ‧ 提早休養充沛體能</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="搜尋百岳名稱（如：雪山、玉山、嘉明湖、合歡山、郡大山...）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {regions.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  selectedRegion === r
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-grow">
          {filteredLodgings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              查無符合條件的住宿，歡迎輸入其他山脈關鍵字搜尋。
            </div>
          ) : (
            filteredLodgings.map((lodging, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-xl p-4 shadow-sm hover:shadow transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span>{lodging.name}</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {lodging.region}
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      適用山線：{lodging.mountains}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-800 sm:text-right">
                    {lodging.priceRange}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{lodging.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Moon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{lodging.driveTime}</span>
                  </div>
                </div>

                {/* Features Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lodging.features.map((f, fIdx) => (
                    <span
                      key={fIdx}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                    >
                      <Coffee className="w-3 h-3 text-emerald-700" />
                      {f}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded leading-relaxed">
                  💡 {lodging.notes}
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500">預約諮詢專線：</span>
                  <a
                    href={`tel:${lodging.phone}`}
                    className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-bold transition shadow-xs"
                  >
                    <Phone className="w-3 h-3" />
                    {lodging.phone}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>亞馬遜高山接駁提供全台各登山口至配合民宿點對點彈性接送。</span>
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
