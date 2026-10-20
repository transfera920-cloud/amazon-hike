/**
 * 依山名對應「亞馬遜高山接駁」(transfer.amazon-hike.com) 已有的登山口接駁頁。
 * 只在確定有對應頁面時才回傳，沒有對應就回傳 null（不硬塞連結）。
 */
export interface TransferLink {
  label: string;
  url: string;
}

const BASE = 'https://transfer.amazon-hike.com';

const RULES: Array<{ test: RegExp; label: string; path: string }> = [
  { test: /大霸/, label: '大霸尖山登山口接駁', path: '/dabajianshan/' },
  { test: /郡大/, label: '郡大山登山口接駁', path: '/jundashan/' },
  { test: /嘉明湖|向陽|三叉/, label: '嘉明湖登山口接駁', path: '/jiaminghu/' },
  { test: /合歡|石門|小奇萊/, label: '合歡山登山口接駁', path: '/hehuanshan/' },
  { test: /奇萊|南華|能高/, label: '奇萊南華登山口接駁', path: '/qilai-nanhua/' },
  { test: /(^|[^大])雪山|武陵|桃山|池有|品田|喀拉業/, label: '雪山登山口接駁', path: '/xueshan/' },
  { test: /玉山|塔塔加|麟趾|鹿林/, label: '玉山登山口接駁', path: '/yushan/' },
];

export function findTransferLink(title: string | undefined | null): TransferLink | null {
  const text = (title || '').trim();
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.test.test(text)) return { label: rule.label, url: `${BASE}${rule.path}` };
  }
  return null;
}
