import type { NavButtonItem, NavButtonActivity } from '../types.js';

/**
 * Converts a text string into a URL-friendly slug.
 * Trims, lowercases, replaces non-alphanumeric chars with hyphens,
 * collapses consecutive hyphens, and trims leading/trailing hyphens.
 * If only Chinese characters are provided without English/digits, returns empty string.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove characters that are not word/spaces/hyphens
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores to a single dash
    .replace(/^-+|-+$/g, ''); // trim leading and trailing dashes
}

export const CHAPTER_SLUG_SOURCE = 'chapter(?:0[1-9]|[1-9][0-9]+)';
export const CHAPTER_SLUG_RE = new RegExp(`^${CHAPTER_SLUG_SOURCE}$`);
export function isFormalChapterSlug(slug: string | undefined | null): boolean {
  return CHAPTER_SLUG_RE.test(String(slug || '').trim().toLowerCase());
}

/**
 * Top-level system reserved slugs that cannot be used as categorySlug (first path segment)
 */
export const RESERVED_SLUGS = new Set([
  'intro',
  'tools',
  'highlights',
  'policies',
  'surveys',
  'admin',
  'nav',
  'route',
  'api',
  'sitemap.xml',
  'robots.txt',
  ...Array.from({ length: 15 }, (_, i) => `chapter${String(i + 1).padStart(2, '0')}`),
]);

/**
 * Computes the canonical category slug for a navigation button.
 * Priority:
 * 1. Explicitly entered categorySlug
 * 2. Automatic slugify(title)
 * 3. Fallback: button id (ensuring valid URL even with Chinese title and empty categorySlug)
 */
export function getCategorySlug(navButton: { id: string; title: string; categorySlug?: string }): string {
  const custom = (navButton.categorySlug || '').trim().toLowerCase();
  if (custom) return custom;
  const auto = slugify(navButton.title);
  if (auto) return auto;
  return navButton.id.toLowerCase();
}

/**
 * Resolves SEO title, meta description, and social share image for an activity.
 */
export function resolveActivitySeo(
  activity: NavButtonActivity,
  parentButton?: NavButtonItem
): { title: string; description: string; image: string } {
  const title =
    (activity.seoTitle || '').trim() ||
    `${activity.title} | ${parentButton ? parentButton.title + ' | ' : ''}亞馬遜國家山岳協會`;

  const description =
    (activity.metaDescription || '').trim() ||
    (activity.description || '').slice(0, 160) ||
    `${activity.title} - 亞馬遜國家山岳協會登山健行行程詳細說明與線上報名資訊。`;

  const image =
    (activity.ogImage || '').trim() ||
    (activity.coverImage || '').trim() ||
    '';

  return { title, description, image };
}

/** 標題含此關鍵字的按鈕使用「百岳總表」表格版面，沒填導讀時退回預設導讀 */
export const PEAK_TABLE_TITLE_KEYWORDS = ['百岳總表', '入門百岳', '進階百岳', '新手百岳'];

/** 百岳總表預設導讀（後台沒填「列表頁導讀內容」時使用；前台本文與 SSR 外殼共用） */
export const PEAK_INTRO_PARAGRAPHS = [
  '台灣百岳是臺灣登山界在 1970 年代初期選出的一百座高山，標高大致在三千公尺以上，分布於中央山脈、雪山山脈與玉山山脈，其中中央山脈就占了 69 座。許多山友把它當成長期累積的登山目標。',
  '本頁整理百岳各峰的基本資料與本會的行程資訊，可作為規劃路線的起點。',
];

export function isPeakTableButton(btn: { title: string }): boolean {
  return PEAK_TABLE_TITLE_KEYWORDS.some((k) => (btn.title || '').includes(k));
}

/** 只有「百岳總表」本身才使用固定導讀；入門百岳、進階百岳只顯示後台填的上文／下文 */
export function isPeakOverviewButton(btn: { title: string }): boolean {
  return (btn.title || '').includes('百岳總表');
}

