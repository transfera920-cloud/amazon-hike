import { loadDatabaseWorker } from './db-kv.js';
import { handleApiRequest } from './api-handler.js';
import type { WorkerEnv } from './db-kv.js';
import {
  getCategorySlug,
  getNavButtonPath,
  isPossibleNavListSlug,
  resolveActivitySeo,
  resolveNavButtonSeo,
  resolveNavButtonIntroParagraphs,
  isPeakTableButton,
  isPeakOverviewButton,
  formatPeakLinkText,
  CHAPTER_SLUG_RE,
  CHAPTER_SLUG_SOURCE,
  DEFAULT_OG_IMAGE,
  isThinMainChapter,
  MAIN_WORKER_CHAPTER_SLUGS,
  extractPeakNoAndName,
} from '../src/utils/activitySeo.js';
import type { NavButtonActivity } from '../src/types.js';
import { getYouTubeVideoId, normalizeToolUrl, normalizeUrl, isInternalUrl } from '../src/utils/url.js';
import { findTransferLink } from '../src/utils/transferLinks.js';

declare const HTMLRewriter: any;

export interface RouteMetadata {
  title: string;
  description: string;
  image?: string;
}

/**
 * 建立「內部抓取 index.html」用的請求。
 * 移除 If-None-Match / If-Modified-Since：否則靜態資源會回 304，
 * Worker 就沒有機會注入最新的後台內容，瀏覽器與爬蟲會一直拿到舊頁面。
 */
function buildIndexRequest(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.delete('If-None-Match');
  headers.delete('If-Modified-Since');
  return new Request(new URL('/', request.url), { method: 'GET', headers });
}

const INTRO_REDIRECT_RE = new RegExp(`^/intro/(${CHAPTER_SLUG_SOURCE})$`);
const CHAPTER_REDIRECT_RE = new RegExp(`^/(${CHAPTER_SLUG_SOURCE})$`);
const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * 網站主要導覽連結清單
 */
const SITE_NAV_LINKS = [
  { href: '/', text: '活動行事曆' },
  { href: '/intro', text: '登山入門教學' },
  { href: '/tools', text: '登山工具' },
  { href: '/highlights', text: '活動花絮' },
  { href: '/surveys', text: '問卷調查' },
  { href: '/policies', text: '政策與條款' },
];

/**
 * 產生網站主要導覽 HTML 字串
 */
function buildSiteNavHtml(): string {
  const items = SITE_NAV_LINKS.map(
    (item) => `<li><a href="${item.href}">${item.text}</a></li>`
  ).join('');
  const partners =
    '<nav aria-label="合作服務"><ul>' +
    '<li><a href="https://transfer.amazon-hike.com/">亞馬遜高山接駁（登山口包車）</a></li>' +
    '<li><a href="https://price.amazon-hike.com/">接駁費用試算</a></li>' +
    '</ul></nav>';
  return `<nav aria-label="主要導覽"><ul>${items}</ul></nav>${partners}`;
}

/**
 * 產生非 /intro 獨立專區頁面的靜態外殼 HTML
 * 規定：<h1> 必須只取 Title 用「 | 」切開後的第一段，不可放完整 Title。
 */
function buildSectionShellHtml(title: string, description: string, topHtml = '', bottomHtml = ''): string {
  const shortTitle = title.split(' | ')[0].trim();
  return `<main><h1>${escapeHtml(shortTitle)}</h1><p>${escapeHtml(
    description
  )}</p>${topHtml}${bottomHtml}${buildSiteNavHtml()}</main>`;
}

/**
 * 產生首頁的靜態外殼 HTML。
 * <h1> 固定為協會名稱（與前端 Header 一致），接著是協會簡介，再依序放入
 * 導讀與近期活動（topHtml）、內容區塊與常見問題（bottomHtml）。
 */
function buildHomeShellHtml(topHtml = '', bottomHtml = ''): string {
  return (
    '<main><h1>亞馬遜國家山岳協會</h1>' +
    '<p>Amazon Alpine Association，社團法人・立案編號 台內團自第1130008137號。' +
    '協會宗旨：提倡全民運動、鍛鍊強健體魄、培養互助團隊精神，以及接觸大自然與山林相關知識及技能。</p>' +
    `${topHtml}${bottomHtml}${buildSiteNavHtml()}</main>`
  );
}

/**
 * 將多行文字依連續空行切成段落 <p>，段落內以 <br> 換行，並對文字進行 HTML 跳脫
 */
function formatMultilineHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((p) => {
      const lines = p.split('\n').map((line) => escapeHtml(line));
      return `<p>${lines.join('<br>')}</p>`;
    })
    .join('');
}

/**
 * 後台「前台導覽按鈕」的上文（introContent）與下文（footerContent），轉成初始 HTML 段落，
 * 讓搜尋引擎不必執行 JavaScript 就能讀到。找不到或沒填就回傳空字串。
 */
