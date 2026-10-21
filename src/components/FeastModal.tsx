import React, { useState } from 'react';
import { X, Utensils, MapPin, Phone, Car, Flame, CheckCircle, Search } from 'lucide-react';

interface FeastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RestaurantItem {
  name: string;
  location: string;
  exitPoint: string;
  specialty: string;
  signatureDishes: string[];
  phone: string;
  address: string;
  parking: string;
  notes: string;
}

const RESTAURANTS: RestaurantItem[] = [
  {
    name: '清境伊拿谷景觀餐廳 (甕缸雞/原民擺夷菜)',
    location: '南投仁愛 / 清境霧社',
    exitPoint: '合歡山群峰、小奇萊、合歡北西峰',
    specialty: '招牌脆皮高山甕缸雞、清蒸高山冷泉鱒魚、香糯竹筒飯',
    signatureDishes: ['脆皮甕缸雞', '當歸葉煎蛋', '清炒高山高麗菜', '刺蔥豆腐'],
    phone: '049-2803988',
    address: '南投縣仁愛鄉大同村仁和路信義巷36之1附1號',
    parking: '備有專用大型停車場，9人座/中巴好停',
    notes: '下合歡山沿台14甲順向必經，視野開闊俯瞰碧湖美景，下山洗滌身心首選。'
  },
  {
    name: '埔里金都餐廳 (國宴級在地風味合菜)',
    location: '南投埔里',
    exitPoint: '奇萊南華 (屯原)、能高越嶺、合歡山下山抵達埔里',
    specialty: '紹興宣紙蔗筍東坡肉、筊白筍風味餐、刺蔥土雞湯',
    signatureDishes: ['紹興蔗筍肉', '埔里米粉合菜', '野薑花山珍羹', '百香果排骨'],
    phone: '049-2995508',
    address: '南投縣埔里鎮信義路236號',
    parking: '超大附屬停車場，接駁車無縫接軌',
    notes: '完登奇萊南華後全隊包桌慶功宴最具代表性餐廳，菜色豐富精緻。'
  },
  {
    name: '水里野鴨谷餐廳 (梅子風味山產熱炒)',
    location: '南投水里',
    exitPoint: '玉山群峰 (塔塔加)、郡大山、西巒大山',
    specialty: '脆皮烤鴨、紫蘇梅子雞、水里過貓野菜、三杯土雞',
    signatureDishes: ['紫蘇梅子雞', '脆皮烤鴨', '三杯山雞', '高山筍片排骨湯'],
    phone: '049-2770058',
    address: '南投縣水里鄉中山路一段419號',
    parking: '路邊及專屬停車位極充裕',
    notes: '玉山下山走台21線出水里最受山友讚賞的合菜名店，份量大又補給滿分！'
  },
  {
    name: '礁溪火山爆發雞 (宜蘭在地放山烤雞)',
    location: '宜蘭礁溪',
    exitPoint: '雪山主東、武陵四秀、南湖大山 (台7甲返宜蘭交流道)',
    specialty: '特製中藥醃製火山爆發雞、宜蘭糕渣、溫泉空心菜',
    signatureDishes: ['火山爆發雞', '三星蔥炒牛肉', '熱炒山豬肉', '免費白飯豬油拌飯吃到飽'],
    phone: '03-9888111',
    address: '宜蘭縣礁溪鄉礁溪路七段39號 (國5頭城交流道旁)',
    parking: '佔地廣大停車場，備有山友換裝洗手間',
    notes: '南湖大山、雪山下山必吃！剛出爐外脆內多汁，豬油拌飯免費供應讓山友快速回血。'
  },
  {
    name: '關山宏昌客家菜館 (嘉明湖下山客家大席)',
    location: '台東關山',
    exitPoint: '嘉明湖 (向陽登山口)、戒茂斯、南橫三星',
    specialty: '在地無菜單合菜、悶雞料理、關山米香炒粄條',
    signatureDishes: ['宏昌悶全雞', '關山豬肉合菜', '放山土雞切盤', '季節時令山野菜'],
    phone: '089-811321',
    address: '台東縣關山鎮中福路35號',
    parking: '門前寬敞可停多輛接駁車',
    notes: '走出南橫公路後的甘露！需提前電話預約，以台東關山縱谷食材撫慰登山客。'
  },
  {
    name: '竹東范姜老店客家合菜',
    location: '新竹竹東',
    exitPoint: '大霸尖山 (觀霧林道)、霞喀羅古道',
    specialty: '道地客家小炒、薑絲大腸、客家鹹豬肉、酸菜白肉鍋',
    signatureDishes: ['客家小炒', '薑絲炒大腸', '梅干扣肉', '熱呼呼仙草雞湯'],
    phone: '03-5962828',
    address: '新竹縣竹東鎮長春路三段',
    parking: '周邊方便停車',
    notes: '踢完大霸尖山 19 公里大鹿林道後的極致熱食補給，熱湯暖胃最過癮。'
  }
];