/**
 * 依站內路徑找出對應的「前台導覽按鈕」，其上方說明（introContent）與下方說明（bottomContent）
 * 就是該頁面（/intro、/tools、/highlights、/policies、/surveys）的可編輯文字。
 */
const FIXED_PAGE_BUTTON_IDS: Record<string, string> = {
  '/': 'btn_calendar',
  '/intro': 'btn_intro',
  '/tools': 'btn_tools',
  '/highlights': 'btn_highlights',
  '/policies': 'btn_policies',
  '/surveys': 'btn_surveys',
};
export function findPageNavButton<T extends { id: string; url?: string }>(
  buttons: T[] | undefined,
  path: string
): T | undefined {
  const list = buttons || [];
  return (
    list.find((b) => ((b.url || '').replace(/\/+$/, '') || '/') === path) ||
    list.find((b) => b.id === FIXED_PAGE_BUTTON_IDS[path])
  );
}

/** 列表頁導讀段落：後台導讀內容優先（空白行分段），百岳總表沒填時用預設導讀 */
export function resolveNavButtonIntroParagraphs(btn: { title: string; introContent?: string }): string[] {
  const custom = (btn.introContent || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (custom.length > 0) return custom;
  return isPeakOverviewButton(btn) ? PEAK_INTRO_PARAGRAPHS : [];
}

/**
 * 從導讀文字產生 meta description：在句號邊界收尾，不在句子中間截斷。
 * 以完整句子累加到 maxLen 為止；第一句就超長時，才硬截斷並補「…」。
 */
export function summarizeForMeta(text: string, maxLen = 120): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  const sentences = clean.match(/[^。！？!?]+[。！？!?]?/g) || [clean];
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > maxLen) break;
    out += s;
  }
  if (out) return out.trim();
  return clean.slice(0, maxLen - 1).trim() + '…';
}

/**
 * Resolves SEO title + meta description for a navButton list page (/nav/:id).
 * 優先序：後台「SEO 標題／SEO 描述」→ 導讀內容 → 預設樣板。
 * 預設標題不再帶「活動列表」：「{按鈕標題} | 亞馬遜國家山岳協會」。
 */
export function resolveNavButtonSeo(btn: {
  title: string;
  introContent?: string;
  seoTitle?: string;
  metaDescription?: string;
}): { title: string; description: string } {
  const title = (btn.seoTitle || '').trim() || `${btn.title} | 亞馬遜國家山岳協會`;
  const custom = (btn.metaDescription || '').replace(/\s+/g, ' ').trim();
  // 導讀裡單獨一行的小標題（例如「台灣百岳的由來與發展」）不放進 description，只取有句號的正文段落
  const paras = resolveNavButtonIntroParagraphs(btn);
  const bodyParas = paras.filter((p) => /[。！？!?]$/.test(p) || p.length >= 40);
  const intro = summarizeForMeta((bodyParas.length ? bodyParas : paras).join(' '), 120);
  const description =
    custom || intro || `亞馬遜國家山岳協會 ${btn.title} 活動與行程清單。`;
  return { title, description };
}

/** 舊介面保留：只取 description */
export function resolveNavButtonDescription(btn: {
  title: string;
  introContent?: string;
  metaDescription?: string;
}): string {
  return resolveNavButtonSeo(btn).description;
}

/**
 * 百岳列表連結文字：「001玉山3952五岳-1」→「玉山（3952公尺）」。
 * 解析不出來就回傳原標題。
 */
export function formatPeakLinkText(title: string): string {
  const raw = (title || '').trim();
  const m = raw.match(/^(\d{1,3})\s*(.+?)\s*(\d{4})\s*(.*)$/);
  if (!m) return raw;
  return `${m[2].trim()}（${Number(m[3]).toLocaleString('en-US').replace(/,/g, '')}公尺）`;
}

