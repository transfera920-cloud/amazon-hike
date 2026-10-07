import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  loadDatabase,
  saveDatabase,
  getPublicData,
  getDefaultNavButtons,
} from './server/db.js';
import type {
  ChapterItem,
  IntroItem,
  ToolItem,
  HighlightItem,
  PolicyItem,
  SurveyItem,
  NavButtonItem,
  NavButtonEntry,
  NavButtonActivity,
  CalendarActivity,
} from './src/types.js';
import {
  RESERVED_SLUGS,
  getCategorySlug,
  isFormalChapterSlug,
  processBatchImportActivities,
} from './src/utils/activitySeo.js';
import {
  cleanTripItinerary,
  buildCalendarActivityFromItinerary,
  syncCalendarActivityWithItinerary,
  removeCalendarActivityForActivity,
  removeCalendarActivitiesForNavButton,
} from './src/utils/itineraryHelper.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Token-based authentication for Admin routes
const ADMIN_SECRET_TOKEN = process.env.ADMIN_TOKEN || 'amazon-alpine-secure-token-2026';
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
if (!ADMIN_PASSWORD) {
  console.warn('[Admin Auth] 尚未設定環境變數 ADMIN_PASSWORD，後台登入請求將被拒絕。');
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授權存取：請先登入後台管理系統' });
  }
  const token = authHeader.substring(7);
  if (token !== ADMIN_SECRET_TOKEN) {
    return res.status(403).json({ error: '權限不足或憑證已失效' });
  }
  next();
}

// ----------------------------------------------------
// API Router Setup (Strictly separates /api/* from SPA fallback)
// ----------------------------------------------------

const apiRouter = express.Router();

// Enforce Content-Type, CORS, and No-Cache for all API endpoints
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// ----------------------------------------------------
// Public APIs
// ----------------------------------------------------

apiRouter.get('/health', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({
    status: 'ok',
    service: 'api',
    environment: 'production',
  });
});

// Front-end public content (supports /public-data and /content)
const handlePublicContent = (req: Request, res: Response) => {
  try {
    const data = getPublicData();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
apiRouter.get('/public-data', handlePublicContent);
apiRouter.get('/content', handlePublicContent);

// Calendar activities from database (supports /calendar-activities and /activities)
const handleCalendarActivities = (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const list = (db.calendarActivities || [])
      .filter((a) => a.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    res.json({ success: true, source: 'db', activities: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, activities: [] });
  }
};
apiRouter.get('/calendar-activities', handleCalendarActivities);
apiRouter.get('/activities', handleCalendarActivities);

// Public Image Serving: GET/HEAD /api/images/<32-hex-id>.<ext>
apiRouter.get('/images/:filename', (req: Request, res: Response) => {
  const filename = String(req.params.filename || '');
  const imgMatch = filename.match(/^([0-9a-f]{32})\.(jpg|jpeg|png|webp|gif)$/i);
  if (!imgMatch) {
    return res.status(404).type('text/plain').send('Not Found');
  }
  const imgId = imgMatch[1].toLowerCase();
  const ext = imgMatch[2].toLowerCase();
  const extToMime: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  const filePath = path.join(uploadsDir, `${imgId}.${ext}`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).type('text/plain').send('Not Found');
  }
  try {
    const buf = fs.readFileSync(filePath);
    res.removeHeader('Pragma');
    res.removeHeader('Expires');
    res.setHeader('Content-Type', extToMime[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }
    return res.status(200).end(buf);
  } catch {
    return res.status(404).type('text/plain').send('Not Found');
  }
});

// ----------------------------------------------------
// Admin Auth & Management APIs
// ----------------------------------------------------

apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: '請輸入管理密碼' });
  }

  const expectedPwd = (process.env.ADMIN_PASSWORD || '').trim();
  if (!expectedPwd) {
    console.warn('[Admin Auth] 尚未設定環境變數 ADMIN_PASSWORD，拒絕後台登入請求。');
    return res.status(500).json({ error: '系統尚未設定後台管理密碼 (ADMIN_PASSWORD)，請先設定環境變數' });
  }

  if (password === expectedPwd) {
    return res.json({ success: true, token: ADMIN_SECRET_TOKEN });
  }

  return res.status(401).json({ error: '管理員認證密碼不符' });
});

