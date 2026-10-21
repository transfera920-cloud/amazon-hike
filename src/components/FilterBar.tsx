import React from 'react';
import { BranchName, RoadStatus } from '../types';
import { BRANCH_LIST, STATUS_LIST } from '../data/forestRoads';
import { Search, X, RotateCcw, Filter, Trash2 } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBranch: BranchName | '全部';
  onSelectBranch: (branch: BranchName | '全部') => void;
  selectedStatus: RoadStatus | '全部';
  onSelectStatus: (status: RoadStatus | '全部') => void;
  branchCounts: Record<BranchName | '全部', number>;
  onResetFilters: () => void;
  totalFilteredCount: number;
  modifiedCount: number;
  onResetAllToUnconfirmed: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedBranch,
  onSelectBranch,
  selectedStatus,
  onSelectStatus,
  branchCounts,
  onResetFilters,
  totalFilteredCount,
  modifiedCount,
  onResetAllToUnconfirmed,
}) => {
  const isFiltered = searchQuery !== '' || selectedBranch !== '全部' || selectedStatus !== '全部';

  return (
    <div className="space-y-4 mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Search Input & Reset Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋林道名稱（例如：大鹿、郡大、桶后、司馬限、大雪山...）"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
              title="清除搜尋"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter controls & Reset all button */}
        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          <span className="text-xs text-slate-400 font-medium">
            符合條件：<strong className="text-emerald-400 font-bold">{totalFilteredCount}</strong> 條
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              重設篩選
            </button>
          )}

          {/* 方案 B: 重設全部為未確認 按鈕 */}
          <button
            type="button"
            onClick={onResetAllToUnconfirmed}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              modifiedCount > 0
                ? 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-800/80 shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border-slate-700/60'
            }`}
            title="清除瀏覽器儲存的手動狀態記錄，將 83 條林道全部恢復為未確認"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>重設全部為未確認</span>
            {modifiedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-900 text-rose-200 text-[10px] font-mono">
                已自訂 {modifiedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Branch selector pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>依分署篩選：</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onSelectBranch('全部')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedBranch === '全部'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700/60'
            }`}
          >
            全部 ({branchCounts['全部'] ?? 0})
          </button>
          {BRANCH_LIST.map((branch) => {
            const count = branchCounts[branch] ?? 0;
            const isSelected = selectedBranch === branch;
            return (
              <button
                key={branch}
                type="button"
                onClick={() => onSelectBranch(branch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700/60'
                }`}
              >
                {branch} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Status selector pills */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>依開放狀態篩選：</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onSelectStatus('全部')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedStatus === '全部'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700/60'
            }`}
          >
            全部狀態
          </button>
          {STATUS_LIST.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onSelectStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700/60'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