export const FeastModal: React.FC<FeastModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExit, setSelectedExit] = useState('全部');

  if (!isOpen) return null;

  const exits = ['全部', '合歡/奇萊/能高', '玉山/郡大/水里', '雪山/武陵/宜蘭', '嘉明湖/南橫', '大霸/觀霧'];

  const filtered = RESTAURANTS.filter(item => {
    const matchText = item.name.includes(searchTerm) ||
      item.exitPoint.includes(searchTerm) ||
      item.specialty.includes(searchTerm) ||
      item.location.includes(searchTerm);

    if (selectedExit === '全部') return matchText;
    if (selectedExit === '合歡/奇萊/能高') return matchText && (item.exitPoint.includes('合歡') || item.exitPoint.includes('奇萊') || item.exitPoint.includes('能高'));
    if (selectedExit === '玉山/郡大/水里') return matchText && (item.exitPoint.includes('玉山') || item.exitPoint.includes('郡大') || item.exitPoint.includes('水里'));
    if (selectedExit === '雪山/武陵/宜蘭') return matchText && (item.exitPoint.includes('雪山') || item.exitPoint.includes('武陵') || item.exitPoint.includes('南湖'));
    if (selectedExit === '嘉明湖/南橫') return matchText && (item.exitPoint.includes('嘉明湖') || item.exitPoint.includes('南橫'));
    if (selectedExit === '大霸/觀霧') return matchText && (item.exitPoint.includes('大霸') || item.exitPoint.includes('觀霧'));
    return matchText;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-emerald-100">
        
        {/* Header */}
        <div className="bg-[#0f3822] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-[#00c853] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">下山慶功宴餐廳與補給指南</h3>
              <p className="text-xs text-emerald-200">登頂平安歸來 ‧ 完登大啖山產熱炒烤雞 ‧ 接駁車直達門口</p>
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
              placeholder="搜尋餐廳、百岳或菜色（如：甕仔雞、埔里、玉山、宜蘭...）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {exits.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setSelectedExit(e)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  selectedExit === e
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-grow">
          {filtered.map((r, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-xl p-4 shadow-sm hover:shadow transition space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{r.name}</span>
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {r.location}
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    出山口對應：{r.exitPoint}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/80">
                <span className="font-bold text-emerald-900">特色菜色：</span>
                <span className="text-slate-700 ml-1">{r.specialty}</span>
              </div>

              {/* Signature Dishes */}
              <div className="flex flex-wrap gap-1.5">
                {r.signatureDishes.map((dish, dIdx) => (
                  <span
                    key={dIdx}
                    className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium"
                  >
                    <Flame className="w-3 h-3 text-orange-500" />
                    {dish}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{r.address}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <Car className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{r.parking}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded leading-relaxed">
                💬 {r.notes}
              </p>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500">訂位電話（建議提早下山前預約）：</span>
                <a
                  href={`tel:${r.phone}`}
                  className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-bold transition shadow-xs"
                >
                  <Phone className="w-3 h-3" />
                  {r.phone}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>亞馬遜高山接駁行程均可配合全隊在慶功宴餐廳用餐等候，吃飽後再載送返程！</span>
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
