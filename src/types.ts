export interface CardLink {
  group: string; // 分類，例：國家公園（可留空）
  label: string; // 顯示文字
  url: string;   // 實際網址（前台不顯示）
}

export interface CardItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  url: string;
  badge?: string;
  links?: CardLink[]; // 有填時，點卡片會彈出連結清單（不顯示網址）
}

export interface SiteData {
  phone: string;
  lineUrl: string;
  email: string;
  siteTitle: string;
  siteSubtitle: string;
  heroLineText: string;
  sectionTitle: string;
  seoDesc: string;
  features: string[];
  aboutTitle: string;
  aboutContent: string;
  footerBannerTitle: string;
  footerBannerSub: string;
  cards: CardItem[];
  lastUpdated?: string;
}

export type ActiveModalType = 'admin' | 'calc' | 'hotel' | 'food' | 'road' | null;
