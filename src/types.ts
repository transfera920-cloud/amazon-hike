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
  /** 導讀置頂：為 true 時，顯示在 /intro 頁面最上方的導讀區塊，不再放入一般篇章卡片列表 */
  pinned?: boolean;
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
  description?: string; // 影片說明文字（後台輸入，前台顯示在影片下方）
  title?: string; // 影片標題（顯示為 H2，也會寫入影片結構化資料）
  uploadDate?: string; // 影片日期 YYYY-MM-DD（影片結構化資料必填）
  relatedUrl?: string; // 對應行程頁的站內路徑，例如 /baiyue-traverse/xiuguluan/
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

/** 首頁「內容區塊」：顯示在首頁行事曆下方，標題為 H2，內文以空白行分段，支援 [文字](網址) 連結 */
export interface HomeBlockItem {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt?: string; // YYYY-MM-DD
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
  hideFromNav?: boolean; // 不顯示在頂端按鈕列（電腦版按鈕列、手機快捷列不畫出）；改放電腦版「更多」選單與手機右上角「選單」。按鈕仍啟用，頁面、上文／下文、SEO 設定與連結照常運作
  mobileBar?: boolean; // 手機版是否直接顯示在標題下方的按鈕列（未設定時：依排序取前 5 個啟用的按鈕）
  introContent?: string; // 列表頁導讀內容（空白行分段；選填）
  footerContent?: string; // 列表頁下方說明（顯示在列表下方，空白行分段；選填）
  seoTitle?: string; // 列表頁自訂 SEO 標題（選填）
  metaDescription?: string; // 列表頁自訂 meta description（選填，建議 80–120 字）
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
  detailUrl?: string;     // 山名連結（站內網址，選填）：百岳列表的山名優先連到這裡，例如指向百岳總表的詳細頁
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
  nationalPark?: string; // 百岳總表用：所屬國家公園（選填）
  gpxUrl?: string;       // GPX 航跡檔下載網址（選填，前台顯示下載按鈕）
  gpxFileName?: string;  // GPX 下載時顯示的檔名（選填）
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
  days: ItineraryDay[];           // 保留相容性
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
  homeBlocks?: HomeBlockItem[];
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
  sourceActivityId?: string; // 標記此筆是否由行程活動的內嵌式行程自動同步產生
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
  homeBlocks?: HomeBlockItem[];
}
