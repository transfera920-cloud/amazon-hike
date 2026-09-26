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
    'https://amazon-hike.com/og-image.jpg';

  return { title, description, image };
}
