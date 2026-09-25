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
  slug: string;          // 全站唯一的內部路徑代稱，例如 "biyang-trail"
  title: string;         // 行程／活動名稱
  description: string;   // 說明
  externalUrl: string;   // 完整行程／報名的外部網址
  sortOrder: number;
  enabled: boolean;      // true = 前台顯示，false = 後台保留、前台不顯示
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
}

export interface CalendarActivity {
  id: string;
  title: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  url: string;
  days?: number;
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
}
