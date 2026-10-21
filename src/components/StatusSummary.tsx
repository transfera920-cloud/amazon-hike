import React from 'react';
import { RoadStatus } from '../types';
import { AlertCircle, HelpCircle, CheckCircle2, AlertTriangle, ShieldAlert, XCircle } from 'lucide-react';

interface StatusSummaryProps {
  statusCounts: Record<RoadStatus | '全部', number>;
  selectedStatus: RoadStatus | '全部';
  onSelectStatus: (status: RoadStatus | '全部') => void;
  totalOfficialCount: number;
}

export const StatusSummary: React.FC<StatusSummaryProps> = ({
  statusCounts,
  selectedStatus,
  onSelectStatus,
  totalOfficialCount,
}) => {
  const statusConfig: {
    key: RoadStatus | '全部';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
    badgeClass: string;
  }[] = [
    {
      key: '全部',
      label: '全部林道',
      icon: HelpCircle,
      accentClass: 'border-slate-700 bg-slate-900/70 text-slate-200',
      badgeClass: 'bg-slate-800 text-slate-300',
    },
    {
      key: '未確認',
      label: '未確認',
      icon: AlertCircle,
      accentClass: 'border-amber-600/60 bg-amber-950/30 text-amber-300',
      badgeClass: 'bg-amber-900/60 text-amber-200 border border-amber-700/60',
    },
    {
      key: '全線暢通',
      label: '全線暢通',
      icon: CheckCircle2,
      accentClass: 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300',
      badgeClass: 'bg-emerald-900/50 text-emerald-200 border border-emerald-700/60',
    },
    {
      key: '部分封閉',
      label: '部分封閉',
      icon: AlertTriangle,
      accentClass: 'border-orange-600/60 bg-orange-950/20 text-orange-300',
      badgeClass: 'bg-orange-900/50 text-orange-200 border border-orange-700/60',
    },
    {
      key: '交通管制',
      label: '交通管制',
      icon: ShieldAlert,
      accentClass: 'border-blue-600/60 bg-blue-950/20 text-blue-300',
      badgeClass: 'bg-blue-900/50 text-blue-200 border border-blue-700/60',
    },
    {
      key: '全線封閉',
      label: '全線封閉',
      icon: XCircle,
      accentClass: 'border-rose-600/60 bg-rose-950/20 text-rose-300',
      badgeClass: 'bg-rose-900/50 text-rose-200 border border-rose-700/60',
    },
  ];

  return (
    <section className="mb-6">
      {/* Notice box */}
      <div className="mb-4 rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 p-4 sm:p-5 text-xs sm:text-sm text-slate-200 flex items-start gap-3 shadow-md">
        <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-100 flex items-center gap-2">
            <span>林業及自然保育署 83 條官方列管林道</span>
            <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              支援狀態自訂與自動儲存
            </span>
          </p>
          <p className="text-slate-400 leading-relaxed text-xs">
            本工具初始狀態全部客觀標示為「未確認」或「—」，杜絕未經查驗之虛假路況。您可於卡片右上角手動選擇最新狀態並即刻記住於瀏覽器，或由頁面右上角連結查閱林保署官方最新公告。
          </p>
        </div>
      </div>

      {/* Status chips grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {statusConfig.map((item) => {
          const isSelected = selectedStatus === item.key;
          const count = statusCounts[item.key] ?? 0;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectStatus(item.key)}
              className={`text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-emerald-400 border-emerald-500 bg-slate-800 shadow-md'
                  : 'hover:border-slate-600 border-slate-800 bg-slate-900/80 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 truncate">
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  {item.label}
                </span>
                {item.key === '全部' && (
                  <span className="text-[10px] text-slate-500 font-mono">共 {totalOfficialCount} 條</span>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-xl font-bold font-mono tracking-tight ${
                    item.key === '未確認' && count > 0
                      ? 'text-amber-400'
                      : item.key === '全線暢通' && count > 0
                      ? 'text-emerald-400'
                      : item.key === '部分封閉' && count > 0
                      ? 'text-orange-400'
                      : item.key === '交通管制' && count > 0
                      ? 'text-blue-400'
                      : item.key === '全線封閉' && count > 0
                      ? 'text-rose-400'
                      : isSelected
                      ? 'text-emerald-400'
                      : 'text-slate-200'
                  }`}
                >
                  {count}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">條</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