/** 與前台相同規則：[文字](網址) 轉成 <a>，允許站內路徑與 http/https 網址 */
function formatLinkedMultilineHtml(text: string, levelOffset = 0): string {
  const isSafe = (h: string) =>
    /^\/(?!\/)/.test(h) ||
    /^https?:\/\/[^\s]+$/i.test(h) ||
    /^tel:\+?[0-9]{6,15}$/.test(h) ||
    /^mailto:[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/i.test(h);
  const linkRe = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  const renderLine = (line: string): string => {
    let out = '';
    let last = 0;
    let m: RegExpExecArray | null;
    linkRe.lastIndex = 0;
    while ((m = linkRe.exec(line)) !== null) {
      out += escapeHtml(line.slice(last, m.index));
      if (m[1] === '!') {
        // 圖片：![說明](網址) → <img>，只允許站內路徑與 http/https
        if (/^\/(?!\/)/.test(m[3]) || /^https?:\/\/[^\s]+$/i.test(m[3])) {
          const cap = (m[4] || '').trim();
          const dm = m[3].match(/#(\d{1,5})x(\d{1,5})$/);
          const dimAttr = dm ? ` width="${dm[1]}" height="${dm[2]}"` : '';
          const imgTag = `<img src="${escapeHtml(m[3].replace(/#\d{1,5}x\d{1,5}$/, ''))}" alt="${escapeHtml(m[2])}"${dimAttr} loading="lazy">`;
          out += cap ? `<figure>${imgTag}<figcaption>${escapeHtml(cap)}</figcaption></figure>` : `<figure>${imgTag}</figure>`;
        }
      } else if (m[2]) {
        out += isSafe(m[3]) ? `<a href="${escapeHtml(m[3])}">${escapeHtml(m[2])}</a>` : escapeHtml(m[2]);
      }
      last = m.index + m[0].length;
    }
    return out + escapeHtml(line.slice(last));
  };
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // 標題語法：## → H2、### → H3（外層已有 H2 的區塊用 levelOffset = 1）
      const lines = p.split('\n');
      const hm = lines[0].match(/^(#{2,3})[ \t]+(.+?)\s*$/);
      let head = '';
      let rest = p;
      if (hm) {
        const lv = Math.min(6, hm[1].length + levelOffset);
        head = `<h${lv}>${renderLine(hm[2])}</h${lv}>`;
        rest = lines.slice(1).join('\n').trim();
        if (!rest) return head;
      }
      const html = rest.split('\n').map(renderLine).join('<br>');
      // 只含圖片的段落不包 <p>（<figure> 不能放在 <p> 裡）
      return head + (/^(<figure>.*?<\/figure>)+$/s.test(html) ? html : `<p>${html}</p>`);
    })
    .join('');
}

/** 依 /nav/:id 的 id（或後台存的 url）找出按鈕；與前台 App.tsx 的比對規則一致 */
function findNavButtonByNavId<T extends { id: string; url?: string }>(
  buttons: T[] | undefined,
  buttonId: string,
  normalizedPath: string
): T | undefined {
  return (buttons || []).find((b) => {
    if (b.id === buttonId) return true;
    if (b.url === normalizedPath) return true;
    if (b.url === `/nav/${buttonId}`) return true;
    const strippedUrl = (b.url || '').replace(/^\/nav\//, '').replace(/\/+$/, '');
    return Boolean(strippedUrl && strippedUrl === buttonId);
  });
}

/**
 * 各按鈕專屬的「內容區塊」（後台「前台導覽按鈕」→「區塊管理」）→ 初始 HTML。
 * 每個區塊一個 <section><h2>…</h2><p>…</p></section>，順序與前台相同（sortOrder），
 * 只輸出啟用且標題、內容都有填的區塊。
 */
function buildNavButtonBlocksHtml(
  db: { navButtonBlocks?: { navButtonId: string; title: string; content: string; enabled: boolean; sortOrder: number }[] },
  navButtonId: string | undefined
): string {
  if (!navButtonId) return '';
  return (db.navButtonBlocks || [])
    .filter((b) => b.navButtonId === navButtonId && b.enabled && (b.title || '').trim() && (b.content || '').trim())
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((b) => `<section><h2>${escapeHtml(b.title.trim())}</h2>${formatLinkedMultilineHtml(b.content.trim(), 1)}</section>`)
    .join('');
}

const PAGE_TEXT_BUTTON_IDS: Record<string, string> = {
  '/': 'btn_calendar',
  '/intro': 'btn_intro',
  '/tools': 'btn_tools',
  '/policies': 'btn_policies',
  '/surveys': 'btn_survey',
  '/highlights': 'btn_highlights',
};
async function loadPageTextHtml(env: WorkerEnv, path: string): Promise<{ top: string; bottom: string }> {
  try {
    const db = await loadDatabaseWorker(env);
    const btn = (db.navButtons || []).find(
      (b) => ((b.url || '').replace(/\/+$/, '') || '/') === path || b.id === PAGE_TEXT_BUTTON_IDS[path]
    );
    // 首頁（/）的區塊由「首頁區塊管理」另外注入，這裡不重複輸出
    const blocksHtml = path === '/' ? '' : buildNavButtonBlocksHtml(db, btn?.id);
    return {
      top: formatLinkedMultilineHtml((btn?.introContent || '').trim()),
      bottom: formatLinkedMultilineHtml((btn?.footerContent || '').trim()) + blocksHtml,
    };
  } catch (err) {
    console.error('Error loading page text:', err);
    return { top: '', bottom: '' };
  }
}

/**
 * 產生活動詳細頁（/:categorySlug/:activitySlug/ 與舊版 /route/:slug）的靜態外殼 HTML
 */
function buildActivityShellHtml(act: NavButtonActivity): string {
  let contentHtml = '';
  if ((act.content || '').trim()) {
    contentHtml = formatLinkedMultilineHtml(act.content!);
  }

  let itineraryExtraHtml = '';
  if (act.itinerary?.enabled) {
    if ((act.itinerary.requiredGear || '').trim()) {
      itineraryExtraHtml += `<h2>行前必備裝備</h2>${formatMultilineHtml(act.itinerary.requiredGear!)}`;
    }
    if ((act.itinerary.safetyNotes || '').trim()) {
      itineraryExtraHtml += `<h2>安全須知與風險提示</h2>${formatMultilineHtml(act.itinerary.safetyNotes!)}`;
    }
  }

  const descHtml = (act.description || '').trim() ? `<p>${escapeHtml(act.description!)}</p>` : '';
  const externalLinkHtml = act.externalUrl
    ? `<p><a href="${escapeHtml(act.externalUrl)}" target="_blank" rel="noopener noreferrer">查看行程</a></p>`
    : '';

  const transferLink = findTransferLink(act.title);
  const transferHtml = transferLink
    ? `<p>這條路線的登山口交通，可參考<a href="${transferLink.url}">亞馬遜高山接駁：${escapeHtml(transferLink.label)}</a></p>`
    : '';

  return `<main><h1>${escapeHtml(act.title)}</h1>${descHtml}${contentHtml}${itineraryExtraHtml}${transferHtml}${externalLinkHtml}${buildSiteNavHtml()}</main>`;
}

/**
 * 產生章節頁（/chapterNN/）的靜態外殼 HTML：把章節本文直接放進初始 HTML，
 * 讓不執行 JS 的爬蟲（LINE、Bing、社群預覽等）也能讀到內容。
 */
function buildChapterShellHtml(chapter: {
  title: string;
  description?: string;
  content?: string;
}): string {
  const descHtml = (chapter.description || '').trim()
    ? `<p>${escapeHtml(chapter.description!)}</p>`
    : '';
  const contentHtml = (chapter.content || '').trim() ? formatMultilineHtml(chapter.content!) : '';
  return `<main><article><h1>${escapeHtml(chapter.title)}</h1>${descHtml}${contentHtml}</article>${buildSiteNavHtml()}</main>`;
}

/**
 * 章節頁的 Article + BreadcrumbList 結構化資料（每頁獨立，注入 <head>）
 */
function buildChapterJsonLd(
  chapter: { title: string; description?: string; updatedAt?: string; coverImage?: string },
  canonicalUrl: string
): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        headline: chapter.title,
        description: chapter.description || chapter.title,
        inLanguage: 'zh-TW',
        mainEntityOfPage: canonicalUrl,
        url: canonicalUrl,
        ...(chapter.updatedAt ? { dateModified: chapter.updatedAt } : {}),
        ...(chapter.coverImage && /^https?:\/\//i.test(chapter.coverImage)
          ? { image: chapter.coverImage }
          : {}),
        author: { '@id': 'https://amazon-hike.com/#organization' },
        publisher: { '@id': 'https://amazon-hike.com/#organization' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: 'https://amazon-hike.com/' },
          { '@type': 'ListItem', position: 2, name: '登山入門指南', item: 'https://amazon-hike.com/intro' },
          { '@type': 'ListItem', position: 3, name: chapter.title, item: canonicalUrl },
        ],
      },
    ],
  };
  // 避免內容中的 "</script>" 提早結束標籤
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}


const SITE_ORIGIN = 'https://amazon-hike.com';

/** 把工具網址整理成可放進 href 的字串（相對路徑、絕對網址皆可） */
function resolveToolHref(raw: string | undefined | null): string {
  const t = (raw || '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t) || t.startsWith('/')) return t;
  return `https://${t}`;
}

/** 若網址屬於本站（amazon-hike.com），回傳站內路徑；否則回傳 null */
function toInternalPath(href: string): string | null {
  if (!href) return null;
  if (href.startsWith('/')) return href;
  try {
    const u = new URL(href);
    if (u.hostname === 'amazon-hike.com') return u.pathname + u.search;
  } catch {
    // ignore
  }
  return null;
}

const ORG_ID = 'https://amazon-hike.com/#organization';

/**
 * 按鈕列表頁（例如百岳列表）的結構化資料：BreadcrumbList + CollectionPage + ItemList。
 * 讓搜尋引擎與生成式 AI 能直接讀到「這一頁有哪些山／行程」。只有已有內文的項目才附網址。
 */
/**
 * 百岳列表的山名連結（與前台 NavActivitiesView 相同的優先順序）：
 * 山名連結（detailUrl，站內）→ 外部網址欄填的是本站網址 → 有完整介紹內容的行程頁。
 * 都沒有就回傳空字串。
 */
function peakNameHref(a: NavButtonActivity, catSlug: string): string {
  if (a.detailUrl && isInternalUrl(a.detailUrl)) return normalizeUrl(a.detailUrl);
  if (a.externalUrl && isInternalUrl(a.externalUrl)) return normalizeUrl(a.externalUrl);
  if ((a.content || '').trim()) return `/${catSlug}/${a.slug}/`;
  return '';
}

/**
 * 百岳列表（新手／入門／進階／總表）的初始 HTML 表格：山名（含連結）、標高、所屬國家公園、群組、備註、查看行程，
 * 欄位與前台表格一致，預設依標高由高到低排序（與前台畫面相同）。
 */
function buildPeakTableHtml(btn: { title: string }, acts: NavButtonActivity[], catSlug: string): string {
  const rows = acts.map((a, i) => {
    const raw = (a.title || '').trim();
    const m = raw.match(/^(\d{1,3})\s*(.+?)\s*(\d{4})\s*(.*)$/);
    return {
      a,
      i,
      no: m ? Number(m[1]) : null,
      name: m ? m[2].trim() : raw,
      elevation: m ? Number(m[3]) : null,
      group: m ? m[4].trim() : '',
    };
  });
  rows.sort((x, y) => {
    if (x.elevation == null && y.elevation == null) return x.i - y.i;
    if (x.elevation == null) return 1;
    if (y.elevation == null) return -1;
    return x.elevation === y.elevation ? x.i - y.i : y.elevation - x.elevation;
  });
  const withNo = isPeakOverviewButton(btn);
  const body = rows
    .map(({ a, no, name, elevation, group }) => {
      const href = peakNameHref(a, catSlug);
      const nameCell = href ? `<a href="${escapeHtml(href)}">${escapeHtml(name)}</a>` : escapeHtml(name);
      const ext = normalizeUrl(a.externalUrl);
      const extCell = ext ? `<a href="${escapeHtml(ext)}">查看${escapeHtml(name)}行程</a>` : '';
      return (
        '<tr>' +
        (withNo ? `<td>${no != null ? String(no).padStart(3, '0') : ''}</td>` : '') +
        `<td>${nameCell}</td>` +
        `<td>${elevation != null ? elevation : ''}</td>` +
        `<td>${escapeHtml((a.nationalPark || '').trim())}</td>` +
        `<td>${escapeHtml(group)}</td>` +
        `<td>${escapeHtml((a.description || '').trim())}</td>` +
        `<td>${extCell}</td>` +
        '</tr>'
      );
    })
    .join('');
  return (
    `<p>共 ${rows.length} 座</p><table><caption>${escapeHtml(btn.title)}</caption><thead><tr>` +
    (withNo ? '<th scope="col">編號</th>' : '') +
    '<th scope="col">山名</th><th scope="col">標高（公尺）</th><th scope="col">所屬國家公園</th>' +
    '<th scope="col">群組</th><th scope="col">備註</th><th scope="col">行程連結</th>' +
    `</tr></thead><tbody>${body}</tbody></table>`
  );
}

function buildNavListJsonLd(
  btn: { title: string },
  acts: NavButtonActivity[],
  catSlug: string,
  isPeak: boolean,
  pageUrl: string
): string {
  const sorted = acts.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const items = sorted.slice(0, 120).map((a, idx) => {
    const name = isPeak ? formatPeakLinkText(a.title) : a.title;
    const href = isPeak ? peakNameHref(a, catSlug) : (a.content || '').trim() ? `/${catSlug}/${a.slug}/` : '';
    return {
      '@type': 'ListItem',
      position: idx + 1,
      name,
      ...(href ? { url: href.startsWith('/') ? `${SITE_ORIGIN}${href}` : href } : {}),
    };
  });
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: btn.title, item: pageUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name: btn.title,
        inLanguage: 'zh-TW',
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        publisher: { '@id': ORG_ID },
        mainEntity: { '@id': `${pageUrl}#list` },
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#list`,
        name: btn.title,
        numberOfItems: sorted.length,
        itemListElement: items,
      },
    ],
  };
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

