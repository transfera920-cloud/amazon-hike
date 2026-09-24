import { loadDatabaseWorker } from './db-kv.js';
import { handleApiRequest } from './api-handler.js';
import type { WorkerEnv } from './db-kv.js';

declare const HTMLRewriter: any;

export interface RouteMetadata {
  title: string;
  description: string;
}

const CHAPTER_SLUG_RE = /^chapter(0[1-9]|1[0-5])$/;
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
  return `<nav aria-label="主要導覽"><ul>${items}</ul></nav>`;
}

/**
 * 產生非 /intro 獨立專區頁面的靜態外殼 HTML
 * 規定：<h1> 必須只取 Title 用「 | 」切開後的第一段，不可放完整 Title。
 */
function buildSectionShellHtml(title: string, description: string): string {
  const shortTitle = title.split(' | ')[0].trim();
  return `<main><h1>${escapeHtml(shortTitle)}</h1><p>${escapeHtml(
    description
  )}</p>${buildSiteNavHtml()}</main>`;
}

/**
 * 建立 /intro 頁面初始 HTML 的章節導覽清單
 * 注意：不要加入任何 <h1>、<h2> 或其他標題標籤，/intro 既有的 H1 維持由前端渲染，不要重新設計標題結構。
 */
async function buildIntroLinksHtml(env: WorkerEnv): Promise<string> {
  try {
    const db = await loadDatabaseWorker(env);
    const enabledChapters = (db.chapters || [])
      .filter((c) => c.enabled && CHAPTER_SLUG_RE.test((c.slug || '').toLowerCase()))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (enabledChapters.length === 0) {
      return '';
    }

    const itemsHtml = enabledChapters
      .map(
        (c) =>
          `<li><a href="/${c.slug.toLowerCase()}/">${escapeHtml(c.title)}</a></li>`
      )
      .join('');

    return `<nav aria-label="登山入門教學章節"><ul>${itemsHtml}</ul></nav>`;
  } catch (err) {
    console.error('Error building intro links HTML:', err);
    return '';
  }
}

/**
 * 前端 SPA 獨立路由 SEO Meta 對照表
 */
const ROUTE_META_MAP: Record<string, RouteMetadata> = {
  '/': {
    title: '亞馬遜國家山岳協會 | Amazon Alpine Association',
    description: '亞馬遜國家山岳協會（Amazon Alpine Association）官方入口網站與活動行事曆，提倡全民運動、鍛鍊強健體魄、培養互助團隊精神，以及接觸大自然與山林相關知識及技能。',
  },
  '/intro': {
    title: '登山入門指南 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
    description: '專為登山新手與山友整理的登山入門指南，涵蓋高山裝備清單、行前體能鍛鍊、山林安全自保守則與無痕山林（LNT）準則，助您安全開啟山岳旅程。',
  },
  '/tools': {
    title: '登山工具與氣象服務 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
    description: '登山實用數位工具與氣象服務專區，即時整合高山氣象預報、國家公園入山入園線上申辦、步道路況通報及離線地圖軌跡等數位資源。',
  },
  '/highlights': {
    title: '活動花絮影音專區 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
    description: '亞馬遜國家山岳協會歷年登山行程精選花絮與影音專區，收錄百岳縱走記錄、山友精彩回顧、自然風光縮時與活動實況影片分享。',
  },
  '/policies': {
    title: '政策與章程條款 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
    description: '亞馬遜國家山岳協會章程、活動報名規範、費用與退費標準、山域活動安全責任守則及個人資料保護聲明，維護全體山友權益。',
  },
  '/surveys': {
    title: '問卷調查專區 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
    description: '亞馬遜國家山岳協會意見回饋與問卷調查專區，歡迎山友填寫活動滿意度調查及山岳發展建議，共同打造優質山岳社群。',
  },
};

/**
 * 找不到頁面 (404) 的 Meta 資料
 */
