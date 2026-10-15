import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Grid3X3, ExternalLink } from 'lucide-react';
import type { CalendarActivity } from '../types.js';

interface CalendarSectionProps {
  activities: CalendarActivity[];
  loading: boolean;
  error?: string | null;
}

type ViewMode = 'month' | 'year' | 'list';

export const CalendarSection: React.FC<CalendarSectionProps> = ({ activities, loading, error }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Active view date
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // If activities exist in the future, default to current month or first activity month
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper format 'YYYY-MM-DD'
  const formatDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Generate weeks for month view
  const weeks = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start on Sunday

    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
    }

    const weeksList: Date[][] = [];
    let currentWeek: Date[] = [];
    const iter = new Date(startDate);

    while (iter <= endDate) {
      currentWeek.push(new Date(iter));
      if (currentWeek.length === 7) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }
      iter.setDate(iter.getDate() + 1);
    }
    return weeksList;
  }, [year, month]);

  // Map activities for month week segments
  const getWeekEvents = (week: Date[]) => {
    const weekStartStr = formatDateStr(week[0]);
    const weekEndStr = formatDateStr(week[6]);

    return activities.filter((act) => {
      const actStart = act.startDate;
      const actEnd = act.endDate || act.startDate;
      return actStart <= weekEndStr && actEnd >= weekStartStr;
    });
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4" aria-label="活動行事曆">
      {/* Calendar Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-3 mb-3">
        {/* Title & Date Navigation */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-100 flex items-center gap-2">
              活動行事曆
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-normal">
                {year} 年 {viewMode === 'month' ? `${month + 1} 月` : ''}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={viewMode === 'year' ? handlePrevYear : handlePrevMonth}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              aria-label="前一個週期"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2 py-0.5 text-xs font-medium rounded border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              今天
            </button>
            <button
              type="button"
              onClick={viewMode === 'year' ? handleNextYear : handleNextMonth}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              aria-label="後一個週期"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs: 月曆 | 年度 | 列表 */}
        <div className="flex items-center border border-neutral-800 rounded bg-neutral-900/80 p-0.5 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            id="calendar-view-month"
          >
            <CalendarIcon size={13} />
            <span>月曆</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('year')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'year'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            id="calendar-view-year"
          >
            <Grid3X3 size={13} />
            <span>年度</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            id="calendar-view-list"
          >
            <List size={13} />
            <span>列表</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-3 p-2.5 rounded border border-rose-800/60 bg-rose-950/40 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="py-6 text-center text-xs text-neutral-400 animate-pulse">
          正在同步最新活動行事曆...
        </div>
      )}

      {/* ==================== 1. 月曆模式 (Month View) ==================== */}
      {viewMode === 'month' && !loading && (
        <div className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden shadow-md">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-900 text-center text-[11px] font-semibold text-neutral-400 py-1.5">
            <div className="text-rose-400">日</div>
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div className="text-emerald-400">六</div>
          </div>

          {/* Month Weeks Container */}
          <div className="divide-y divide-neutral-800">
            {weeks.map((week, wIdx) => {
              const weekEvents = getWeekEvents(week);
              const weekStart = week[0];

              return (
                <div key={wIdx} className="min-h-[58px] sm:min-h-[66px] relative flex flex-col justify-between">
                  {/* Day cell numbers background */}
                  <div className="grid grid-cols-7 divide-x divide-neutral-800/60 flex-1">
                    {week.map((day, dIdx) => {
                      const isCurrentMonth = day.getMonth() === month;
                      const isToday =
                        formatDateStr(day) === formatDateStr(new Date());

                      return (
                        <div
                          key={dIdx}
                          className={`p-1 transition-colors ${
                            isCurrentMonth ? 'bg-transparent' : 'bg-neutral-950/60 text-neutral-600'
                          }`}
                        >
                          <span
                            className={`inline-block text-[11px] font-medium px-1 py-0.5 rounded leading-none ${
                              isToday
                                ? 'bg-emerald-600 text-white font-bold'
                                : isCurrentMonth
                                ? dIdx === 0
                                  ? 'text-rose-400'
                                  : dIdx === 6
                                  ? 'text-emerald-400'
                                  : 'text-neutral-300'
                                : 'text-neutral-600'
                            }`}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Multi-day continuous event bars overlay */}
                  <div className="pb-1 px-0.5 space-y-0.5">
                    {weekEvents.map((event) => {
                      const actStart = new Date(event.startDate + 'T00:00:00');
                      const actEnd = new Date((event.endDate || event.startDate) + 'T00:00:00');

                      // Calculate column offset (0..6)
                      const diffStart = Math.floor(
                        (actStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const colStart = Math.max(0, diffStart);

                      const diffEnd = Math.floor(
                        (actEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const colEnd = Math.min(6, diffEnd);

                      const span = colEnd - colStart + 1;

                      // Display as ONE continuous item across columns
                      return (
                        <div
                          key={event.id}
                          className="grid grid-cols-7 gap-1"
                        >
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              gridColumn: `${colStart + 1} / span ${span}`,
                            }}
                            className="group flex items-center justify-between px-1.5 py-0.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-100 text-[11px] shadow-sm transition-all overflow-hidden cursor-pointer leading-tight"
                            title={`${event.title} (${event.startDate} ~ ${event.endDate || event.startDate})`}
                          >
                            <span className="font-medium truncate group-hover:text-white">
                              {event.title}
                            </span>
                            <ExternalLink size={9} className="text-emerald-400 opacity-70 group-hover:opacity-100 shrink-0 ml-1" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 2. 年度模式 (Year View) ==================== */}
      {viewMode === 'year' && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, mIdx) => {
              const monthDate = new Date(year, mIdx, 1);
              const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
              const firstDayIndex = monthDate.getDay();

              // Activities in this month
              const monthActivities = activities.filter((act) => {
                const s = act.startDate.split('-');
                const e = (act.endDate || act.startDate).split('-');
                const sY = parseInt(s[0]), sM = parseInt(s[1]) - 1;
                const eY = parseInt(e[0]), eM = parseInt(e[1]) - 1;

                const actStartNum = sY * 12 + sM;
                const actEndNum = eY * 12 + eM;
                const currentMonthNum = year * 12 + mIdx;

                return currentMonthNum >= actStartNum && currentMonthNum <= actEndNum;
              });

              return (
                <div
                  key={mIdx}
                  className="border border-neutral-800 rounded bg-neutral-900/40 p-3 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-2">
                    <span className="font-semibold text-xs text-neutral-200">
                      {mIdx + 1} 月
                    </span>
                    {monthActivities.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        {monthActivities.length} 項行程
                      </span>
                    )}
                  </div>

                  {/* Mini Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-500 mb-2">
                    <span className="text-rose-400 font-medium">日</span>
                    <span>一</span>
                    <span>二</span>
                    <span>三</span>
                    <span>四</span>
                    <span>五</span>
                    <span className="text-emerald-400 font-medium">六</span>

                    {/* Empty padding */}
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <span key={`pad-${i}`} />
                    ))}

                    {/* Days */}
                    {Array.from({ length: daysInMonth }).map((_, d) => {
                      const dayNum = d + 1;
                      const dateStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const hasEvent = monthActivities.some(
                        (a) => dateStr >= a.startDate && dateStr <= (a.endDate || a.startDate)
                      );

                      return (
                        <span
                          key={dayNum}
                          className={`py-0.5 rounded ${
                            hasEvent
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'text-neutral-400'
                          }`}
                        >
                          {dayNum}
                        </span>
                      );
                    })}
                  </div>

                  {/* List of activities in this month */}
                  {monthActivities.length > 0 ? (
                    <div className="space-y-1 pt-1 border-t border-neutral-800/60">
                      {monthActivities.map((act) => (
                        <a
                          key={act.id}
                          href={act.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11px] truncate text-emerald-400 hover:underline"
                          title={act.title}
                        >
                          · {act.startDate} {act.title}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-600 italic text-center py-1">
                      無排定行程
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 3. 列表模式 (List View) ==================== */}
      {viewMode === 'list' && !loading && (
        <div className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden shadow-xl">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              目前暫無排定之活動行程
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {activities
                .slice()
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-850/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                        <span>{act.title}</span>
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                        <span className="font-mono text-emerald-400">
                          {act.startDate}
                          {act.endDate && act.endDate !== act.startDate ? ` ~ ${act.endDate}` : ''}
                        </span>
                      </div>
                    </div>

                    <a
                      href={act.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 transition-colors"
                    >
                      <span>活動中心詳情</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