/** 單一行程／百岳頁的 Article + BreadcrumbList 結構化資料（含更新日期，利於搜尋引擎與 AI 判斷內容新鮮度） */
function buildActivityJsonLd(
  act: NavButtonActivity,
  parentBtn: { id: string; title: string },
  isPeak: boolean,
  pageUrl: string,
  meta: { description: string; image?: string }
): string {
  const headline = isPeak ? formatPeakLinkText(act.title) : act.title;
  const image = meta.image && /^https?:\/\//i.test(meta.image) ? meta.image : undefined;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline,
        description: meta.description || headline,
        inLanguage: 'zh-TW',
        mainEntityOfPage: pageUrl,
        url: pageUrl,
        ...(act.updatedAt ? { dateModified: act.updatedAt } : {}),
        ...(image ? { image } : {}),
        author: { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        // 百岳頁：標明文章談的是哪一座山、位於哪個國家公園，方便搜尋引擎與 AI 對應實體
        ...(isPeak
          ? {
              about: {
                '@type': 'Mountain',
                name: extractPeakNoAndName(act.title).name || headline,
                ...((act.nationalPark || '').trim()
                  ? { containedInPlace: { '@type': 'Place', name: act.nationalPark!.trim() } }
                  : {}),
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: parentBtn.title, item: `${SITE_ORIGIN}${getNavButtonPath(parentBtn)}` },
          { '@type': 'ListItem', position: 3, name: headline, item: pageUrl },
        ],
      },
    ],
  };
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

/** 通用 BreadcrumbList 結構化資料 */
function buildBreadcrumbJsonLd(items: { name: string; url: string }[], pageUrl: string): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: items.map((it, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: it.name,
          item: it.url,
        })),
      },
    ],
  };
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

/**
 * /tools 的靜態外殼：把已啟用的工具（子站）連結直接放進初始 HTML，
 * 讓不執行 JS 的爬蟲也能從 /tools 找到每個子站。
 */
async function buildToolsShellHtml(env: WorkerEnv, title: string, description: string): Promise<string> {
  const shortTitle = title.split(' | ')[0].trim();
  const pageText = await loadPageTextHtml(env, '/tools');
  let listHtml = '';
  try {
    const db = await loadDatabaseWorker(env);
    const tools = (db.tools || [])
      .filter((t) => t.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const items = tools
      .map((t) => {
        const href = normalizeToolUrl(t.url);
        if (!href) return '';
        const desc = (t.description || '').trim() ? `：${escapeHtml(t.description)}` : '';
        return `<li><a href="${escapeHtml(href)}">${escapeHtml(t.title)}</a>${desc}</li>`;
      })
      .filter(Boolean)
      .join('');
    if (items) listHtml = `<ul>${items}</ul>`;
  } catch (err) {
    console.error('Error building tools shell HTML:', err);
  }
  return `<main><h1>${escapeHtml(shortTitle)}</h1><p>${escapeHtml(description)}</p>${pageText.top}${listHtml}${pageText.bottom}${buildSiteNavHtml()}</main>`;
}

/**
 * /tools 的結構化資料：BreadcrumbList + ItemList。
 * ItemList 的順序 = 後台「登山工具」的排序（sortOrder），內部工具與外部連結都會列出。
 */
async function buildToolsJsonLd(env: WorkerEnv, pageUrl: string): Promise<string> {
  const listItems: { '@type': 'ListItem'; position: number; name: string; url: string }[] = [];
  try {
    const db = await loadDatabaseWorker(env);
    const tools = (db.tools || [])
      .filter((t) => t.enabled && (t.title || '').trim())
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const t of tools) {
      const href = normalizeToolUrl(t.url);
      if (!href) continue;
      const abs = href.startsWith('/') ? SITE_ORIGIN + href : href;
      if (!/^https?:\/\//i.test(abs)) continue;
      listItems.push({
        '@type': 'ListItem',
        position: listItems.length + 1,
        name: t.title.trim(),
        url: abs,
      });
    }
  } catch (err) {
    console.error('Error building tools JSON-LD:', err);
  }
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: '登山工具', item: pageUrl },
      ],
    },
  ];
  if (listItems.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${pageUrl}#toollist`,
      name: '登山工具與氣象服務',
      numberOfItems: listItems.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: listItems,
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

/** /highlights 的靜態外殼 + 影片結構化資料：把影片標題、說明文字放進初始 HTML（只放文字，不放影片網址） */
async function buildHighlightsShell(
  env: WorkerEnv,
  title: string,
  description: string,
  pageUrl: string
): Promise<{ html: string; jsonLd: string }> {
  const shortTitle = title.split(' | ')[0].trim();
  let listHtml = '';
  let introHtml = '';
  let footerHtml = '';
  const videoNodes: Record<string, unknown>[] = [];
  try {
    const db = await loadDatabaseWorker(env);
    const hlBtn = (db.navButtons || []).find((b) => b.id === 'btn_highlights' || b.url === '/highlights');
    const intro = (hlBtn?.introContent || '').trim();
    if (intro) {
      introHtml = formatLinkedMultilineHtml(intro);
    }
    const footer = (hlBtn?.footerContent || '').trim();
    if (footer) {
      footerHtml = formatLinkedMultilineHtml(footer);
    }
    footerHtml += buildNavButtonBlocksHtml(db, hlBtn?.id);
    const enabled = (db.highlights || [])
      .filter((h) => h.enabled && ((h.title || '').trim() || (h.description || '').trim()))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    listHtml = enabled
      .map((h) => {
        const t = (h.title || '').trim();
        const d = (h.description || '').trim();
        const rel = (h.relatedUrl || '').trim();
        const relOk = /^https?:\/\//i.test(rel) || rel.startsWith('/');
        const headHtml = t ? `<h2>${escapeHtml(t)}</h2>` : '';
        const descHtml = d ? formatMultilineHtml(d) : '';
        const linkHtml = relOk
          ? `<p><a href="${escapeHtml(rel)}">查看${t ? `「${escapeHtml(t)}」` : ''}行程介紹</a></p>`
          : '';
        return `<section>${headHtml}${descHtml}${linkHtml}</section>`;
      })
      .join('');

    // VideoObject：需要標題 + 日期 + 可解析的 YouTube 影片 ID 才輸出（避免產生不完整的結構化資料）
    for (const h of enabled) {
      const id = getYouTubeVideoId(h.youtubeUrl);
      const t = (h.title || '').trim();
      const date = (h.uploadDate || '').trim();
      if (!id || !t || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      videoNodes.push({
        '@type': 'VideoObject',
        name: t,
        description: (h.description || '').trim() || t,
        thumbnailUrl: [`https://i.ytimg.com/vi/${id}/hqdefault.jpg`],
        uploadDate: date,
        embedUrl: `https://www.youtube.com/embed/${id}`,
      });
    }
  } catch (err) {
    console.error('Error building highlights shell HTML:', err);
  }
  const leadHtml = introHtml || `<p>${escapeHtml(description)}</p>`;
  const html = `<main><h1>${escapeHtml(shortTitle)}</h1>${leadHtml}${listHtml}${footerHtml}${buildSiteNavHtml()}</main>`;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: '活動花絮', item: pageUrl },
      ],
    },
    ...videoNodes,
  ];
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return { html, jsonLd };
}