export interface PeakImportItem {
  no?: number;
  name?: string;
  elevation?: number;
  nationalPark?: string;
  group?: string;
  note?: string;
  description?: string;
  title?: string;
  slug?: string;
  sortOrder?: number;
  content?: string;
  seoTitle?: string;
  metaDescription?: string;
  seoDescription?: string; // metaDescription 的別名
  ogImage?: string;
  coverImage?: string;
  requiredGear?: string; // 行前必備裝備(多行,空行分段)
  safetyNotes?: string; // 安全須知(多行,空行分段)
  subtitle?: string; // 副標題
  itinerary?: { subtitle?: string; requiredGear?: string; safetyNotes?: string }; // 也可寫在 itinerary 內
  overwrite?: boolean; // true 時,用匯入的非空值取代既有內容
}

/**
 * Extracts leading 1-3 digit peak number and mountain name from an activity title.
 */
export function extractPeakNoAndName(title: string): { no: number | null; name: string } {
  const raw = (title || '').trim();
  const fullMatch = raw.match(/^(\d{1,3})\s*(.+?)\s*(\d{4})\s*(.*)$/);
  if (fullMatch) {
    return { no: Number(fullMatch[1]), name: fullMatch[2].trim() };
  }
  const noMatch = raw.match(/^(\d{1,3})(?!\d)\s*[-.、:：]?\s*(.*)$/);
  if (noMatch) {
    return { no: Number(noMatch[1]), name: noMatch[2].trim() };
  }
  return { no: null, name: raw };
}

export interface BatchImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Processes batch import of peak/activity items under a specific navButtonId.
 * When mutate = true, mutates the provided activitiesArray in place.
 * When mutate = false, performs a dry-run preview without modifying activitiesArray.
 */
