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
    `${activity.title} | ${parentButton ? parentButton.title + ' - ' : ''}亞馬遜國家山岳協會 | Amazon Alpine Association`;

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

/**
 * Resolves SEO meta description for a navButton list page (/nav/:id).
 * If introContent is present, takes the first 120 characters with newlines removed;
 * otherwise falls back to the default template.
 */
export function resolveNavButtonDescription(btn: { title: string; introContent?: string }): string {
  const cleanIntro = (btn.introContent || '').replace(/[\r\n]+/g, ' ').trim();
  if (cleanIntro) {
    return cleanIntro.slice(0, 120);
  }
  return `亞馬遜國家山岳協會 ${btn.title} 活動與行程清單。`;
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
      externalUrl: '',
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

