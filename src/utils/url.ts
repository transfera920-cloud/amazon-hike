/**
 * Normalizes a URL:
 * - If already starts with http:// or https://, keep unchanged.
 * - Otherwise prepend https://
 * - Avoid double https://
 */
export function normalizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  // 已是完整網址，或是站內相對路徑（例如 /tool01/），都保持原樣
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * 工具網址正規化：
 * - 去掉誤填在結尾的 *（例如把 Cloudflare 路由 /tool17* 貼成網址）
 * - 本站的 /toolNN 一律補成 /toolNN/（與各子專案的 canonical、sitemap 一致，避免 /toolNN 與 /toolNN/ 重複）
 * - 其他網址（外部連結、子網域）維持原樣
 */
export function normalizeToolUrl(url: string | undefined | null): string {
  const bare = (url || '').trim().replace(/\*+$/, '');
  if (/^tool\d+\/?$/i.test(bare)) return `/${bare.replace(/\/$/, '').toLowerCase()}/`;
  const u = normalizeUrl(url).replace(/\*+$/, '');
  if (!u) return '';
  let pathname: string | null = null;
  if (u.startsWith('/')) {
    pathname = u;
  } else {
    try {
      const parsed = new URL(u);
      if (/^(www\.)?amazon-hike\.com$/i.test(parsed.hostname)) pathname = parsed.pathname;
    } catch {
      // ignore
    }
  }
  if (pathname) {
    const m = pathname.match(/^\/(tool\d+)\/?$/i);
    if (m) return `/${m[1].toLowerCase()}/`;
  }
  return u;
}

/**
 * 判斷網址是否屬於本站（相對路徑，或 amazon-hike.com / www.amazon-hike.com）。
 * 子網域（price.、road.、transfer. 等）視為外部網址。
 */
export function isInternalUrl(url: string | undefined | null): boolean {
  const u = normalizeUrl(url);
  if (!u) return false;
  if (u.startsWith('/')) return true;
  try {
    const host = new URL(u).hostname.toLowerCase();
    return host === 'amazon-hike.com' || host === 'www.amazon-hike.com';
  } catch {
    return false;
  }
}

/**
 * Extracts YouTube embed URL or video ID from various YouTube URL formats
 */
export function getYouTubeVideoId(url: string | undefined | null): string | null {
  if (!url) return null;
  const str = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = str.match(regExp);
  return match ? match[1] : null;
}
