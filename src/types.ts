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

export interface AssociationDatabase {
  version: number;
  surveyUrl: string;
  surveys?: SurveyItem[];
  navButtons?: NavButtonItem[];
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
  chapters?: ChapterItem[];
  intros: IntroItem[];
  tools: ToolItem[];
  highlights: HighlightItem[];
  policies: PolicyItem[];
}
