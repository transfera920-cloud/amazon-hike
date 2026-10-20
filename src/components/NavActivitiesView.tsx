import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  Link2,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { normalizeUrl, isInternalUrl } from '../utils/url.js';
import { renderLinkedText } from './PageTextBlock.js';
import {
  getCategorySlug,
  isPeakTableButton,
  isPeakOverviewButton,
  resolveNavButtonIntroParagraphs,
  PEAK_INTRO_PARAGRAPHS,
} from '../utils/activitySeo.js';
import type { NavButtonItem, NavButtonActivity, NavButtonEntry } from '../types.js';


/* ------------------------------------------------------------------ *
 * 百岳總表：維基百科式表格版面
 * 不新增任何後台欄位，直接由「活動標題」解析：
 *   「001玉山3952五岳-1」「003 玉山東峰 3874 十峻-1」→ 編號／山名／高度／群組
 * 解析不出來的列會退回顯示完整標題，不會壞版。
 * ------------------------------------------------------------------ */

// 導讀預設文字與「百岳總表」判斷集中在 utils/activitySeo.ts（前台與 SSR 外殼共用）
export { PEAK_INTRO_PARAGRAPHS };

const PEAK_HOW_TO_READ: string[] = [
  '山名帶有底線與箭頭者，可點選進入該山的詳細說明頁（行程時間、行前裝備與安全須知）。',
  '點選「查看行程」：前往外部頁面查看完整行程或報名。',
  '「群組」是傳統的百岳分類，例如五岳、三尖、十峻；後面的數字是該群組內的序號。',
  '標高數據會因測量年份不同而與其他資料略有出入，實際規劃請以官方最新公告為準。',
];

const PEAK_SAFETY_NOTE =
  '百岳皆為高山行程，出發前請先確認入山入園申請、天氣預報與路況，並依自身體能與經驗選擇適合的路線。';

const PEAK_GROUP_GLOSSARY: Array<[string, string]> = [
  ['五岳', '最具大山氣勢、鎮護一方的五座名山：玉山、雪山、秀姑巒山、南湖大山、北大武山。'],
  ['三尖', '山形尖聳陡峭、呈金字塔狀的三座山：中央尖山、大霸尖山、達芬尖山。'],
  ['一奇', '指奇萊北峰，山勢險峻奇特。'],
  ['十峻', '五岳、三尖、一奇之外，山勢高大而險峻的十座山。'],
  ['八秀', '山容秀麗、坡度和緩的山。'],
  ['十崇', '山體高大、頂部寬闊、氣勢敦厚的山。'],
  ['九峨', '高聳巍峨、在周圍群山中特別突出的山。'],
  ['十潤', '山容柔和、坡度緩，不需攀岩的山。'],
  ['十巖', '山頂多巨石岩峰，需手腳並用才能登頂的山。'],
  ['十翠', '林木與箭竹蒼翠茂密，需穿越箭竹林的山。'],
  ['九平', '山頂寬闊平坦、步行輕鬆的山。'],
  ['九嶂', '山頂平整、橫亙如屏障的山。'],
  ['八銳', '山峰尖銳、多崖壁陡坡的山。'],
  ['八小巒', '山頂矮小、坡度緩，常在縱走途中順登的山。'],
  ['六易', '山勢和緩、緊鄰山徑，容易順道登頂的山。'],
  ['六肩稜', '靠近高峰、形如平肩的稜線山頭。'],
  ['七峭', '山勢峭拔的山。'],
  ['八瘦', '山脊狹長瘦削的山。'],
  ['九偏', '位置偏遠、需專程前往的山。'],
];

interface PeakRow {
  activity: NavButtonActivity;
  no: number | null;
  name: string;
  elevation: number | null;
  group: string;
  groups: string[];
}

