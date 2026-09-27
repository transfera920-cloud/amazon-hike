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
  itinerary?: TripItinerary; // 選填的內嵌式登山行程資料
}

export type ItineraryLinkType =
  | 'mountain'    // 山岳
  | 'trailhead'   // 登山口
  | 'forestRoad'  // 林道
  | 'junction'    // 岔路
  | 'hut'         // 山屋
  | 'shed'        // 工寮
  | 'campsite'    // 營地
  | 'waterSource' // 水源
  | 'stream'      // 溪流
  | 'saddle'      // 鞍部
  | 'terrain'     // 地形
  | 'other';      // 其他

export interface ItineraryLink {
  id: string;
  name: string;              // 關聯名稱
  url?: string;               // 關聯網址（選填）
  description?: string;       // 關聯說明（選填）
  type: ItineraryLinkType;    // 關聯類型
  showOnFrontend: boolean;    // 是否在前台顯示為可點擊連結
}

export interface ItineraryTimePoint {
  id: string;
  time: string;               // 時間，例如 '08:00'
  location: string;           // 地點，例如 '11.7K 行車終點'
  description?: string;       // 說明（選填）
  sortOrder: number;          // 節點排序
  link?: ItineraryLink;       // 選填的內部關聯設定
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;              // 第幾天（顯示用，依 sortOrder 排列）
  sortOrder: number;
  estimatedHours?: number;        // 當日預估步程（小時，數字），選填
  timePoints: ItineraryTimePoint[];
}

export interface TripItinerary {
  enabled: boolean;               // 是否啟用內嵌式行程（此為區塊開關，activity 本身的 enabled 仍控制整個活動頁是否上線）
  subtitle?: string;              // 活動副標題／宣傳亮點
  startDate?: string;             // 'YYYY-MM-DD'
  endDate?: string;               // 'YYYY-MM-DD'
  daysOverride?: number;          // 手動調整的行程天數；若未設定，改由 startDate/endDate 自動計算，兩者都沒有則以 days.length 為準
  totalDistanceKm?: number;       // 預計里程（公里）
  maxElevationM?: number;         // 最高海拔（公尺）
  elevationGainM?: number;        // 累積爬升（公尺）
  elevationLossM?: number;        // 累積下降（公尺）
  difficulty?: string;            // 難度等級（自由文字，例如：入門／中級／中高／高難度）
  requiredGear?: string;          // 行前必備裝備（可多行，換行分段）
  safetyNotes?: string;           // 安全須知（可多行，換行分段）
  days: ItineraryDay[];           // Day 1 ~ Day N
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