export function processBatchImportActivities(
  activitiesArray: NavButtonActivity[],
  navButtonId: string,
  rawItems: any[],
  mutate: boolean
): BatchImportResult {
  const cleanBtnId = (navButtonId || '').trim();
  const workingButtonActs: NavButtonActivity[] = activitiesArray
    .filter((a) => a.navButtonId === cleanBtnId)
    .map((a) => (mutate ? a : { ...a }));

  const usedSlugs = new Set<string>(
    workingButtonActs.map((a) => (a.slug || '').trim().toLowerCase()).filter(Boolean)
  );

  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  rawItems.forEach((rawItem, idx) => {
    if (!rawItem || typeof rawItem !== 'object') {
      errors.push(`第 ${idx + 1} 筆：資料格式無效`);
      return;
    }

    const itemTitle =
      String(rawItem.title || '').trim() ||
      (rawItem.no != null && rawItem.name
        ? `${String(rawItem.no).padStart(3, '0')} ${String(rawItem.name).trim()}${
            rawItem.elevation ? ' ' + rawItem.elevation : ''
          }${rawItem.group ? ' ' + String(rawItem.group).trim() : ''}`
        : String(rawItem.name || '').trim());

    if (!itemTitle) {
      errors.push(`第 ${idx + 1} 筆：缺少活動標題 (title)`);
      return;
    }

    const parsedFromTitle = extractPeakNoAndName(itemTitle);
    const itemNo =
      rawItem.no != null && rawItem.no !== '' && !Number.isNaN(Number(rawItem.no))
        ? Number(rawItem.no)
        : parsedFromTitle.no;
    const itemName = String(rawItem.name || '').trim() || parsedFromTitle.name;
    const incomingPark = String(rawItem.nationalPark || '').trim();
    const incomingContent = String(rawItem.content || '').trim();
    const incomingSeoTitle = String(rawItem.seoTitle || '').trim();
    const incomingMetaDescription = String(rawItem.metaDescription ?? rawItem.seoDescription ?? '').trim();
    const incomingSubtitle = String(rawItem.subtitle ?? rawItem.itinerary?.subtitle ?? '').trim();
    const incomingGear = String(rawItem.requiredGear ?? rawItem.itinerary?.requiredGear ?? '')
      .replace(/\r\n?/g, '\n')
      .trim();
    const incomingSafety = String(rawItem.safetyNotes ?? rawItem.itinerary?.safetyNotes ?? '')
      .replace(/\r\n?/g, '\n')
      .trim();
    const overwrite = rawItem.overwrite === true;
    const incomingOgImage = String(rawItem.ogImage || '').trim();
    const incomingCoverImage = String(rawItem.coverImage || '').trim();
    const incomingExternalUrl = String(rawItem.externalUrl || '').trim();
    const incomingDetailUrl = String(rawItem.detailUrl || '').trim();

    const matched = workingButtonActs.find((act) => {
      const parsedAct = extractPeakNoAndName(act.title);
      if (itemNo != null && parsedAct.no != null && itemNo === parsedAct.no) {
        return true;
      }
      if (itemName && parsedAct.name && itemName === parsedAct.name) {
        return true;
      }
      if ((act.title || '').trim() === itemTitle) {
        return true;
      }
      return false;
    });

    if (matched) {
      // 預設只補目前為空的欄位;item.overwrite === true 時,非空的匯入值會取代既有值。
      // 匯入值為空時,永遠不清除既有資料。
      let changed = false;
      if (!(matched.nationalPark || '').trim() && incomingPark) {
        matched.nationalPark = incomingPark;
        changed = true;
      }
      if (incomingContent && (overwrite || !(matched.content || '').trim()) && matched.content !== incomingContent) {
        matched.content = incomingContent;
        changed = true;
      }
      if (incomingDetailUrl && (overwrite || !(matched.detailUrl || '').trim()) && matched.detailUrl !== incomingDetailUrl) {
        matched.detailUrl = incomingDetailUrl;
        changed = true;
      }
      if (incomingExternalUrl && (overwrite || !(matched.externalUrl || '').trim()) && matched.externalUrl !== incomingExternalUrl) {
        matched.externalUrl = incomingExternalUrl;
        changed = true;
      }
      if (incomingSeoTitle && (overwrite || !(matched.seoTitle || '').trim()) && matched.seoTitle !== incomingSeoTitle) {
        matched.seoTitle = incomingSeoTitle;
        changed = true;
      }
      if (incomingMetaDescription && (overwrite || !(matched.metaDescription || '').trim()) && matched.metaDescription !== incomingMetaDescription) {
        matched.metaDescription = incomingMetaDescription;
        changed = true;
      }
      if (incomingOgImage && (overwrite || !(matched.ogImage || '').trim()) && matched.ogImage !== incomingOgImage) {
        matched.ogImage = incomingOgImage;
        changed = true;
      }
      if (incomingCoverImage && (overwrite || !(matched.coverImage || '').trim()) && matched.coverImage !== incomingCoverImage) {
        matched.coverImage = incomingCoverImage;
        changed = true;
      }
      if (incomingSubtitle || incomingGear || incomingSafety) {
        // 複製一份再修改,避免預覽(mutate=false)時改到原本資料的 itinerary 物件
        const it: any = matched.itinerary ? { ...matched.itinerary } : { enabled: true, days: [] };
        let itChanged = false;
        if (incomingSubtitle && (overwrite || !(it.subtitle || '').trim()) && it.subtitle !== incomingSubtitle) {
          it.subtitle = incomingSubtitle;
          itChanged = true;
        }
        if (incomingGear && (overwrite || !(it.requiredGear || '').trim()) && it.requiredGear !== incomingGear) {
          it.requiredGear = incomingGear;
          itChanged = true;
        }
        if (incomingSafety && (overwrite || !(it.safetyNotes || '').trim()) && it.safetyNotes !== incomingSafety) {
          it.safetyNotes = incomingSafety;
          itChanged = true;
        }
        if (itChanged) {
          matched.itinerary = it;
          changed = true;
        }
      }
      if (changed) {
        matched.updatedAt = todayStr;
        updated++;
      } else {
        skipped++;
      }
      return;
    }

    const rawSlug = String(rawItem.slug || '')
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '');
    const baseSlug =
      rawSlug.replace(/[^a-z0-9-_]/g, '') ||
      slugify(itemTitle) ||
      (itemNo != null ? `peak-${String(itemNo).padStart(3, '0')}` : `activity_${now}_${idx}`);

    let finalSlug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(finalSlug.toLowerCase())) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(finalSlug.toLowerCase());

    const newAct: NavButtonActivity = {
      id: `act_${now}_${idx}`,
      navButtonId: cleanBtnId,
      slug: finalSlug,
      title: itemTitle,
      description: String(rawItem.note ?? rawItem.description ?? '').trim(),
      nationalPark: incomingPark || undefined,
      content: incomingContent || undefined,
      seoTitle: incomingSeoTitle || undefined,
      metaDescription: incomingMetaDescription || undefined,
      ogImage: incomingOgImage || undefined,
      coverImage: incomingCoverImage || undefined,
      itinerary:
        incomingSubtitle || incomingGear || incomingSafety
          ? {
              enabled: true,
              subtitle: incomingSubtitle || undefined,
              requiredGear: incomingGear || undefined,
              safetyNotes: incomingSafety || undefined,
              days: [],
            }
          : undefined,
      sortOrder: Number(rawItem.sortOrder ?? rawItem.no ?? idx + 1) || 0,
      externalUrl: incomingExternalUrl,
      detailUrl: incomingDetailUrl || undefined,
      enabled: true,
      updatedAt: todayStr,
    };

    workingButtonActs.push(newAct);
    if (mutate) {
      activitiesArray.push(newAct);
    }
    created++;
  });

  return { created, updated, skipped, errors };
}