apiRouter.post(
  '/admin/upload-image',
  requireAdmin,
  express.raw({ type: '*/*', limit: '6mb' }),
  (req: Request, res: Response) => {
    try {
      const rawContentType = String(req.headers['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      const ext = mimeToExt[rawContentType];
      if (!ext) {
        return res.status(400).json({ error: '僅支援上傳 JPG、PNG、WebP 或 GIF 圖片格式（不支援 SVG）' });
      }

      const maxBytes = 5 * 1024 * 1024;
      const contentLengthHeader = req.headers['content-length'];
      if (contentLengthHeader && Number(contentLengthHeader) > maxBytes) {
        return res.status(413).json({ error: '圖片檔案大小不得超過 5MB' });
      }

      const buf = Buffer.isBuffer(req.body) ? req.body : null;
      if (!buf || buf.length === 0) {
        return res.status(400).json({ error: '上傳的圖片內容為空' });
      }
      if (buf.length > maxBytes) {
        return res.status(413).json({ error: '圖片檔案大小不得超過 5MB' });
      }

      const id = crypto.randomBytes(16).toString('hex');
      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, `${id}.${ext}`), buf);

      const protocol = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol || 'http';
      const host = req.get('host') || `localhost:${PORT}`;
      const origin = `${protocol}://${host}`;

      return res.json({
        success: true,
        url: `${origin}/api/images/${id}.${ext}`,
        size: buf.length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || '圖片上傳失敗' });
    }
  }
);

