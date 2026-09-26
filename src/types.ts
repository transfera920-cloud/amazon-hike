export interface ChapterItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage?: string;
  sortOrder: number;
  enabled: boolean;
  updatedAt: string; // ISO date string e.g. '2026-09-22'
}

export interface IntroItem {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
}

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
}

export interface HighlightItem {
  id: string;
  youtubeUrl: string;
  enabled: boolean;
  sortOrder: number;
}

export interface PolicyItem {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  sortOrder: number;
}

export interface SurveyItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  enabled: boolean;
  sortOrder: number;
}

export interface NavButtonItem {
  id: string;
  title: string;
  url: string;
  isExternal: boolean;
  enabled: boolean;
  sortOrder: number;
  categorySlug?: string; // 新增：作為 /分類/活動/ 網址中的分類代稱，留空則由系統自動推導
}

export interface NavButtonEntry {
  id: string;
  navButtonId: string; // 父按鈕 id
  title: string;
  description: string;
  url: string;
  sortOrder: number;
}

export interface NavButtonActivity {
  id: string;
  navButtonId: string;   // 父按鈕 id，代表父子關係
  slug: string;          // 在同一個 navButtonId 底下唯一
  title: string;         // 行程／活動名稱
  description: string;   // 說明
  externalUrl: string;   // 完整行程／報名的外部網址
  sortOrder: number;
  enabled: boolean;      // true = 前台顯示，false = 後台保留、前台不顯示
  content?: string;      // 完整圖文活動介紹
  coverImage?: string;   // 封面圖片網址
  gallery?: string[];    // 多張活動相簿照片
  youtubeUrl?: string;   // YouTube 介紹影片
  showYoutube?: boolean; // 是否顯示 YouTube
  showExternalUrl?: boolean; // 是否顯示報名外連按鈕
  seoTitle?: string;     // 自訂 SEO 標題
  metaDescription?: string; // 自訂 SEO 描述
  ogImage?: string;      // 自訂社群分享圖
  updatedAt?: string;    // 最後更新日期
}

export interface AssociationDatabase {
  version: number;
  surveyUrl: string;
  surveys?: SurveyItem[];
  navButtons?: NavButtonItem[];
  navButtonEntries?: NavButtonEntry[];
  navButtonActivities?: NavButtonActivity[];
  chapters?: ChapterItem[];
  intros: IntroItem[];
  tools: ToolItem[];
  highlights: HighlightItem[];
  policies: PolicyItem[];
  calendarActivities?: CalendarActivity[];
}

export interface CalendarActivity {
  id: string;
  title: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  url: string;
  days?: number;
  enabled: boolean;
  sortOrder: number;
}

export interface PublicDataResponse {
  surveyUrl: string;
  surveys?: SurveyItem[];
  navButtons?: NavButtonItem[];
  navButtonEntries?: NavButtonEntry[];
  navButtonActivities?: NavButtonActivity[];
  chapters?: ChapterItem[];
  intros: IntroItem[];
  tools: ToolItem[];
  highlights: HighlightItem[];
  policies: PolicyItem[];
  calendarActivities?: CalendarActivity[];
}
