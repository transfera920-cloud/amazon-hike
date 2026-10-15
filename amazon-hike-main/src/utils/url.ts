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
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
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