apiRouter.get('/admin/data', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    res.json({ success: true, data: db });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Chapter Item
apiRouter.post('/admin/save-chapter', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: ChapterItem = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '章節標題為必填欄位' });
    }
    if (!item.slug || !item.slug.trim()) {
      return res.status(400).json({ error: '網址代稱 (slug) 為必填欄位' });
    }

    const rawSlug = item.slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    const cleanSlug = rawSlug.replace(/[^a-z0-9-_]/g, '') || `chapter_${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    if (!Array.isArray(db.chapters)) {
      db.chapters = [];
    }

    const cleanTitle = item.title.trim();
    const cleanDescription = (item.description || '').trim();
    const cleanContent = (item.content || '').trim();
    const cleanCoverImage = (item.coverImage || '').trim() || undefined;
    const cleanEnabled = item.enabled ?? true;
    const cleanSortOrder = Number(item.sortOrder) || 0;
    const chapterId = item.id || `chap_${Date.now()}`;

    const existingChapter = db.chapters.find((c) => c.id === chapterId);

    let finalUpdatedAt: string;
    if (!existingChapter) {
      // 新增章節：設為今天日期
      finalUpdatedAt = todayStr;
    } else {
      // 編輯現有章節：檢查 title、description、content、coverImage 任一欄位是否與現有值不同
      const isContentModified =
        existingChapter.title !== cleanTitle ||
        (existingChapter.description || '') !== cleanDescription ||
        (existingChapter.content || '') !== cleanContent ||
        (existingChapter.coverImage || undefined) !== cleanCoverImage;

      if (isContentModified) {
        // 內容有變更，一律覆寫為今天的日期
        finalUpdatedAt = todayStr;
      } else {
        // 內容無變更（例如僅調整排序或開關啟用狀態），保留原先的 updatedAt
        finalUpdatedAt = existingChapter.updatedAt || todayStr;
      }
    }

    const cleanItem: ChapterItem = {
      id: chapterId,
      slug: cleanSlug,
      title: cleanTitle,
      description: cleanDescription,
      content: cleanContent,
      coverImage: cleanCoverImage,
      enabled: cleanEnabled,
      sortOrder: cleanSortOrder,
      updatedAt: finalUpdatedAt,
    };

    const existingIndex = db.chapters.findIndex((c) => c.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.chapters[existingIndex] = cleanItem;
    } else {
      db.chapters.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Intro Item
apiRouter.post('/admin/save-intro', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: IntroItem = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '標題名稱為必填欄位' });
    }

    const cleanItem: IntroItem = {
      id: item.id || `intro_${Date.now()}`,
      title: item.title.trim(),
      description: (item.description || '').trim(),
      content: (item.content || '').trim(),
      url: (item.url || '').trim(),
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
      pinned: item.pinned === true,
    };

    const existingIndex = db.intros.findIndex((i) => i.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.intros[existingIndex] = cleanItem;
    } else {
      db.intros.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Tool Item
apiRouter.post('/admin/save-tool', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: ToolItem = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '工具名稱為必填欄位' });
    }

    const cleanItem: ToolItem = {
      id: item.id || `tool_${Date.now()}`,
      title: item.title.trim(),
      description: (item.description || '').trim(),
      url: (item.url || '').trim(),
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
    };

    const existingIndex = db.tools.findIndex((t) => t.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.tools[existingIndex] = cleanItem;
    } else {
      db.tools.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Highlight Item (YouTube URL)
apiRouter.post('/admin/save-highlight', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: HighlightItem = req.body;

    if (!item.youtubeUrl || !item.youtubeUrl.trim()) {
      return res.status(400).json({ error: 'YouTube URL 為必填欄位' });
    }

    const cleanItem: HighlightItem = {
      id: item.id || `hl_${Date.now()}`,
      youtubeUrl: item.youtubeUrl.trim(),
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
    };

    const existingIndex = db.highlights.findIndex((h) => h.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.highlights[existingIndex] = cleanItem;
    } else {
      db.highlights.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Survey URL
apiRouter.post('/admin/save-survey', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const { surveyUrl } = req.body;
    db.surveyUrl = (surveyUrl || '').trim();
    saveDatabase(db);
    res.json({ success: true, surveyUrl: db.surveyUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Individual Survey Item (Add / Edit)
apiRouter.post('/admin/save-survey-item', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: SurveyItem = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '問卷名稱為必填欄位' });
    }
    if (!item.url || !item.url.trim()) {
      return res.status(400).json({ error: '問卷網址為必填欄位' });
    }

    const cleanItem: SurveyItem = {
      id: item.id || `survey_${Date.now()}`,
      title: item.title.trim(),
      url: item.url.trim(),
      description: (item.description || '').trim(),
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
    };

    if (!Array.isArray(db.surveys)) {
      db.surveys = [];
    }

    const existingIndex = db.surveys.findIndex((s) => s.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.surveys[existingIndex] = cleanItem;
    } else {
      db.surveys.push(cleanItem);
    }

    // Keep primary surveyUrl in sync
    const firstEnabled = db.surveys.find((s) => s.enabled);
    if (firstEnabled) {
      db.surveyUrl = firstEnabled.url;
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Nav Button (Add / Edit)
apiRouter.post('/admin/save-nav-button', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: NavButtonItem = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '按鈕名稱為必填欄位' });
    }

    const cleanCatSlug = (item.categorySlug || '').trim().toLowerCase();
    if (cleanCatSlug) {
      if (RESERVED_SLUGS.has(cleanCatSlug) || isFormalChapterSlug(cleanCatSlug)) {
        return res.status(400).json({ error: '此代稱與系統既有路徑衝突，請更換' });
      }
    }

    if (!Array.isArray(db.navButtons)) {
      db.navButtons = [];
    }

    const effectiveCatSlug = getCategorySlug({
      id: item.id || 'new',
      title: item.title.trim(),
      categorySlug: cleanCatSlug || undefined,
    });

    const isDuplicateCat = db.navButtons.some(
      (b) => b.id !== item.id && getCategorySlug(b) === effectiveCatSlug
    );
    if (isDuplicateCat) {
      return res.status(400).json({ error: '此分類網址代稱已被其他按鈕使用，請更換' });
    }

    const cleanItem: NavButtonItem = {
      id: item.id || `btn_${Date.now()}`,
      title: item.title.trim(),
      url: (item.url || '').trim(),
      isExternal: Boolean(item.isExternal),
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
      categorySlug: cleanCatSlug || undefined,
      introContent: (item.introContent || '').trim().slice(0, 3000) || undefined,
    };

    const existingIndex = db.navButtons.findIndex((b) => b.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.navButtons[existingIndex] = cleanItem;
    } else {
      db.navButtons.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Nav Button Entry (Add / Edit)
apiRouter.post('/admin/save-nav-button-entry', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: NavButtonEntry = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '項目名稱為必填欄位' });
    }
    if (!item.url || !item.url.trim()) {
      return res.status(400).json({ error: '連結網址為必填欄位' });
    }
    if (!item.navButtonId || !item.navButtonId.trim()) {
      return res.status(400).json({ error: '所屬按鈕為必填欄位' });
    }

    const cleanItem: NavButtonEntry = {
      id: item.id || `entry_${Date.now()}`,
      navButtonId: item.navButtonId.trim(),
      title: item.title.trim(),
      description: (item.description || '').trim(),
      url: item.url.trim(),
      sortOrder: Number(item.sortOrder) || 0,
    };

    if (!Array.isArray(db.navButtonEntries)) {
      db.navButtonEntries = [];
    }

    const existingIndex = db.navButtonEntries.findIndex((e) => e.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.navButtonEntries[existingIndex] = cleanItem;
    } else {
      db.navButtonEntries.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Nav Button Activity (Add / Edit)
apiRouter.post('/admin/save-nav-button-activity', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: NavButtonActivity = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '行程／活動名稱為必填欄位' });
    }
    if (!item.navButtonId || !item.navButtonId.trim()) {
      return res.status(400).json({ error: '所屬按鈕為必填欄位' });
    }
    if (!item.slug || !item.slug.trim()) {
      return res.status(400).json({ error: '主站內部路徑為必填欄位' });
    }

    const rawSlug = item.slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    const cleanSlug = rawSlug.replace(/[^a-z0-9-_]/g, '') || `activity_${Date.now()}`;

    if (!Array.isArray(db.navButtonActivities)) {
      db.navButtonActivities = [];
    }

    const isDuplicateSlug = db.navButtonActivities.some(
      (a) =>
        a.id !== item.id &&
        a.navButtonId === item.navButtonId.trim() &&
        a.slug.toLowerCase() === cleanSlug
    );
    if (isDuplicateSlug) {
      return res.status(400).json({ error: '同一個分類底下已有相同代稱（slug）的活動，請更換' });
    }

    const cleanItem: NavButtonActivity = {
      id: item.id || `act_${Date.now()}`,
      navButtonId: item.navButtonId.trim(),
      slug: cleanSlug,
      title: item.title.trim(),
      description: (item.description || '').trim(),
      externalUrl: (item.externalUrl || '').trim(),
      sortOrder: Number(item.sortOrder) || 0,
      enabled: item.enabled ?? true,
      content: (item.content || '').trim() || undefined,
      coverImage: (item.coverImage || '').trim() || undefined,
      gallery: Array.isArray(item.gallery) ? item.gallery.map((g) => String(g).trim()).filter(Boolean) : undefined,
      youtubeUrl: (item.youtubeUrl || '').trim() || undefined,
      showYoutube: item.showYoutube ?? undefined,
      showExternalUrl: item.showExternalUrl ?? undefined,
      seoTitle: (item.seoTitle || '').trim() || undefined,
      metaDescription: (item.metaDescription || '').trim() || undefined,
      ogImage: (item.ogImage || '').trim() || undefined,
      nationalPark: (item.nationalPark || '').trim() || undefined,
      updatedAt: new Date().toISOString().split('T')[0],
      itinerary: item.itinerary ? cleanTripItinerary(item.itinerary) : undefined,
    };

    const existingIndex = db.navButtonActivities.findIndex((a) => a.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.navButtonActivities[existingIndex] = cleanItem;
    } else {
      db.navButtonActivities.push(cleanItem);
    }

    syncCalendarActivityWithItinerary(db, cleanItem);

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch Import Nav Button Activities
apiRouter.post('/admin/import-nav-button-activities', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const body = req.body;
    const navButtonId = String(body?.navButtonId || '').trim();
    const items = Array.isArray(body?.items)
      ? body.items
      : Array.isArray(body?.peaks)
      ? body.peaks
      : null;

    if (!navButtonId) {
      return res.status(400).json({ error: '所屬按鈕為必填欄位' });
    }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: '請提供有效的匯入陣列 (items)' });
    }

    if (!Array.isArray(db.navButtonActivities)) {
      db.navButtonActivities = [];
    }

    const result = processBatchImportActivities(db.navButtonActivities, navButtonId, items, true);
    saveDatabase(db);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Nav Buttons to default 8
apiRouter.post('/admin/reset-nav-buttons', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    db.navButtons = getDefaultNavButtons();
    saveDatabase(db);
    res.json({ success: true, navButtons: db.navButtons });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Policy Item
apiRouter.post('/admin/save-policy', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: PolicyItem = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '標題為必填欄位' });
    }

    const cleanItem: PolicyItem = {
      id: item.id || `pol_${Date.now()}`,
      title: item.title.trim(),
      content: (item.content || '').trim(),
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
    };

    const existingIndex = db.policies.findIndex((p) => p.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.policies[existingIndex] = cleanItem;
    } else {
      db.policies.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Calendar Activity (Add / Edit)
apiRouter.post('/admin/save-calendar-activity', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    const item: CalendarActivity = req.body;

    if (!item.title || !item.title.trim()) {
      return res.status(400).json({ error: '活動名稱為必填欄位' });
    }
    if (!item.startDate || !item.startDate.trim()) {
      return res.status(400).json({ error: '開始日期為必填欄位' });
    }
    if (!item.url || !item.url.trim()) {
      return res.status(400).json({ error: '活動超連結為必填欄位' });
    }

    const startDate = item.startDate.trim();
    const endDate = (item.endDate && item.endDate.trim()) ? item.endDate.trim() : startDate;

    let days = item.days;
    if (!days && startDate && endDate) {
      const d1 = new Date(startDate).getTime();
      const d2 = new Date(endDate).getTime();
      if (!isNaN(d1) && !isNaN(d2)) {
        days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
      }
    }

    const cleanItem: CalendarActivity = {
      id: item.id || `cal_${Date.now()}`,
      title: item.title.trim(),
      startDate,
      endDate,
      url: item.url.trim(),
      days: days || 1,
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
    };

    if (!Array.isArray(db.calendarActivities)) {
      db.calendarActivities = [];
    }

    const existingIndex = db.calendarActivities.findIndex((a) => a.id === cleanItem.id);
    if (existingIndex >= 0) {
      db.calendarActivities[existingIndex] = cleanItem;
    } else {
      db.calendarActivities.push(cleanItem);
    }

    saveDatabase(db);
    res.json({ success: true, item: cleanItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reusable delete logic
function executeDeleteItem(type: string, id: string): { success: boolean; error?: string } {
  const db = loadDatabase();
  const normalizedType = (type || '').toLowerCase();
  const targetId = String(id);

  if (normalizedType === 'chapter') {
    db.chapters = (db.chapters || []).filter((c) => String(c.id) !== targetId);
  } else if (normalizedType === 'intro') {
    db.intros = (db.intros || []).filter((i) => String(i.id) !== targetId);
  } else if (normalizedType === 'tool') {
    db.tools = (db.tools || []).filter((t) => String(t.id) !== targetId);
  } else if (normalizedType === 'highlight') {
    db.highlights = (db.highlights || []).filter((h) => String(h.id) !== targetId);
  } else if (normalizedType === 'policy') {
    db.policies = (db.policies || []).filter((p) => String(p.id) !== targetId);
  } else if (normalizedType === 'survey') {
    db.surveys = (db.surveys || []).filter((s) => String(s.id) !== targetId);
    const firstEnabled = db.surveys.find((s) => s.enabled);
    db.surveyUrl = firstEnabled ? firstEnabled.url : '';
  } else if (normalizedType === 'navbutton' || normalizedType === 'nav_button') {
    removeCalendarActivitiesForNavButton(db, targetId);
    db.navButtons = (db.navButtons || []).filter((b) => String(b.id) !== targetId);
    db.navButtonActivities = (db.navButtonActivities || []).filter((a) => String(a.navButtonId) !== targetId);
  } else if (
    normalizedType === 'navbuttonentry' ||
    normalizedType === 'nav_button_entry' ||
    normalizedType === 'navbuttonentries'
  ) {
    db.navButtonEntries = (db.navButtonEntries || []).filter((e) => String(e.id) !== targetId);
  } else if (
    normalizedType === 'navbuttonactivity' ||
    normalizedType === 'nav_button_activity' ||
    normalizedType === 'navbuttonactivities'
  ) {
    removeCalendarActivityForActivity(db, targetId);
    db.navButtonActivities = (db.navButtonActivities || []).filter((a) => String(a.id) !== targetId);
  } else if (
    normalizedType === 'calendaractivity' ||
    normalizedType === 'calendar_activity' ||
    normalizedType === 'calendaractivities'
  ) {
    db.calendarActivities = (db.calendarActivities || []).filter((a) => String(a.id) !== targetId);
  } else {
    return { success: false, error: `未知的資料類別: ${type}` };
  }

  saveDatabase(db);
  return { success: true };
}

// Delete Item (DELETE method)
apiRouter.delete('/admin/item/:type/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    const result = executeDeleteItem(type, id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Item (POST method fallback)
apiRouter.post('/admin/delete-item', requireAdmin, (req: Request, res: Response) => {
  try {
    const { type, id } = req.body;
    if (!type || !id) {
      return res.status(400).json({ error: '缺少必要欄位 type 或 id' });
    }
    const result = executeDeleteItem(type, id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for unknown /api/* routes: ALWAYS returns JSON 404, NEVER HTML!
apiRouter.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API 端點未找到 (404 Not Found): ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Mount the API router
app.use('/api', apiRouter);

// Hard barrier: Ensure NO /api/* request can EVER slip through to static files or SPA fallback
app.all(['/api', '/api/*'], (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API 路由未找到 (404 Not Found): ${req.method} ${req.originalUrl || req.url}`,
  });
});

