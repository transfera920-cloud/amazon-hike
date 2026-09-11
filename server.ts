import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  loadDatabase,
  saveDatabase,
  getPublicData,
  getDefaultNavButtons,
} from './server/db.js';
import type {
  IntroItem,
  ToolItem,
  HighlightItem,
  PolicyItem,
  SurveyItem,
  NavButtonItem,
} from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Token-based authentication for Admin routes
const ADMIN_SECRET_TOKEN = process.env.ADMIN_TOKEN || 'amazon-alpine-secure-token-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yy661003';

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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
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

// Calendar activities proxy from official system (supports /calendar-activities and /activities)
let cachedActivities: any[] | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache

const handleCalendarActivities = async (req: Request, res: Response) => {
  const now = Date.now();
  if (cachedActivities && now - cacheTime < CACHE_DURATION_MS) {
    return res.json({ success: true, source: 'cache', activities: cachedActivities });
  }

  try {
    const response = await fetch('https://amazon-trail.ai.studio/api/activities', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`);
    }

    const json = await response.json();
    const rawList = Array.isArray(json.activities) ? json.activities : [];

    // Filter only activities that have valid start date
    const formatted = rawList
      .filter((a: any) => a && a.startDate && a.startDate.trim() !== '')
      .map((a: any) => ({
        id: String(a.id || Math.random()),
        title: String(a.title || '登山行程').trim(),
        startDate: String(a.startDate).trim(),
        endDate: String(a.endDate || a.startDate).trim(),
        url: a.url || a.link || 'https://amazon-trail.ai.studio/activity/',
      }));

    cachedActivities = formatted;
    cacheTime = now;

    res.json({ success: true, source: 'live', activities: formatted });
  } catch (err: any) {
    if (cachedActivities) {
      return res.json({ success: true, source: 'stale-cache', activities: cachedActivities });
    }
    // As instructed: if API truly fails, report genuine error, no fake mock data!
    res.status(502).json({
      success: false,
      error: `無法自活動中心取得最新行程資料：${err.message}`,
      activities: [],
    });
  }
};
apiRouter.get('/calendar-activities', handleCalendarActivities);
apiRouter.get('/activities', handleCalendarActivities);

// ----------------------------------------------------
// Admin Auth & Management APIs
// ----------------------------------------------------

apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: '請輸入管理密碼' });
  }

  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_SECRET_TOKEN });
  }

  return res.status(401).json({ error: '管理員認證密碼不符' });
});

apiRouter.get('/admin/data', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    res.json({ success: true, data: db });
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
    if (!item.url || !item.url.trim()) {
      return res.status(400).json({ error: '按鈕連結網址或路徑為必填欄位' });
    }

    const cleanItem: NavButtonItem = {
      id: item.id || `btn_${Date.now()}`,
      title: item.title.trim(),
      url: item.url.trim(),
      isExternal: Boolean(item.isExternal),
      enabled: item.enabled ?? true,
      sortOrder: Number(item.sortOrder) || 0,
    };

    if (!Array.isArray(db.navButtons)) {
      db.navButtons = [];
    }

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

// Reusable delete logic
function executeDeleteItem(type: string, id: string): { success: boolean; error?: string } {
  const db = loadDatabase();
  const normalizedType = (type || '').toLowerCase();
  const targetId = String(id);

  if (normalizedType === 'intro') {
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
    db.navButtons = (db.navButtons || []).filter((b) => String(b.id) !== targetId);
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
Sitemap: /sitemap.xml
`);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.type('application/xml');
  const now = new Date().toISOString().split('T')[0];
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