/**
 * 全站預設分享圖（1200x630，放在 public/og-default.png）。
 * 頁面沒有自己的封面圖時，og:image / twitter:image 使用這張。
 */
export const DEFAULT_OG_IMAGE = 'https://amazon-hike.com/og-default.png';

/**
 * 預設章節資料（server/default-chapters.ts）每章共用的樣板句。
 * 內文含這句代表該章還沒寫真正的內容。
 */
const SEED_CHAPTER_MARKER = '進入高山環境前，完善的知識累積與充足的事前準備是保障登山安全的第一步';

/**
 * 目前仍由「主站 Worker」自己渲染的章節。
 * chapter05 以後已遷移成獨立專案、由 Cloudflare Route 導到別的 Worker，
 * 主站資料庫裡那幾章只是占位資料，不能拿來判斷薄內容。
 * 之後 chapter01~04 遷移完成，就從這個清單移除。
 */
export const MAIN_WORKER_CHAPTER_SLUGS = new Set(['chapter01', 'chapter02', 'chapter03', 'chapter04']);

/**
 * 主站自己渲染、而且內容仍是空白或預設樣板的章節 → 視為薄內容頁：
 * 頁面加 noindex, follow，並且不放進 sitemap。
 * 非 chapterNN 格式的 slug（/intro/xxx）一律視為由主站渲染。
 */
export function isThinMainChapter(chapter: { slug?: string; content?: string }): boolean {
  const slug = String(chapter.slug || '').trim().toLowerCase();
  const servedByMain = !CHAPTER_SLUG_RE.test(slug) || MAIN_WORKER_CHAPTER_SLUGS.has(slug);
  if (!servedByMain) return false;
  const body = (chapter.content || '').trim();
  return !body || body.includes(SEED_CHAPTER_MARKER);
}


/** 手機版「標題下方按鈕列」最多預設顯示幾個按鈕（後台沒特別設定時） */
export const MOBILE_BAR_DEFAULT_COUNT = 5;

/**
 * 這個按鈕在手機版是否直接顯示在按鈕列。
 * 後台有勾選／取消就照後台；沒設定時，依排序取前 5 個啟用的按鈕。
 */
export function isOnMobileBar(
  btn: { id: string; enabled: boolean; sortOrder: number; mobileBar?: boolean },
  all: { id: string; enabled: boolean; sortOrder: number }[]
): boolean {
  if (typeof btn.mobileBar === 'boolean') return btn.mobileBar;
  const rank = all
    .filter((b) => b.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .findIndex((b) => b.id === btn.id);
  return rank >= 0 && rank < MOBILE_BAR_DEFAULT_COUNT;
}