function splitGroupTokens(group: string): string[] {
  return group
    .split(/[\s\u3000、,，/／]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parsePeakTitle(activity: NavButtonActivity): PeakRow {
  const raw = (activity.title || '').trim();
  const m = raw.match(/^(\d{1,3})\s*(.+?)\s*(\d{4})\s*(.*)$/);
  if (!m) {
    return { activity, no: null, name: raw, elevation: null, group: '', groups: [] };
  }
  const group = m[4].trim();
  const groups = Array.from(
    new Set(
      splitGroupTokens(group)
        .map((t) => t.replace(/[-－]\d+$/, '').trim())
        .filter(Boolean)
    )
  );
  return {
    activity,
    no: Number(m[1]),
    name: m[2].trim(),
    elevation: Number(m[3]),
    group,
    groups,
  };
}

/* ------------------------------------------------------------------ *
 * 依難度分組（易／中等／難）：標題含下列關鍵字的按鈕才啟用，改這裡即可調整
 * 難度讀取後台行程的「難度等級」欄位，寫「易」「中等」「難」或常見同義字都會歸類
 * ------------------------------------------------------------------ */
const DIFFICULTY_GROUPED_TITLE_KEYWORDS = ['經典路線', '縱走', '連峰', '組合'];
const DIFFICULTY_LEVELS = [
  { level: '易', badge: 'border-emerald-500 bg-emerald-950 text-emerald-300' },
  { level: '中等', badge: 'border-amber-500 bg-amber-950 text-amber-300' },
  { level: '難', badge: 'border-rose-500 bg-rose-950 text-rose-300' },
  { level: '未分級', badge: 'border-neutral-600 bg-neutral-900 text-neutral-300' },
];

function isDifficultyGroupedButton(button: NavButtonItem): boolean {
  return DIFFICULTY_GROUPED_TITLE_KEYWORDS.some((k) => (button.title || '').includes(k));
}

function normalizeDifficulty(raw?: string): string {
  const t = (raw || '').trim();
  if (!t) return '未分級';
  if (/中/.test(t)) return '中等'; // 中等、中級、中高
  if (/難|進階|高/.test(t)) return '難'; // 難、高難度、進階
  if (/易|入門|新手|簡單|初/.test(t)) return '易';
  return '未分級';
}

function groupActivitiesByDifficulty(activities: NavButtonActivity[]) {
  const groups = DIFFICULTY_LEVELS.map((d) => ({ ...d, items: [] as NavButtonActivity[] }));
  for (const a of activities) {
    const lv = normalizeDifficulty(a.itinerary?.difficulty);
    groups.find((g) => g.level === lv)!.items.push(a); // 同組內維持後台排序
  }
  return groups.filter((g) => g.items.length > 0);
}

type SortKey = 'no' | 'elevation';
type SortDir = 'asc' | 'desc';

interface NavActivitiesViewProps {
  button: NavButtonItem;
  activities: NavButtonActivity[];
  entries?: NavButtonEntry[];
  onBack: () => void;
  onSelectActivity?: (slug: string) => void;
  onNavigateEntry?: (url: string) => void;
}

export const NavActivitiesView: React.FC<NavActivitiesViewProps> = ({
  button,
  activities,
  entries,
  onBack,
  onSelectActivity,
  onNavigateEntry,
}) => {
  const isPeakTable =
    activities.length > 0 && isPeakTableButton(button);
  // 只有「百岳總表」才顯示固定導讀；入門百岳、進階百岳只顯示後台上文／下文
  const isPeakOverview = isPeakTable && isPeakOverviewButton(button);

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  const allPeakRows = useMemo<PeakRow[]>(
    () => (isPeakTable ? activities.map(parsePeakTitle) : []),
    [isPeakTable, activities]
  );

  const availableGroups = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    for (const r of allPeakRows) {
      for (const g of r.groups) {
        set.add(g);
      }
    }
    return set;
  }, [allPeakRows]);

  const peakRows = useMemo<PeakRow[]>(() => {
    if (!isPeakTable) return [];
    const rows = groupFilter
      ? allPeakRows.filter((r) => r.groups.includes(groupFilter))
      : allPeakRows;
    if (!sort) return rows; // 維持後台設定的排序
    const factor = sort.dir === 'asc' ? 1 : -1;
    return rows
      .map((r, i) => ({ r, i }))
      .sort((a, b) => {
        const av = sort.key === 'no' ? a.r.no : a.r.elevation;
        const bv = sort.key === 'no' ? b.r.no : b.r.elevation;
        if (av == null && bv == null) return a.i - b.i;
        if (av == null) return 1; // 解析不到的列固定排最後
        if (bv == null) return -1;
        return av === bv ? a.i - b.i : (av - bv) * factor;
      })
      .map((x) => x.r);
  }, [isPeakTable, allPeakRows, groupFilter, sort]);

  // 同一欄位：預設方向 → 反方向 → 取消排序
  const toggleSort = (key: SortKey) => {
    const first: SortDir = key === 'elevation' ? 'desc' : 'asc';
    const second: SortDir = first === 'asc' ? 'desc' : 'asc';
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: first };
      if (prev.dir === first) return { key, dir: second };
      return null;
    });
  };

  const SortIcon: React.FC<{ k: SortKey }> = ({ k }) => {
    if (!sort || sort.key !== k) return <ArrowUpDown size={12} className="text-neutral-500" />;
    return sort.dir === 'asc' ? (
      <ArrowUp size={12} className="text-emerald-400" />
    ) : (
      <ArrowDown size={12} className="text-emerald-400" />
    );
  };

  const ariaSort = (k: SortKey): 'ascending' | 'descending' | 'none' =>
    sort && sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';

  // 後台「導讀內容」（空白行分段）；沒填時，百岳總表退回預設文字
  const customIntro = useMemo(
    () => (button.introContent || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    [button.introContent]
  );
  const introParagraphs = customIntro.length > 0 ? customIntro : isPeakOverview ? PEAK_INTRO_PARAGRAPHS : [];
  const footerParagraphs = useMemo(
    () => (button.footerContent || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    [button.footerContent]
  );

  // 「經典路線」類按鈕：依難度（易／中等／難）分組顯示；難度讀取行程的「難度等級」欄位
  const difficultyGroups = useMemo(
    () => (isDifficultyGroupedButton(button) ? groupActivitiesByDifficulty(activities) : null),
    [button, activities]
  );

  const detailHref = (slug: string) => `/${getCategorySlug(button)}/${slug}/`;

  const renderCard = (activity: NavButtonActivity) => {
      const hasContent = Boolean((activity.content || '').trim());
      return (
        <article
          key={activity.id}
          className="group p-3 sm:p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900 transition-all flex flex-row items-center justify-between gap-3"
        >
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-xl font-bold text-neutral-100">
                {onSelectActivity ? (
                  <a
                    href={`/${getCategorySlug(button)}/${activity.slug}/`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      onSelectActivity(activity.slug);
                    }}
                    className={`inline-flex items-center gap-1 transition-colors text-left ${
                      hasContent
                        ? 'underline decoration-neutral-600 underline-offset-4 hover:decoration-emerald-400 hover:text-emerald-400'
                        : 'hover:text-emerald-400'
                    }`}
                    title="查看活動詳細資訊"
                  >
                    <span>{activity.title}</span>
                    {hasContent && (
                      <ChevronRight
                        size={16}
                        className="text-neutral-500 group-hover:text-emerald-400 transition-colors shrink-0"
                      />
                    )}
                  </a>
                ) : (
                  activity.title
                )}
              </h2>
            </div>

            {activity.description && (
              <p className="text-sm text-neutral-300 leading-relaxed line-clamp-3">
                {activity.description}
              </p>
            )}
          </div>

          {activity.externalUrl && (
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href={normalizeUrl(activity.externalUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
              >
                <span>查看行程</span>
                <ExternalLink size={14} className="text-emerald-200" />
              </a>
            </div>
          )}
        </article>
      );
  };


  return (
    <main
      className={`${isPeakTable ? 'max-w-5xl px-2' : 'max-w-4xl px-4'} mx-auto sm:px-6 py-8`}
      aria-label={`${button.title}活動清單`}
    >
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors py-1.5 px-2.5 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
          id="nav-activities-back-btn"
        >
          <ArrowLeft size={14} />
          <span>返回協會首頁</span>
        </button>
      </div>

      {/* Header section */}
      <header className="border-b border-neutral-800 pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
          <Compass size={18} />
          <span>行程活動專區</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
          {button.title}
        </h1>
        {!isPeakOverview &&
          (customIntro.length > 0 ? (
            <div className="mt-2 space-y-2 text-sm text-neutral-300 leading-relaxed">
              {customIntro.map((p, idx) => (
                <p key={idx} className="whitespace-pre-line">{renderLinkedText(p)}</p>
              ))}
            </div>
          ) : isPeakTable ? null : (
            <p className="text-sm text-neutral-400 mt-2">
              歡迎瀏覽本專區推薦之健行登山行程，點選活動可查看詳細說明或前往外部頁面報名。
            </p>
          ))}
      </header>

      {/* 百岳總表：導讀 */}
      {isPeakOverview && (
        <section
          aria-labelledby="peak-intro-heading"
          className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 sm:p-6"
        >
          <h2
            id="peak-intro-heading"
            className="flex items-center gap-2 text-sm sm:text-base font-bold text-emerald-400 mb-3"
          >
            <BookOpen size={16} />
            <span>導讀：認識台灣百岳</span>
          </h2>

          <div className="space-y-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
            {introParagraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <h3 className="text-sm font-bold text-neutral-200 mt-5 mb-2">如何使用本表</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-neutral-300 leading-relaxed">
            {PEAK_HOW_TO_READ.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>

          <p className="mt-4 text-xs sm:text-sm text-amber-300/90 leading-relaxed border-t border-neutral-800 pt-3">
            {PEAK_SAFETY_NOTE}
          </p>

          <details className="group mt-4 rounded-md border border-neutral-800 bg-neutral-950/40">
            <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-200 hover:text-emerald-400">
              <span>群組名稱說明（五岳、三尖、十峻…）</span>
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
            </summary>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-3 pb-3 pt-1 text-xs sm:text-sm">
              {PEAK_GROUP_GLOSSARY.map(([label, desc]) => {
                const isAvailable = availableGroups.has(label);
                const isSelected = groupFilter === label;
                return (
                  <div key={label} className="flex items-start gap-2">
                    <dt className="shrink-0">
                      {isAvailable ? (
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            setGroupFilter((prev) => (prev === label ? null : label));
                            document.getElementById('peak-list-section')?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          }}
                          className={`shrink-0 min-w-[3.5rem] font-bold border rounded px-2 py-0.5 transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'text-emerald-400 border-neutral-700'
                          }`}
                        >
                          {label}
                        </button>
                      ) : (
                        <span className="inline-block shrink-0 min-w-[3.5rem] font-bold text-emerald-400/50 px-2 py-0.5">
                          {label}
                        </span>
                      )}
                    </dt>
                    <dd className="text-neutral-400 leading-relaxed">{desc}</dd>
                  </div>
                );
              })}
            </dl>
          </details>
        </section>
      )}

      {/* 相關連結專區 (NavButtonEntries) */}
      {entries && entries.length > 0 && (
        <section className="mb-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link2 size={15} />
            <span>相關連結與資訊</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.map((entry) => {
              const rawUrl = (entry.url || '').trim();
              const isExternal = /^https?:\/\//i.test(rawUrl);
              const url = rawUrl || '#';

              if (isExternal) {
                return (
                  <a
                    key={entry.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-emerald-700/60 hover:bg-neutral-900 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                        {entry.title || '相關外部連結'}
                      </div>
                      {entry.description && (
                        <div className="text-xs text-neutral-400 leading-relaxed">
                          {entry.description}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={14} className="text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                  </a>
                );
              }

              return (
                <a
                  key={entry.id}
                  href={url}
                  onClick={(e) => {
                    if (onNavigateEntry && url !== '#') {
                      e.preventDefault();
                      onNavigateEntry(url);
                    }
                  }}
                  className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-emerald-700/60 hover:bg-neutral-900 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                      {entry.title || '站內專區項目'}
                    </div>
                    {entry.description && (
                      <div className="text-xs text-neutral-400 leading-relaxed">
                        {entry.description}
                      </div>
                    )}
                  </div>
                  <Compass size={14} className="text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 百岳總表：維基百科式表格 */}
      {isPeakTable ? (
        <section id="peak-list-section" aria-label="百岳總表">
          <div className="flex items-end justify-between mb-2 px-0.5">
            {isPeakOverview ? (
              <h2 className="text-base sm:text-lg font-bold text-neutral-100">百岳列表</h2>
            ) : (
              <span />
            )}
            <div className="text-right">
              <span className="text-xs text-neutral-500">共 {peakRows.length} 座</span>
              {groupFilter && (
                <div className="text-xs text-neutral-400 mt-0.5">
                  篩選：{groupFilter}　
                  <button
                    type="button"
                    onClick={() => setGroupFilter(null)}
                    className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                  >
                    清除
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full table-auto border-collapse text-sm">
                <caption className="sr-only">{button.title}：山名、標高、所屬國家公園、群組、備註與行程連結</caption>
                <thead className="bg-neutral-800/70 text-neutral-200">
                  <tr>
                    {isPeakOverview && (
                    <th scope="col" aria-sort={ariaSort('no')} className="w-px whitespace-nowrap px-1 sm:px-3 py-2.5 text-center text-xs sm:text-sm font-bold">
                      <button
                        type="button"
                        onClick={() => toggleSort('no')}
                        className="inline-flex justify-center items-center gap-1 hover:text-emerald-400 transition-colors"
                        title="依編號排序"
                      >
                        <span>#</span>
                        <SortIcon k="no" />
                      </button>
                    </th>
                  )}
                    <th scope="col" className="w-full md:w-auto md:whitespace-nowrap pl-1.5 pr-1 sm:px-3 py-2.5 text-left font-bold">
                      山名
                    </th>
                    <th scope="col" aria-sort={ariaSort('elevation')} className="w-px whitespace-nowrap px-1.5 sm:px-3 py-2.5 text-center text-xs sm:text-sm font-bold">
                      <button
                        type="button"
                        onClick={() => toggleSort('elevation')}
                        className="inline-flex justify-center items-center gap-1 hover:text-emerald-400 transition-colors"
                        title="依標高排序"
                      >
                        <span>
                          標高<span className="hidden sm:inline">（公尺）</span>
                        </span>
                        <SortIcon k="elevation" />
                      </button>
                    </th>
                    <th scope="col" className="hidden sm:table-cell w-px whitespace-nowrap px-1.5 sm:px-3 py-2.5 text-center font-bold">
                      所屬國家公園
                    </th>
                    <th scope="col" className="w-px whitespace-nowrap px-1 sm:px-3 py-2.5 text-center text-xs sm:text-sm font-bold">
                      群組
                    </th>
                    <th scope="col" className="hidden md:table-cell w-full px-1.5 sm:px-3 py-2.5 text-left font-bold">
                      備註
                    </th>
                    <th scope="col" className="w-px whitespace-nowrap pl-1.5 pr-2 sm:px-3 py-2.5 text-right font-bold">
                      <span className="sr-only">行程連結</span>
                    </th>
                  </tr>
                </thead>
                {peakRows.map(({ activity, no, name, elevation, group }) => {
                  const hasContent = Boolean((activity.content || '').trim());
                  // 「外部網址」欄填的是本站網址（例如 /baiyue-traverse/3952）時，
                  // 整列視為站內連結：山名與整列都可點，同分頁開啟，不需要頁面內文。
                  const externalIsInternal = Boolean(
                    activity.externalUrl && isInternalUrl(activity.externalUrl)
                  );
                  // 山名連結：優先用「山名連結（detailUrl）」，其次才是填本站網址的外部網址
                  const internalTarget =
                    activity.detailUrl && isInternalUrl(activity.detailUrl)
                      ? normalizeUrl(activity.detailUrl)
                      : externalIsInternal
                      ? normalizeUrl(activity.externalUrl)
                      : '';
                  return (
                    <tbody
                      key={activity.id}
                      className={`border-t border-neutral-800 odd:bg-neutral-900/40 even:bg-neutral-900/10 hover:bg-neutral-800/50 transition-colors${
                        internalTarget ? ' cursor-pointer' : ''
                      }`}
                      onClick={
                        internalTarget
                          ? (e) => {
                              // 點到連結、按鈕時交給它們自己處理；選取文字時不跳轉
                              if ((e.target as HTMLElement).closest('a,button')) return;
                              if (window.getSelection()?.toString()) return;
                              window.location.assign(internalTarget);
                            }
                          : undefined
                      }
                    >
                      <tr className="align-top">
                        {isPeakOverview && (
                          <td className="w-px whitespace-nowrap px-1 sm:px-3 py-2.5 text-center text-xs sm:text-sm text-neutral-500 tabular-nums">
                          {no != null ? String(no).padStart(3, '0') : '—'}
                        </td>
                        )}

                        <td className="w-full md:w-auto md:whitespace-nowrap pl-1.5 pr-1 sm:px-3 py-2.5 text-left font-bold text-neutral-100">
                          {internalTarget ? (
                            <a
                              href={internalTarget}
                              className="inline-flex items-center gap-1 transition-colors underline decoration-neutral-600 underline-offset-4 hover:decoration-emerald-400 hover:text-emerald-400"
                              title={`查看${name}`}
                            >
                              <span>{name}</span>
                              <ChevronRight size={14} className="text-neutral-500 shrink-0" />
                            </a>
                          ) : onSelectActivity && hasContent ? (
                            <a
                              href={detailHref(activity.slug)}
                              onClick={(e) => {
                                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                                e.preventDefault();
                                onSelectActivity(activity.slug);
                              }}
                              className="inline-flex items-center gap-1 transition-colors underline decoration-neutral-600 underline-offset-4 hover:decoration-emerald-400 hover:text-emerald-400"
                              title="查看詳細資訊"
                            >
                              <span>{name}</span>
                              <ChevronRight size={14} className="text-neutral-500 shrink-0" />
                            </a>
                          ) : (
                            name
                          )}
                        </td>

                        <td className="w-px whitespace-nowrap px-1.5 sm:px-3 py-2.5 text-center text-xs sm:text-sm text-neutral-200 tabular-nums">
                          {elevation != null ? elevation.toLocaleString('en-US') : ''}
                        </td>

                        <td className="hidden sm:table-cell w-px whitespace-nowrap px-1.5 sm:px-3 py-2.5 text-center text-neutral-300">
                          {activity.nationalPark || ''}
                        </td>

                        <td className="w-px whitespace-nowrap px-1 sm:px-3 py-2.5 text-center text-xs sm:text-sm text-neutral-300">
                          {(() => {
                            const parts = splitGroupTokens(group);
                            return parts.length > 1
                              ? parts.map((p, i) => <div key={i}>{p}</div>)
                              : group;
                          })()}
                        </td>

                        <td className="hidden md:table-cell w-full px-1.5 sm:px-3 py-2.5 text-left text-xs text-neutral-400 leading-relaxed whitespace-normal break-words">
                          <span className="whitespace-normal break-words">
                            {activity.description}
                          </span>
                        </td>

                        <td className="w-px whitespace-nowrap pl-1.5 pr-2 sm:px-3 py-2.5 text-right">
                          {activity.externalUrl && (
                            <a
                              href={normalizeUrl(activity.externalUrl)}
                              {...(externalIsInternal
                                ? {}
                                : { target: '_blank', rel: 'noopener noreferrer' })}
                              className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                              aria-label={
                                externalIsInternal ? `查看${name}行程` : `查看${name}行程（開新視窗）`
                              }
                            >
                              <span>查看行程</span>
                              {!externalIsInternal && (
                                <ExternalLink size={13} className="hidden sm:inline text-emerald-200" />
                              )}
                            </a>
                          )}
                        </td>
                      </tr>
                      {activity.description && (
                        <tr className="md:hidden">
                          <td colSpan={5} className="px-2 pb-2.5 pt-0 text-xs leading-relaxed text-neutral-400">
                            {activity.description}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </table>
            </div>
        </section>
      ) : (
        <>
      {activities.length > 0 ? (
        difficultyGroups ? (
          <div className="space-y-8 sm:space-y-10">
            {difficultyGroups.map((g) => (
              <section key={g.level} aria-label={`難度：${g.level}`}>
                <h2 className={`inline-flex items-center mb-3 px-3.5 py-1 rounded-full border text-base sm:text-lg font-extrabold ${g.badge}`}>
                  {g.level}
                </h2>
                <div className="space-y-2.5 sm:space-y-3">{g.items.map(renderCard)}</div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">{activities.map(renderCard)}</div>
        )
      ) : (
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-lg bg-neutral-900/30">
          <p className="text-neutral-400 text-sm mb-4">目前此專區尚無發布中的活動行程。</p>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
          >
            返回首頁查看活動行事曆
          </button>
        </div>
      )}
        </>
      )}

      {/* 後台「下方說明」：顯示在列表內容下方；空白行分段，留空不顯示 */}
      {footerParagraphs.length > 0 && (
        <section
          aria-label={`${button.title}說明`}
          className="mt-10 border-t border-neutral-800 pt-6 space-y-3 text-sm text-neutral-300 leading-relaxed"
        >
          {footerParagraphs.map((p, idx) => (
            <p key={idx} className="whitespace-pre-line">{renderLinkedText(p)}</p>
          ))}
        </section>
      )}
    </main>
  );
};