// ----------------------------------------------------
// SEO Endpoints: robots.txt and sitemap.xml
// ----------------------------------------------------

app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://amazon-hike.com/sitemap.xml
`);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.type('application/xml');
  const now = new Date().toISOString().split('T')[0];
  const db = loadDatabase();
  const CHAPTER_SLUG_RE = /^chapter(0[1-9]|1[0-5])$/;
  const enabledChapters = (db.chapters || [])
    .filter((c) => c.enabled)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const chapterUrls = enabledChapters
    .map((chap) => {
      const lastmod = chap.updatedAt || now;
      const loc = CHAPTER_SLUG_RE.test((chap.slug || '').toLowerCase())
        ? `https://amazon-hike.com/${chap.slug.toLowerCase()}/`
        : `https://amazon-hike.com/intro/${chap.slug}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const enabledActivities = (db.navButtonActivities || [])
    .filter((a) => a.enabled)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const activityUrls = enabledActivities
    .map((act) => {
      const parentBtn = (db.navButtons || []).find((b) => b.id === act.navButtonId);
      const catSlug = parentBtn ? getCategorySlug(parentBtn) : 'activity';
      const lastmod = act.updatedAt || now;
      return `  <url>
    <loc>https://amazon-hike.com/${catSlug}/${act.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const navButtonsWithActivities = (db.navButtons || []).filter(
    (b) => b.enabled && (db.navButtonActivities || []).some((a) => a.navButtonId === b.id && a.enabled)
  );
  const navUrls = navButtonsWithActivities
    .map(
      (btn) => `  <url>
    <loc>https://amazon-hike.com/nav/${btn.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://amazon-hike.com/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/intro</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/tools</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/highlights</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/policies</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://amazon-hike.com/surveys</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
${chapterUrls}
${navUrls}
${activityUrls}
</urlset>`);
});

// ----------------------------------------------------
// Global Error Handler for API
// ----------------------------------------------------

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (req.path?.startsWith('/api') || req.originalUrl?.startsWith('/api')) {
    console.error('API Uncaught Error:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || '伺服器內部錯誤 (Internal Server Error)',
    });
  }
  next(err);
});

// ----------------------------------------------------
// Vite Middleware / Static Production Serving
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // In dev mode, guard against Vite SPA fallback catching any /api requests
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path === '/api') {
        return res.status(404).json({
          success: false,
          error: `API 端點未找到: ${req.method} ${req.originalUrl}`,
        });
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Production SPA fallback: ONLY serve index.html for non-API routes!
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/') || req.path === '/api') {
        return res.status(404).json({
          success: false,
          error: `API 端點未找到: ${req.method} ${req.originalUrl}`,
        });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
