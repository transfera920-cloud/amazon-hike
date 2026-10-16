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