/** /policies 的靜態外殼：把已啟用的政策條文放進初始 HTML */
async function buildPoliciesShellHtml(env: WorkerEnv, title: string, description: string): Promise<string> {
  const shortTitle = title.split(' | ')[0].trim();
  const pageText = await loadPageTextHtml(env, '/policies');
  let bodyHtml = '';
  try {
    const db = await loadDatabaseWorker(env);
    const policies = (db.policies || [])
      .filter((p) => p.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    bodyHtml = policies
      .map((p) => `<section><h2>${escapeHtml(p.title)}</h2>${formatMultilineHtml(p.content || '')}</section>`)
      .join('');
  } catch (err) {
    console.error('Error building policies shell HTML:', err);
  }
  return `<main><h1>${escapeHtml(shortTitle)}</h1><p>${escapeHtml(description)}</p>${pageText.top}${bodyHtml}${pageText.bottom}${buildSiteNavHtml()}</main>`;
}

/**
 * 首頁「近期活動」：把後台行事曆中尚未結束的活動放進初始 HTML，並輸出 Event 結構化資料。
 * 讓不執行 JS 的爬蟲與生成式 AI 也能讀到近期有哪些活動、何時舉辦。
 * 沒有即將舉辦的活動時，改列最近 90 天內結束的活動（只有即將舉辦的活動才輸出 Event 結構化資料）。
 * 兩者都沒有時回傳空字串，不會輸出空白區塊。
 */
async function buildHomeEvents(env: WorkerEnv): Promise<{ html: string; jsonLd: string }> {
  try {
    const db = await loadDatabaseWorker(env);
    // 以台灣時間（UTC+8）的今天為準
    const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
    const isDate = (s?: string) => /^\d{4}-\d{2}-\d{2}$/.test((s || '').trim());
    const endOf = (c: { startDate: string; endDate: string }) => (isDate(c.endDate) ? c.endDate : c.startDate);
    const valid = (db.calendarActivities || []).filter(
      (c) => c.enabled && (c.title || '').trim() && isDate(c.startDate)
    );
    const upcoming = valid
      .filter((c) => endOf(c) >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 20);
    // 沒有即將舉辦的活動時，首頁仍列出最近 90 天內結束的活動，避免行事曆區塊在爬蟲眼中是空的
    const recentCutoff = new Date(Date.now() + 8 * 3600 * 1000 - 90 * 86400 * 1000).toISOString().slice(0, 10);
    const recent = valid
      .filter((c) => endOf(c) < today && endOf(c) >= recentCutoff)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .slice(0, 10);
    if (upcoming.length === 0 && recent.length === 0) return { html: '', jsonLd: '' };

    const toAbs = (raw?: string): string => {
      const href = resolveToolHref(raw);
      if (!href) return '';
      return href.startsWith('/') ? SITE_ORIGIN + href : href;
    };
    const range = (c: { startDate: string; endDate: string }) =>
      isDate(c.endDate) && c.endDate !== c.startDate ? `${c.startDate} 至 ${c.endDate}` : c.startDate;

    const renderItems = (list: typeof upcoming) =>
      list
        .map((c) => {
          const abs = toAbs(c.url);
          const name = escapeHtml(c.title.trim());
          const label = /^https?:\/\//i.test(abs) ? `<a href="${escapeHtml(abs)}">${name}</a>` : name;
          return `<li>${label}（${range(c)}）</li>`;
        })
        .join('');
    const html =
      (upcoming.length ? `<section><h2>近期活動</h2><ul>${renderItems(upcoming)}</ul></section>` : '') +
      (recent.length ? `<section><h2>近期已結束活動</h2><ul>${renderItems(recent)}</ul></section>` : '');

    if (upcoming.length === 0) return { html, jsonLd: '' };

    const nodes = upcoming.map((c) => {
      const abs = toAbs(c.url);
      return {
        '@type': 'Event',
        name: c.title.trim(),
        startDate: c.startDate,
        endDate: isDate(c.endDate) ? c.endDate : c.startDate,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        inLanguage: 'zh-TW',
        organizer: { '@id': ORG_ID },
        ...(/^https?:\/\//i.test(abs) ? { url: abs } : {}),
      };
    });
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
    return { html, jsonLd };
  } catch (err) {
    console.error('Error building home events:', err);
    return { html: '', jsonLd: '' };
  }
}

/**
 * 首頁「內容區塊」（後台「首頁區塊管理」）→ 初始 HTML：每個區塊一個 <section><h2>…</h2><p>…</p></section>，
 * 順序與前台相同（sortOrder），只輸出啟用且標題、內容都有填的區塊。
 */
async function buildHomeBlocksHtml(env: WorkerEnv): Promise<string> {
  try {
    const db = await loadDatabaseWorker(env);
    return (db.homeBlocks || [])
      .filter((b) => b.enabled && (b.title || '').trim() && (b.content || '').trim())
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((b) => `<section><h2>${escapeHtml(b.title.trim())}</h2>${formatLinkedMultilineHtml(b.content.trim(), 1)}</section>`)
      .join('');
  } catch (err) {
    console.error('Error building home blocks:', err);
    return '';
  }
}

/**
 * 建立 /intro 頁面初始 HTML 的章節導覽清單
 * 注意：不要加入任何 <h1>、<h2> 或其他標題標籤，/intro 既有的 H1 維持由前端渲染，不要重新設計標題結構。
 */
async function buildIntroLinksHtml(env: WorkerEnv): Promise<string> {
  const pageText = await loadPageTextHtml(env, '/intro');
  try {
    const db = await loadDatabaseWorker(env);
    const enabledChapters = (db.chapters || [])
      .filter((c) => c.enabled && CHAPTER_SLUG_RE.test((c.slug || '').toLowerCase()))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (enabledChapters.length === 0) {
      return `${pageText.top}${pageText.bottom}`;
    }

    const itemsHtml = enabledChapters
      .map(
        (c) =>
          `<li><a href="/${c.slug.toLowerCase()}/">${escapeHtml(c.title)}</a></li>`
      )
      .join('');

    return `${pageText.top}<nav aria-label="登山入門教學章節"><ul>${itemsHtml}</ul></nav>${pageText.bottom}`;
  } catch (err) {
    console.error('Error building intro links HTML:', err);
    return `${pageText.top}${pageText.bottom}`;
  }
}

/**
 * 前端 SPA 獨立路由 SEO Meta 對照表
 */
const ROUTE_META_MAP: Record<string, RouteMetadata> = {
  '/': {
    title: '亞馬遜國家山岳協會｜登山活動行事曆、百岳行程與登山教學',
    description: '想找適合自己的登山活動嗎？這裡整理了亞馬遜國家山岳協會（Amazon Alpine Association）近期的活動行事曆、台灣百岳行程介紹與登山入門教學，也提供行前準備與安全小提醒，陪您安心踏出第一步。',
  },
  '/intro': {
    title: '登山入門指南 | 亞馬遜國家山岳協會',
    description: '專為登山新手與山友整理的登山入門指南，涵蓋高山裝備清單、行前體能鍛鍊、山林安全自保守則與無痕山林（LNT）準則，助您安全開啟山岳旅程。',
  },
  '/tools': {
    title: '登山工具與氣象服務 | 亞馬遜國家山岳協會',
    description: '登山實用數位工具與氣象服務專區，即時整合高山氣象預報、國家公園入山入園線上申辦、步道路況通報及離線地圖軌跡等數位資源。',
  },
  '/highlights': {
    title: '百岳登山影片與活動花絮 | 亞馬遜國家山岳協會',
    description: '亞馬遜國家山岳協會歷年登山行程精選花絮與影音專區，收錄百岳縱走記錄、山友精彩回顧、自然風光縮時與活動實況影片分享。',
  },
  '/policies': {
    title: '政策與章程條款 | 亞馬遜國家山岳協會',
    description: '亞馬遜國家山岳協會章程、活動報名規範、費用與退費標準、山域活動安全責任守則及個人資料保護聲明，維護全體山友權益。',
  },
  '/surveys': {
    title: '問卷調查專區 | 亞馬遜國家山岳協會',
    description: '亞馬遜國家山岳協會意見回饋與問卷調查專區，歡迎山友填寫活動滿意度調查及山岳發展建議，共同打造優質山岳社群。',
  },
};

/**
 * 找不到頁面 (404) 的 Meta 資料
 */
const NOT_FOUND_META: RouteMetadata = {
  title: '找不到此頁面 | 亞馬遜國家山岳協會',
  description: '很抱歉，您所尋找的頁面不存在或已被移除。請返回首頁或瀏覽其他專題專區。',
};

/**
 * 使用 Cloudflare Workers 的 HTMLRewriter 將 index.html 替換成對應頁面的 SEO Meta 與內容
 */
async function applyRouteMeta(
  response: Response,
  meta: RouteMetadata,
  canonicalUrl: string,
  statusCode?: number,
  rootHtml?: string,
  noindex?: boolean,
  jsonLd?: string
): Promise<Response> {
  const targetStatus = statusCode ?? response.status;
  const targetStatusText = statusCode ? (statusCode === 404 ? 'Not Found' : response.statusText) : response.statusText;

  if (typeof HTMLRewriter !== 'undefined') {
    let rewriter = new HTMLRewriter()
      .on('title', {
        element(e: any) {
          e.setInnerContent(meta.title);
        },
      })
      .on('meta[name="description"]', {
        element(e: any) {
          e.setAttribute('content', meta.description);
        },
      })
      .on('meta[property="og:title"]', {
        element(e: any) {
          e.setAttribute('content', meta.title);
        },
      })
      .on('meta[property="og:description"]', {
        element(e: any) {
          e.setAttribute('content', meta.description);
        },
      })
      .on('meta[property="og:url"]', {
        element(e: any) {
          e.setAttribute('content', canonicalUrl);
        },
      })
      .on('meta[name="twitter:title"]', {
        element(e: any) {
          e.setAttribute('content', meta.title);
        },
      })
      .on('meta[name="twitter:description"]', {
        element(e: any) {
          e.setAttribute('content', meta.description);
        },
      })
      .on('link[rel="canonical"]', {
        element(e: any) {
          e.setAttribute('href', canonicalUrl);
        },
      });

    if (noindex) {
      rewriter = rewriter.on('meta[name="robots"]', {
        element(e: any) {
          e.setAttribute('content', 'noindex, follow');
        },
      });
    }

    const isValidHttpUrl = (s?: string) => Boolean(s && /^https?:\/\//i.test(s.trim()));
    // 沒有頁面專屬圖片時改用全站預設分享圖；index.html 已內建 og:image / twitter:image 標籤
    const validImage = isValidHttpUrl(meta.image) ? meta.image!.trim() : DEFAULT_OG_IMAGE;
    rewriter = rewriter
      .on('meta[property="og:image"]', {
        element(e: any) {
          e.setAttribute('content', validImage);
        },
      })
      .on('meta[name="twitter:image"]', {
        element(e: any) {
          e.setAttribute('content', validImage);
        },
      });

    if (jsonLd) {
      rewriter = rewriter.on('head', {
        element(e: any) {
          e.append(`<script type="application/ld+json">${jsonLd}</script>`, { html: true });
        },
      });
    }

    if (rootHtml) {
      rewriter = rewriter.on('div#root', {
        element(e: any) {
          e.setInnerContent(rootHtml, { html: true });
        },
      });
    }

    const transformed = rewriter.transform(response);

    if (statusCode && statusCode !== response.status) {
      return new Response(transformed.body, {
        status: targetStatus,
        statusText: targetStatusText,
        headers: transformed.headers,
      });
    }
    return transformed;
  }

  // 測試環境（如 Node.js test-worker.ts）未定義 HTMLRewriter 時的安全退回處理
  let html = await response.text();
  html = html.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`);
  html = html.replace(
    /(<meta\s+name=["']description["']\s+content=["']).*?(["']\s*\/?>)/i,
    `$1${meta.description}$2`
  );
  html = html.replace(
    /(<meta\s+property=["']og:title["']\s+content=["']).*?(["']\s*\/?>)/i,
    `$1${meta.title}$2`
  );
  html = html.replace(
    /(<meta\s+property=["']og:description["']\s+content=["']).*?(["']\s*\/?>)/i,
    `$1${meta.description}$2`
  );
  html = html.replace(
    /(<meta\s+property=["']og:url["']\s+content=["']).*?(["']\s*\/?>)/i,
    `$1${canonicalUrl}$2`
  );
  html = html.replace(
    /(<meta\s+name=["']twitter:title["']\s+content=["']).*?(["']\s*\/?>)/i,
    `$1${meta.title}$2`
  );
  html = html.replace(
    /(<meta\s+name=["']twitter:description["']\s+content=["']).*?(["']\s*\/?>)/i,
    `$1${meta.description}$2`
  );
  html = html.replace(
    /(<link\s+rel=["']canonical["']\s+href=["']).*?(["']\s*\/?>)/i,
    `$1${canonicalUrl}$2`
  );

  if (noindex) {
    html = html.replace(
      /(<meta\s+name=["']robots["']\s+content=["']).*?(["']\s*\/?>)/i,
      `$1noindex, follow$2`
    );
  }

  const isValidHttpUrl = (s?: string) => Boolean(s && /^https?:\/\//i.test(s.trim()));
  const validImage = isValidHttpUrl(meta.image) ? meta.image!.trim() : DEFAULT_OG_IMAGE;

  {
    const escapedImage = escapeHtml(validImage);
    if (/<meta\s+property=["']og:image["']/i.test(html)) {
      html = html.replace(/(<meta\s+property=["']og:image["']\s+content=["']).*?(["']\s*\/?>)/i, `$1${escapedImage}$2`);
    } else {
      html = html.replace(/<\/head>/i, () => `<meta property="og:image" content="${escapedImage}" /></head>`);
    }
    if (/<meta\s+name=["']twitter:image["']/i.test(html)) {
      html = html.replace(/(<meta\s+name=["']twitter:image["']\s+content=["']).*?(["']\s*\/?>)/i, `$1${escapedImage}$2`);
    } else {
      html = html.replace(/<\/head>/i, () => `<meta name="twitter:image" content="${escapedImage}" /></head>`);
    }
  }

  if (jsonLd) {
    html = html.replace(
      /<\/head>/i,
      () => `<script type="application/ld+json">${jsonLd}</script></head>`
    );
  }

  if (rootHtml) {
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, () => `<div id="root">${rootHtml}</div>`);
  }

  return new Response(html, {
    status: targetStatus,
    statusText: targetStatusText,
    headers: response.headers,
  });
}

/** 產生 /llms.txt（給生成式 AI 讀的網站導覽），內容全部來自後台資料與既有頁面，不編造任何資訊 */
async function buildLlmsTxt(env: WorkerEnv): Promise<string> {
  const db = await loadDatabaseWorker(env);
  const abs = (u: string) => (u.startsWith('/') ? `${SITE_ORIGIN}${u}` : u);
  const oneLine = (t: string) => (t || '').replace(/\s+/g, ' ').trim();
  const lines: string[] = [];

  lines.push('# 亞馬遜國家山岳協會（Amazon Alpine Association）');
  lines.push('');
  lines.push(
    '> 社團法人（立案編號 台內團自第1130008137號）。宗旨：提倡全民運動、鍛鍊強健體魄、培養互助團隊精神，以及接觸大自然與山林相關知識及技能。網站提供活動行事曆、台灣百岳行程、登山入門教學、登山工具與活動花絮。'
  );
  lines.push('');
  lines.push('聯絡：LINE https://lin.ee/TJJLV36 ｜ 電話 0972573495 ｜ Email yy661003@gmail.com');
  lines.push('');

  lines.push('## 主要頁面');
  lines.push(`- [活動行事曆](${SITE_ORIGIN}/)：協會近期登山活動與行程`);
  lines.push(`- [登山入門教學](${SITE_ORIGIN}/intro)：從行前規劃、裝備、氣象到安全與法規的入門章節`);
  lines.push(`- [登山工具與氣象服務](${SITE_ORIGIN}/tools)：登山計算工具與氣象、路況查詢`);
  lines.push(`- [活動花絮影音](${SITE_ORIGIN}/highlights)：歷年登山活動影片`);
  lines.push(`- [政策與條款](${SITE_ORIGIN}/policies)：章程、活動參與安全守則、退費規範與隱私權聲明`);
  lines.push(`- [出團須知](${SITE_ORIGIN}/rules/)：登山活動的報名審核、退費與取消規則、交通接駁、行進紀律與登山安全規定`);
  lines.push(`- [登山團退費與取消規定怎麼算？](${SITE_ORIGIN}/rules/refund/)`);
  lines.push(`- [登山互助小組怎麼編組？禁止獨走與視線範圍規定](${SITE_ORIGIN}/rules/buddy-team/)`);
  lines.push(`- [登山行進紀律：領隊指揮、行進節奏與落後者停損](${SITE_ORIGIN}/rules/discipline/)`);
  lines.push(`- [登山遇到繩索與危險地形怎麼通過？使用原則與檢查](${SITE_ORIGIN}/rules/rope/)`);
  lines.push(`- [登山隊員失聯或迷航時怎麼處置？](${SITE_ORIGIN}/rules/lost-contact/)`);
  lines.push(`- [登山緊急聯絡人與留守人怎麼設定？出發前與入山後的回報](${SITE_ORIGIN}/rules/emergency-contact/)`);
  lines.push(`- [登山團糧食怎麼準備？餐數、秤重與預備糧流程](${SITE_ORIGIN}/rules/food-weigh/)`);
  lines.push('');

  const buttons = (db.navButtons || []).filter((b) => b.enabled).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const acts = (db.navButtonActivities || []).filter((a) => a.enabled);
  const listBtns = buttons.filter((b) => acts.some((a) => a.navButtonId === b.id));
  if (listBtns.length > 0) {
    lines.push('## 百岳與登山行程');
    for (const b of listBtns) {
      const n = acts.filter((a) => a.navButtonId === b.id).length;
      const intro = oneLine(resolveNavButtonIntroParagraphs(b)[0] || '');
      const brief = intro ? `：${intro.length > 80 ? intro.slice(0, 79) + '…' : intro}` : '';
      lines.push(`- [${b.title}](${SITE_ORIGIN}${getNavButtonPath(b)})（${n} 筆）${brief}`);
    }
    lines.push('');
  }

  const tools = (db.tools || []).filter((t) => t.enabled).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const toolLines = tools
    .map((t) => {
      const href = normalizeToolUrl(t.url);
      if (!href) return '';
      const d = oneLine(t.description || '');
      return `- [${t.title}](${abs(href)})${d ? `：${d.length > 80 ? d.slice(0, 79) + '…' : d}` : ''}`;
    })
    .filter(Boolean);
  if (toolLines.length > 0) {
    lines.push('## 登山工具');
    lines.push(...toolLines);
    lines.push('');
  }

  const chapters = (db.chapters || [])
    .filter((c) => c.enabled && !isThinMainChapter(c))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  if (chapters.length > 0) {
    lines.push('## 登山入門教學章節');
    for (const c of chapters) {
      const slug = (c.slug || '').toLowerCase();
      const loc = CHAPTER_SLUG_RE.test(slug) ? `${SITE_ORIGIN}/${slug}/` : `${SITE_ORIGIN}/intro/${c.slug}`;
      const d = oneLine(c.description || '');
      lines.push(`- [${c.title}](${loc})${d ? `：${d.length > 80 ? d.slice(0, 79) + '…' : d}` : ''}`);
    }
    lines.push('');
  }

  lines.push('## 相關服務與工具（不同網域）');
  lines.push('- [亞馬遜高山接駁：全台登山口包車接送](https://transfer.amazon-hike.com/)');
  lines.push('- [登山接駁費用試算](https://price.amazon-hike.com/)');
  lines.push('- [登山路況與道路管制查詢](https://road.amazon-hike.com/)');
  lines.push('- [台灣林道通行狀況查詢](https://forestroad.amazon-hike.com/)');
  lines.push('');

  lines.push('## 說明');
  lines.push(
    '亞馬遜高山接駁為獨立品牌的接駁服務，與本協會互相推薦；登山教學與百岳介紹以本站為準，包車與接駁報價以接駁站為準。百岳標高與路況資料可能因測量年份或天災而有出入，實際規劃請以官方最新公告為準。'
  );
  lines.push('');
  return lines.join('\n');
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. All /api/* requests are handled strictly by the API Handler
    if (pathname.startsWith('/api/') || pathname === '/api') {
      return handleApiRequest(request, env, url);
    }

    // 2. SEO Endpoints: robots.txt and sitemap.xml
    if (pathname === '/robots.txt') {
      return new Response(
        `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin/

# 明確允許主要的搜尋與 AI 助理爬蟲讀取公開內容（後台仍不開放）
User-agent: Googlebot
User-agent: Bingbot
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-User
User-agent: Claude-SearchBot
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: Applebot-Extended
Allow: /
Disallow: /admin
Disallow: /api/admin/

Sitemap: https://amazon-hike.com/sitemap.xml
`,
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        }
      );
    }

    // llms.txt：依後台資料動態產生，新增百岳／行程按鈕、工具、章節後會自動更新；失敗時退回 public/llms.txt
    if (pathname === '/llms.txt') {
      try {
        const body = await buildLlmsTxt(env);
        if (body) {
          return new Response(body, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch (err) {
        console.error('Error building llms.txt:', err);
      }
    }

    if (pathname === '/sitemap.xml') {
      const db = await loadDatabaseWorker(env);
      const enabledChapters = (db.chapters || [])
        .filter((c) => c.enabled && !isThinMainChapter(c))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const chapterUrls = enabledChapters
        .map((chap) => {
          const loc = CHAPTER_SLUG_RE.test((chap.slug || '').toLowerCase())
            ? `https://amazon-hike.com/${chap.slug.toLowerCase()}/`
            : `https://amazon-hike.com/intro/${chap.slug}`;
          const lastmodTag = chap.updatedAt ? `\n    <lastmod>${chap.updatedAt}</lastmod>` : '';
          return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
        .join('\n');

      // 章節若放在後台「入門導讀（intros）」而不是「章節專文管理（chapters）」，
      // 連結會是 https://amazon-hike.com/chapterNN/（由獨立專案渲染），一樣要列進 sitemap。
      // 仍由主站渲染的 chapter01～04 不在此收錄；已在 chapters 出現的 slug 不重複列。
      const seenChapterSlugs = new Set<string>(
        enabledChapters.map((c) => String(c.slug || '').toLowerCase())
      );
      const introChapterUrls = (db.intros || [])
        .filter((i) => i.enabled)
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((i) => {
          const p = toInternalPath(resolveToolHref(i.url));
          const m = p ? p.match(/^\/(chapter[0-9]+)\/?$/i) : null;
          if (!m) return '';
          const slug = m[1].toLowerCase();
          if (!CHAPTER_SLUG_RE.test(slug) || MAIN_WORKER_CHAPTER_SLUGS.has(slug) || seenChapterSlugs.has(slug)) {
            return '';
          }
          seenChapterSlugs.add(slug);
          return `  <url>
    <loc>${SITE_ORIGIN}/${slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
        .filter(Boolean)
        .join('\n');

      const seenToolPaths = new Set<string>();
      const toolUrls = (db.tools || [])
        .filter((t) => t.enabled)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((t) => {
          const p = toInternalPath(normalizeToolUrl(t.url));
          // 只收格式乾淨的站內路徑（例如 /tool25/），含 * 或引號等字元的錯誤網址一律略過
          if (!p || p === '/tools' || !/^\/[A-Za-z0-9_\-\/]+$/.test(p) || seenToolPaths.has(p)) return '';
          seenToolPaths.add(p);
          return `  <url>
    <loc>${escapeHtml(SITE_ORIGIN + p)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
        })
        .filter(Boolean)
        .join('\n');

      const allEnabledActivities = (db.navButtonActivities || [])
        .filter((act) => {
          if (!act.enabled || !act.slug || !act.slug.trim()) return false;
          const parentBtn = (db.navButtons || []).find((b) => b.id === act.navButtonId);
          return Boolean(parentBtn && parentBtn.enabled);
        })
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const validActivities = allEnabledActivities.filter((act) =>
        Boolean((act.content || '').trim())
      );

      const activityUrls = validActivities
        .map((act) => {
          const parentBtn = (db.navButtons || []).find((b) => b.id === act.navButtonId)!;
          const catSlug = getCategorySlug(parentBtn);
          const lastmodTag = act.updatedAt ? `\n    <lastmod>${act.updatedAt}</lastmod>` : '';
          return `  <url>
    <loc>https://amazon-hike.com/${catSlug}/${act.slug}/</loc>${lastmodTag}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
        .join('\n');

      const navButtonsWithActivities = (db.navButtons || []).filter(
        (b) => b.enabled && allEnabledActivities.some((a) => a.navButtonId === b.id)
      );
      const navUrls = navButtonsWithActivities
        .map((btn) => {
          const btnActivities = allEnabledActivities.filter((a) => a.navButtonId === btn.id);
          const latestActUpdate = btnActivities
            .map((a) => a.updatedAt)
            .filter(Boolean)
            .sort()
            .pop();
          const lastmodTag = latestActUpdate ? `\n    <lastmod>${latestActUpdate}</lastmod>` : '';
          return `  <url>
    <loc>${SITE_ORIGIN}${getNavButtonPath(btn)}</loc>${lastmodTag}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        })
        .join('\n');

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://amazon-hike.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/intro</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/tools</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/highlights</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/policies</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/refund/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/buddy-team/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/discipline/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/rope/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/lost-contact/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/emergency-contact/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/rules/food-weigh/</loc>
    <lastmod>2026-10-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/surveys</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
${toolUrls}
${chapterUrls}
${introChapterUrls}
${navUrls}
${activityUrls}
</urlset>`,
        {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        }
      );
    }

    // 2-1. 301 Redirects for Chapter URLs
    const trimmed = pathname.replace(/\/+$/, '').toLowerCase();
    const introMatch = trimmed.match(INTRO_REDIRECT_RE);
    if (introMatch) {
      return Response.redirect(`https://amazon-hike.com/${introMatch[1]}/${url.search}`, 301);
    }

    if (!pathname.endsWith('/')) {
      const chapterMatch = trimmed.match(CHAPTER_REDIRECT_RE);
      if (chapterMatch) {
        return Response.redirect(`https://amazon-hike.com/${chapterMatch[1]}/${url.search}`, 301);
      }

      // Two-level route without trailing slash -> 301 redirect to /{catSlug}/{actSlug}/
      const segs = trimmed.slice(1).split('/');
      if (
        segs.length === 2 &&
        !pathname.startsWith('/intro/') &&
        !pathname.startsWith('/nav/') &&
        !pathname.startsWith('/route/') &&
        !pathname.startsWith('/admin') &&
        !pathname.startsWith('/api/')
      ) {
        return Response.redirect(`https://amazon-hike.com/${segs[0]}/${segs[1]}/${url.search}`, 301);
      }

      // 單層代稱網址沒帶結尾斜線（/traverse）-> 301 到 /traverse/（只在真的有對應按鈕時才轉）
      if (segs.length === 1 && isPossibleNavListSlug(segs[0]) && !(`/${segs[0]}` in ROUTE_META_MAP)) {
        try {
          const db = await loadDatabaseWorker(env);
          const listBtn = (db.navButtons || []).find((b) => b.enabled && getNavButtonPath(b) === `/${segs[0]}/`);
          if (listBtn) {
            return Response.redirect(`https://amazon-hike.com/${segs[0]}/${url.search}`, 301);
          }
        } catch (err) {
          // 讀不到資料庫就交給後面的流程處理
        }
      }
    }

    // 2-1b. 舊的按鈕列表頁網址 /nav/:id（含結尾斜線）-> 301 轉到好看的 /代稱/
    const legacyNavMatch = pathname.replace(/\/+$/, '').match(/^\/nav\/([^/]+)$/);
    if (legacyNavMatch) {
      try {
        const db = await loadDatabaseWorker(env);
        const legacyBtn = findNavButtonByNavId(db.navButtons, legacyNavMatch[1], `/nav/${legacyNavMatch[1]}`);
        if (legacyBtn && legacyBtn.enabled) {
          const prettyPath = getNavButtonPath(legacyBtn);
          if (!prettyPath.startsWith('/nav/')) {
            return Response.redirect(`https://amazon-hike.com${prettyPath}${url.search}`, 301);
          }
        }
      } catch (err) {
        // 讀不到資料庫就交給後面的流程處理
      }
    }

    // 2-2. Legacy /route/:slug -> 301 Redirect to canonical /{categorySlug}/{activitySlug}/
    const routeMatch = trimmed.match(/^\/route\/([a-z0-9-_]+)$/);
    if (routeMatch) {
      try {
        const db = await loadDatabaseWorker(env);
        const act = (db.navButtonActivities || []).find((a) => a.slug.toLowerCase() === routeMatch[1] && a.enabled);
        if (act) {
          const parentBtn = (db.navButtons || []).find((b) => b.id === act.navButtonId);
          const catSlug = parentBtn ? getCategorySlug(parentBtn) : 'activity';
          return Response.redirect(`https://amazon-hike.com/${catSlug}/${act.slug}/${url.search}`, 301);
        }
      } catch (err) {
        // Fallback to route handler
      }
    }

    // 2-3. 已知路由若帶有結尾斜線（例如 /intro/、/tools/、/highlights/、/policies/、/surveys/、/admin/、/nav/），301 重定向到無斜線版本
    if (pathname.length > 1 && pathname.endsWith('/')) {
      const withoutTrailing = pathname.replace(/\/+$/, '');
      if (
        withoutTrailing in ROUTE_META_MAP ||
        withoutTrailing === '/admin' ||
        withoutTrailing.startsWith('/intro/') ||
        withoutTrailing.startsWith('/nav/')
      ) {
        return Response.redirect(`https://amazon-hike.com${withoutTrailing}${url.search}`, 301);
      }
    }

    // 3. Static Assets / SPA fallback
    // If env.ASSETS is provided (Cloudflare Workers Static Assets), delegate to it.
    if (env && env.ASSETS) {
      const normalizedPath = pathname.replace(/\/+$/, '') || '/';
      const isRoot = normalizedPath === '/' || pathname === '/index.html';
      let routeMeta = ROUTE_META_MAP[normalizedPath];
      // 固定頁面（首頁、/intro、/tools、/policies、/surveys）：後台「前台導覽按鈕」有填 SEO 標題／描述就優先使用
      if (routeMeta && PAGE_TEXT_BUTTON_IDS[normalizedPath]) {
        try {
          const db = await loadDatabaseWorker(env);
          const btn = (db.navButtons || []).find(
            (b) => ((b.url || '').replace(/\/+$/, '') || '/') === normalizedPath || b.id === PAGE_TEXT_BUTTON_IDS[normalizedPath]
          );
          const t = (btn?.seoTitle || '').trim();
          const d = (btn?.metaDescription || '').trim();
          if (t || d) routeMeta = { ...routeMeta, title: t || routeMeta.title, description: d || routeMeta.description };
        } catch (err) {
          console.error('Error applying admin SEO override:', err);
        }
      }

      // Dynamic chapter route matching: /intro/:slug 以及正式章節網址 /chapterXX/
      let isChapterNotFound = false;
      let matchedChapter: any = null;
      const isBareChapterPath = CHAPTER_SLUG_RE.test(normalizedPath.slice(1).toLowerCase());
      if (!routeMeta && (normalizedPath.startsWith('/intro/') || isBareChapterPath)) {
        const slug = (normalizedPath.startsWith('/intro/')
          ? normalizedPath.replace(/^\/intro\//, '')
          : normalizedPath.slice(1)
        ).toLowerCase();
        if (slug) {
          try {
            const db = await loadDatabaseWorker(env);
            const chapter = (db.chapters || []).find((c) => c.slug.toLowerCase() === slug);
            if (chapter && chapter.enabled) {
              matchedChapter = chapter;
              routeMeta = {
                title: `${chapter.title} | 亞馬遜國家山岳協會`,
                description: chapter.description || `${chapter.title} - 亞馬遜國家山岳協會登山入門教學專文。`,
              };
            } else {
              // 找不到此章節或找到但 enabled 為 false
              isChapterNotFound = true;
              routeMeta = {
                title: '找不到此章節 | 亞馬遜國家山岳協會',
                description: '很抱歉，您所尋找的登山入門專文不存在、已下架或網址錯誤。請返回登山入門專頁瀏覽其他專題文章。',
              };
            }
          } catch (err) {
            console.error('Error resolving dynamic chapter metadata:', err);
          }
        }
      }

      // Dynamic nav route matching: /nav/:buttonId
      let isNavNotFound = false;
      if (!routeMeta && normalizedPath.startsWith('/nav/')) {
        const buttonId = normalizedPath.replace(/^\/nav\//, '');
        if (buttonId) {
          try {
            const db = await loadDatabaseWorker(env);
            const btn = (db.navButtons || []).find((b) => {
              if (b.id === buttonId) return true;
              if (b.url === normalizedPath) return true;
              if (b.url === `/nav/${buttonId}`) return true;
              const strippedUrl = (b.url || '').replace(/^\/nav\//, '').replace(/\/+$/, '');
              if (strippedUrl && strippedUrl === buttonId) return true;
              return false;
            });
            if (btn) {
              routeMeta = resolveNavButtonSeo(btn);
            } else {
              isNavNotFound = true;
              routeMeta = {
                title: '找不到此活動專區 | 亞馬遜國家山岳協會',
                description: '很抱歉，您所尋找的活動專區不存在或已被移除。',
              };
            }
          } catch (err) {
            console.error('Error resolving dynamic nav metadata:', err);
          }
        }
      }

      // Dynamic single activity route matching: /route/:slug
      let isRouteNotFound = false;
      let isThinActivity = false;
      if (!routeMeta && normalizedPath.startsWith('/route/')) {
        const slug = normalizedPath.replace(/^\/route\//, '').toLowerCase();
        if (slug) {
          try {
            const db = await loadDatabaseWorker(env);
            const act = (db.navButtonActivities || []).find(
              (a) => a.slug.toLowerCase() === slug && a.enabled
            );
            if (act) {
              isThinActivity = !(act.content || '').trim();
              routeMeta = {
                title: `${act.title} | 亞馬遜國家山岳協會`,
                description:
                  act.description ||
                  `${act.title} - 亞馬遜國家山岳協會登山行程活動說明與完整報名資訊。`,
              };
            } else {
              isRouteNotFound = true;
              routeMeta = {
                title: '找不到此活動 | 亞馬遜國家山岳協會',
                description: '很抱歉，您所尋找的活動行程不存在或已下架。',
              };
            }
          } catch (err) {
            console.error('Error resolving dynamic route metadata:', err);
          }
        }
      }

      // Dynamic two-segment category & activity route matching: /:categorySlug/:activitySlug
      let isCategoryActivityNotFound = false;
      const pathSegments = normalizedPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
      if (
        !routeMeta &&
        pathSegments.length === 2 &&
        !normalizedPath.startsWith('/intro/') &&
        !normalizedPath.startsWith('/nav/') &&
        !normalizedPath.startsWith('/route/') &&
        !normalizedPath.startsWith('/admin')
      ) {
        const [catSlug, actSlug] = [pathSegments[0].toLowerCase(), pathSegments[1].toLowerCase()];
        try {
          const db = await loadDatabaseWorker(env);
          const parentBtn = (db.navButtons || []).find(
            (b) => b.enabled && getCategorySlug(b) === catSlug
          );
          if (parentBtn) {
            const act = (db.navButtonActivities || []).find(
              (a) => a.navButtonId === parentBtn.id && a.slug.toLowerCase() === actSlug && a.enabled
            );
            if (act) {
              isThinActivity = !(act.content || '').trim();
              const seo = resolveActivitySeo(act, parentBtn);
              routeMeta = {
                title: seo.title,
                description: seo.description,
              };
            } else {
              isCategoryActivityNotFound = true;
              routeMeta = {
                title: '找不到此活動 | 亞馬遜國家山岳協會',
                description: '很抱歉，您所尋找的活動行程不存在或已下架。',
              };
            }
          } else {
            isCategoryActivityNotFound = true;
            routeMeta = {
              title: '找不到此活動分類 | 亞馬遜國家山岳協會',
              description: '很抱歉，您所尋找的活動行程分類不存在或已下架。',
            };
          }
        } catch (err) {
          console.error('Error resolving dynamic category activity metadata:', err);
        }
      }

      // Dynamic single-segment category list route: /:categorySlug/（按鈕列表頁的好看網址）
      let matchedListBtn: any = null;
      if (!routeMeta && pathSegments.length === 1 && isPossibleNavListSlug(pathSegments[0])) {
        try {
          const db = await loadDatabaseWorker(env);
          const listSlug = pathSegments[0].toLowerCase();
          const listBtn = (db.navButtons || []).find(
            (b) => b.enabled && getNavButtonPath(b) === `/${listSlug}/`
          );
          if (listBtn) {
            matchedListBtn = listBtn;
            routeMeta = resolveNavButtonSeo(listBtn);
          }
        } catch (err) {
          console.error('Error resolving category list metadata:', err);
        }
      }

      // 3-1. 首頁 (/) 或 /index.html：套用首頁專屬 SEO Meta
      if (isRoot && routeMeta) {
        const indexRequest = buildIndexRequest(request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        if (indexResponse.ok) {
          // 首頁正文（導讀、近期活動、內容區塊、常見問題）直接寫進初始 HTML，
          // 不執行 JavaScript 的爬蟲與 AI 助理也讀得到。
          const pageText = await loadPageTextHtml(env, '/');
          const ev = await buildHomeEvents(env);
          const homeBlocksHtml = await buildHomeBlocksHtml(env);
          const rootHtml = buildHomeShellHtml(
            pageText.top + ev.html,
            pageText.bottom + homeBlocksHtml
          );
          return applyRouteMeta(
            indexResponse,
            routeMeta,
            'https://amazon-hike.com/',
            undefined,
            rootHtml,
            false,
            ev.jsonLd || undefined
          );
        }
        return indexResponse;
      }

      // 3-2. 靜態資源（JS, CSS, 圖檔等）
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.ok) {
        return assetResponse;
      }

      // 3-3. /admin 路由維持原行為（不注入額外外殼，回傳原始 index.html）
      if (normalizedPath === '/admin') {
        const spaRequest = buildIndexRequest(request);
        const adminRes = await env.ASSETS.fetch(spaRequest);
        const adminHeaders = new Headers(adminRes.headers);
        adminHeaders.set('X-Robots-Tag', 'noindex, nofollow');
        return new Response(adminRes.body, {
          status: adminRes.status,
          statusText: adminRes.statusText,
          headers: adminHeaders,
        });
      }

      // 3-4. SPA Fallback 客戶端已知路由（/intro, /tools, /highlights, /policies, /surveys, /intro/:slug）
      const spaRequest = buildIndexRequest(request);
      const indexResponse = await env.ASSETS.fetch(spaRequest);

      if (routeMeta && indexResponse.ok) {
        const isTrailingSlashRoute =
          Boolean(matchedListBtn) ||
          CHAPTER_SLUG_RE.test(normalizedPath.slice(1).toLowerCase()) ||
          (pathSegments.length === 2 &&
            !isCategoryActivityNotFound &&
            !normalizedPath.startsWith('/nav/') &&
            !normalizedPath.startsWith('/intro/'));
        const canonicalUrl = isTrailingSlashRoute
          ? `https://amazon-hike.com${normalizedPath}/`
          : `https://amazon-hike.com${normalizedPath}`;
        // /intro 維持只注入章節連結、不含 <h1
        let rootHtml: string | undefined;
        let chapterJsonLd: string | undefined;
        if (normalizedPath === '/intro') {
          rootHtml = await buildIntroLinksHtml(env);
        } else if (normalizedPath.startsWith('/route/') && !isRouteNotFound) {
          const slug = normalizedPath.replace(/^\/route\//, '').toLowerCase();
          try {
            const db = await loadDatabaseWorker(env);
            const act = (db.navButtonActivities || []).find((a) => a.slug.toLowerCase() === slug && a.enabled);
            if (act) {
              rootHtml = buildActivityShellHtml(act);
            } else {
              rootHtml = buildSectionShellHtml(routeMeta.title, routeMeta.description);
            }
          } catch (e) {
            rootHtml = buildSectionShellHtml(routeMeta.title, routeMeta.description);
          }
        } else if ((normalizedPath.startsWith('/nav/') && !isNavNotFound) || matchedListBtn) {
          const buttonId = normalizedPath.replace(/^\/nav\//, '');
          try {
            const db = await loadDatabaseWorker(env);
            const btn =
              matchedListBtn ||
              (db.navButtons || []).find((b) => {
                if (b.id === buttonId) return true;
                if (b.url === normalizedPath) return true;
                if (b.url === `/nav/${buttonId}`) return true;
                const strippedUrl = (b.url || '').replace(/^\/nav\//, '').replace(/\/+$/, '');
                if (strippedUrl && strippedUrl === buttonId) return true;
                return false;
              });
            const acts = btn
              ? (db.navButtonActivities || []).filter((a) => a.navButtonId === btn.id && a.enabled)
              : [];
            const catSlug = btn ? getCategorySlug(btn) : buttonId;
            const isPeak = btn ? isPeakTableButton(btn) : false;
            const linkText = (t: string) => escapeHtml(isPeak ? formatPeakLinkText(t) : t);
            const listHtml = acts
              .map((a) =>
                (a.content || '').trim()
                  ? `<li><a href="/${catSlug}/${a.slug}/">${linkText(a.title)}</a></li>`
                  : `<li>${linkText(a.title)}</li>`
              )
              .join('');
            // 導讀文字放進初始 HTML 本文，不只出現在 meta description
            const introHtml = btn
              ? formatLinkedMultilineHtml(resolveNavButtonIntroParagraphs(btn).join('\n\n'))
              : '';
            // 下方說明同樣放進初始 HTML 本文
            const footerHtml = btn
              ? formatLinkedMultilineHtml((btn.footerContent || '').trim())
              : '';
            // 按鈕分頁頂部大圖（後台「頂部大圖」欄位）
            const heroHtml =
              btn && /^https?:\/\//i.test((btn.heroImage || '').trim())
                ? `<img src="${escapeHtml(btn.heroImage!.trim())}" alt="${escapeHtml((btn.heroImageAlt || btn.title).trim())}">`
                : '';
            // 該按鈕的「區塊管理」內容區塊（H2＋內文）
            const blocksHtml = buildNavButtonBlocksHtml(db, btn?.id);
            const listOrTableHtml =
              btn && isPeak && acts.length > 0 ? buildPeakTableHtml(btn, acts, catSlug) : `<ul>${listHtml}</ul>`;
            rootHtml = `<main><h1>${escapeHtml(btn ? btn.title : '活動列表')}</h1>${heroHtml}${introHtml}${listOrTableHtml}${footerHtml}${blocksHtml}${buildSiteNavHtml()}</main>`;
            if (btn) {
              chapterJsonLd = buildNavListJsonLd(btn, acts, catSlug, isPeak, canonicalUrl);
            }
          } catch (e) {
            rootHtml = buildSectionShellHtml(routeMeta.title, routeMeta.description);
          }
        } else if (
          pathSegments.length === 2 &&
          !isCategoryActivityNotFound &&
          !normalizedPath.startsWith('/nav/') &&
          !normalizedPath.startsWith('/intro/')
        ) {
          const [catSlug, actSlug] = [pathSegments[0].toLowerCase(), pathSegments[1].toLowerCase()];
          try {
            const db = await loadDatabaseWorker(env);
            const parentBtn = (db.navButtons || []).find((b) => b.enabled && getCategorySlug(b) === catSlug);
            const act = parentBtn
              ? (db.navButtonActivities || []).find((a) => a.navButtonId === parentBtn.id && a.slug.toLowerCase() === actSlug && a.enabled)
              : null;
            if (act && parentBtn) {
              rootHtml = buildActivityShellHtml(act);
              chapterJsonLd = buildActivityJsonLd(
                act,
                parentBtn,
                isPeakTableButton(parentBtn),
                canonicalUrl,
                { description: routeMeta.description, image: routeMeta.image }
              );
            } else {
              rootHtml = buildSectionShellHtml(routeMeta.title, routeMeta.description);
            }
          } catch (e) {
            rootHtml = buildSectionShellHtml(routeMeta.title, routeMeta.description);
          }
        } else if (matchedChapter && !isChapterNotFound) {
          rootHtml = buildChapterShellHtml(matchedChapter);
          chapterJsonLd = buildChapterJsonLd(matchedChapter, canonicalUrl);
        } else if (normalizedPath === '/tools') {
          rootHtml = await buildToolsShellHtml(env, routeMeta.title, routeMeta.description);
          chapterJsonLd = await buildToolsJsonLd(env, canonicalUrl);
        } else if (normalizedPath === '/highlights') {
          const hl = await buildHighlightsShell(env, routeMeta.title, routeMeta.description, canonicalUrl);
          rootHtml = hl.html;
          chapterJsonLd = hl.jsonLd;
        } else if (normalizedPath === '/policies') {
          rootHtml = await buildPoliciesShellHtml(env, routeMeta.title, routeMeta.description);
        } else if (!normalizedPath.startsWith('/intro/')) {
          const pageText =
            normalizedPath === '/' || normalizedPath === '/surveys'
              ? await loadPageTextHtml(env, normalizedPath)
              : { top: '', bottom: '' };
          let homeEventsHtml = '';
          let homeBlocksHtml = '';
          if (normalizedPath === '/') {
            const ev = await buildHomeEvents(env);
            homeEventsHtml = ev.html;
            if (ev.jsonLd) chapterJsonLd = ev.jsonLd;
            homeBlocksHtml = await buildHomeBlocksHtml(env);
          }
          rootHtml = buildSectionShellHtml(
            routeMeta.title,
            routeMeta.description,
            pageText.top + homeEventsHtml,
            pageText.bottom + homeBlocksHtml
          );
        }

        const isNotFound = isChapterNotFound || isNavNotFound || isRouteNotFound || isCategoryActivityNotFound;
        return applyRouteMeta(
          indexResponse,
          routeMeta,
          isNotFound ? 'https://amazon-hike.com/' : canonicalUrl,
          isNotFound ? 404 : undefined,
          rootHtml,
          isNotFound || isThinActivity || Boolean(matchedChapter && isThinMainChapter(matchedChapter)),
          chapterJsonLd
        );
      }

      // 3-5. 未知路徑：回傳 404，canonical 指向首頁，robots 設為 noindex, follow
      if (indexResponse.ok) {
        const canonicalUrl = 'https://amazon-hike.com/';
        const notFoundShell = buildSectionShellHtml(NOT_FOUND_META.title, NOT_FOUND_META.description);
        return applyRouteMeta(
          indexResponse,
          NOT_FOUND_META,
          canonicalUrl,
          404,
          notFoundShell,
          true
        );
      }

      return indexResponse;
    }

    // Fallback if accessed in testing harness without ASSETS binding
    return new Response('Cloudflare Worker Entry Point active. Static assets require ASSETS binding.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
