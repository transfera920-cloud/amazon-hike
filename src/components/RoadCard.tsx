import React, { useState } from 'react';
import { ForestRoad, RoadStatus } from '../types';
import { STATUS_LIST } from '../data/forestRoads';
import {
  MapPin,
  Phone,
  Gauge,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  XCircle,
  Edit3,
} from 'lucide-react';

interface RoadCardProps {
  road: ForestRoad;
  onStatusChange: (id: number, status: RoadStatus) => void;
}

export const RoadCard: React.FC<RoadCardProps> = ({ road, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Subtle branch badge styling
  const branchColorMap: Record<string, string> = {
    宜蘭分署: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    新竹分署: 'bg-teal-950/70 text-teal-300 border-teal-800/60',
    臺中分署: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
    南投分署: 'bg-lime-950/70 text-lime-300 border-lime-800/60',
    嘉義分署: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
    屏東分署: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    臺東分署: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
    花蓮分署: 'bg-violet-950/70 text-violet-300 border-violet-800/60',
  };

  const branchBadgeClass =
    branchColorMap[road.branch] || 'bg-slate-800 text-slate-300 border-slate-700';

  // Status visual map
  const statusVisualMap: Record<
    RoadStatus,
    { badgeClass: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    未確認: {
      badgeClass: 'bg-amber-950/70 border-amber-700/70 text-amber-300',
      icon: AlertCircle,
    },
    全線暢通: {
      badgeClass: 'bg-emerald-950/70 border-emerald-700/70 text-emerald-300',
      icon: CheckCircle2,
    },
    部分封閉: {
      badgeClass: 'bg-orange-950/70 border-orange-700/70 text-orange-300',
      icon: AlertTriangle,
    },
    交通管制: {
      badgeClass: 'bg-blue-950/70 border-blue-700/70 text-blue-300',
      icon: ShieldAlert,
    },
    全線封閉: {
      badgeClass: 'bg-rose-950/70 border-rose-700/70 text-rose-300',
      icon: XCircle,
    },
  };

  const currentVisual = statusVisualMap[road.status] || statusVisualMap['未確認'];
  const StatusIcon = currentVisual.icon;

  const isCustomUpdated = road.lastUpdated !== '未確認';

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col overflow-hidden">
      {/* Top Header Section */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              #{String(road.id).padStart(2, '0')}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${branchBadgeClass}`}
            >
              {road.branch}
            </span>
          </div>

          {/* 方案 B: 手動修改開放狀態下拉選擇器 */}
          <div
            className="shrink-0 relative"
            title="手動修改開放狀態（會即時儲存至瀏覽器）"
          >
            <div className="flex items-center gap-1.5">
              <label htmlFor={`status-select-${road.id}`} className="sr-only">
                修改狀態
              </label>
              <div className="relative">
                <select
                  id={`status-select-${road.id}`}
                  value={road.status}
                  onChange={(e) => onStatusChange(road.id, e.target.value as RoadStatus)}
                  className={`text-xs font-semibold pl-2.5 pr-7 py-1 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${currentVisual.badgeClass}`}
                >
                  {STATUS_LIST.map((st) => (
                    <option key={st} value={st} className="bg-slate-900 text-slate-100 py-1">
                      {st}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
                  <Edit3 className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 展開說明規則：直接點擊「林道名稱」或旁邊的小勾勾展開/收合說明 */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 text-left cursor-pointer transition-all duration-150 ${
              isExpanded
                ? 'border border-emerald-500/70 bg-emerald-950/40 text-emerald-300 px-2.5 py-1 rounded-xl shadow-sm'
                : 'px-1.5 py-0.5 rounded-lg hover:bg-slate-800/80 text-slate-100 hover:text-emerald-300'
            }`}
            title={isExpanded ? '點擊收合說明' : '點擊林道名稱或小勾勾展開說明'}
            aria-expanded={isExpanded}
          >
            <h2 className="text-lg font-bold tracking-tight">
              {road.name}
            </h2>
            <span
              className="inline-flex items-center transition-transform duration-200"
              aria-hidden="true"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0" />
              )}
            </span>
          </button>

          <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{road.status}</span>
          </span>
        </div>
      </div>

      {/* Meta Information Grid (只顯示：起點、可通行里程、電話、最後更新時間) */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-800/70 bg-slate-950/40 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
        {/* 起點位置 */}
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-slate-500 block text-[11px]">起點位置</span>
            <span className="font-medium text-slate-200 truncate block">
              {road.startLocation}
            </span>
          </div>
        </div>

        {/* 可通行至幾公里 */}
        <div className="flex items-start gap-2">
          <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 block text-[11px]">可通行里程</span>
            <span className="font-medium text-slate-200">{road.passableMileage}</span>
          </div>
        </div>

        {/* 官方路況通報電話 */}
        <div className="flex items-start gap-2">
          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 block text-[11px]">官方通報電話</span>
            <span className="font-medium text-slate-200">{road.officialPhone}</span>
          </div>
        </div>

        {/* 最後更新時間 */}
        <div className="flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 block text-[11px]">最後更新時間</span>
            <span className={`font-medium ${isCustomUpdated ? 'text-emerald-300 font-mono text-[11px]' : 'text-slate-200'}`}>
              {road.lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Description Drawer (卡片底部無額外展開按鈕，由林道名稱點擊觸發) */}
      {isExpanded && (
        <div className="px-4 sm:px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-300 space-y-2 animate-fadeIn">
          <div className="space-y-1">
            <h4 className="font-semibold text-emerald-400">林道概況說明</h4>
            <p className="text-slate-300/90 leading-relaxed">{road.description}</p>
            {road.detailUrl && (
              <a
                href={road.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                查看林保署官方詳細說明 ↗
              </a>
            )}
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
            <span>
              亞馬遜國家山岳協會提醒：山區林道易因降雨崩塌，入山前請向{road.branch}核實當天路況。
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