const NOT_FOUND_META: RouteMetadata = {
  title: '找不到此頁面 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
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
  noindex?: boolean
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

  if (rootHtml) {
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, () => `<div id="root">${rootHtml}</div>`);
  }

  return new Response(html, {
    status: targetStatus,
    statusText: targetStatusText,
    headers: response.headers,
  });
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

    if (pathname === '/sitemap.xml') {
      const now = new Date().toISOString().split('T')[0];
      const db = await loadDatabaseWorker(env);
      const enabledChapters = (db.chapters || [])
        .filter((c) => c.enabled)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const chapterUrls = enabledChapters
        .map((chap) => {
          const lastmod = chap.updatedAt || now;
          const loc = CHAPTER_SLUG_RE.test((chap.slug || '').toLowerCase())
            ? `https://amazon-hike.com/${chap.slug.toLowerCase()}/`
            : `https://amazon-hike.com/intro/${chap.slug}`;
          return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
        .join('\n');

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://amazon-hike.com/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/intro</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/tools</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/highlights</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/policies</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/surveys</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
${chapterUrls}
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
    const introMatch = trimmed.match(/^\/intro\/(chapter(?:0[1-9]|1[0-5]))$/);
    if (introMatch) {
      return Response.redirect(`https://amazon-hike.com/${introMatch[1]}/`, 301);
    }

    if (!pathname.endsWith('/')) {
      const chapterMatch = trimmed.match(/^\/(chapter(?:0[1-9]|1[0-5]))$/);
      if (chapterMatch) {
        return Response.redirect(`https://amazon-hike.com/${chapterMatch[1]}/`, 301);
      }
    }

    // 2-2. 已知路由若帶有結尾斜線（例如 /intro/、/tools/、/highlights/、/policies/、/surveys/、/admin/），301 重定向到無斜線版本
    if (pathname.length > 1 && pathname.endsWith('/')) {
      const withoutTrailing = pathname.replace(/\/+$/, '');
      if (
        withoutTrailing in ROUTE_META_MAP ||
        withoutTrailing === '/admin' ||
        withoutTrailing.startsWith('/intro/')
      ) {
        return Response.redirect(`https://amazon-hike.com${withoutTrailing}`, 301);
      }
    }

    // 3. Static Assets / SPA fallback
    // If env.ASSETS is provided (Cloudflare Workers Static Assets), delegate to it.
    if (env && env.ASSETS) {
      const normalizedPath = pathname.replace(/\/+$/, '') || '/';
      const isRoot = normalizedPath === '/' || pathname === '/index.html';
      let routeMeta = ROUTE_META_MAP[normalizedPath];

      // Dynamic chapter route matching: /intro/:slug
      let isChapterNotFound = false;
      if (!routeMeta && normalizedPath.startsWith('/intro/')) {
        const slug = normalizedPath.replace(/^\/intro\//, '').toLowerCase();
        if (slug) {
          try {
            const db = await loadDatabaseWorker(env);
            const chapter = (db.chapters || []).find((c) => c.slug.toLowerCase() === slug);
            if (chapter && chapter.enabled) {
              routeMeta = {
                title: `${chapter.title} | 亞馬遜國家山岳協會 | Amazon Alpine Association`,
                description: chapter.description || `${chapter.title} - 亞馬遜國家山岳協會登山入門教學專文。`,
              };
            } else {
              // 找不到此章節或找到但 enabled 為 false
              isChapterNotFound = true;
              routeMeta = {
                title: '找不到此章節 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
                description: '很抱歉，您所尋找的登山入門專文不存在、已下架或網址錯誤。請返回登山入門專頁瀏覽其他專題文章。',
              };
            }
          } catch (err) {
            console.error('Error resolving dynamic chapter metadata:', err);
          }
        }
      }

      // 3-1. 首頁 (/) 或 /index.html：套用首頁專屬 SEO Meta
      if (isRoot && routeMeta) {
        const indexRequest = new Request(new URL('/', request.url), request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        if (indexResponse.ok) {
          return applyRouteMeta(indexResponse, routeMeta, 'https://amazon-hike.com/');
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
        const spaRequest = new Request(new URL('/', request.url), request);
        return env.ASSETS.fetch(spaRequest);
      }

      // 3-4. SPA Fallback 客戶端已知路由（/intro, /tools, /highlights, /policies, /surveys, /intro/:slug）
      const spaRequest = new Request(new URL('/', request.url), request);
      const indexResponse = await env.ASSETS.fetch(spaRequest);

      if (routeMeta && indexResponse.ok) {
        const canonicalUrl = `https://amazon-hike.com${normalizedPath}`;
        // /intro 維持只注入章節連結、不含 <h1
        let rootHtml: string | undefined;
        if (normalizedPath === '/intro') {
          rootHtml = await buildIntroLinksHtml(env);
        } else if (!normalizedPath.startsWith('/intro/')) {
          rootHtml = buildSectionShellHtml(routeMeta.title, routeMeta.description);
        }

        return applyRouteMeta(
          indexResponse,
          routeMeta,
          canonicalUrl,
          isChapterNotFound ? 404 : undefined,
          rootHtml,
          isChapterNotFound
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
