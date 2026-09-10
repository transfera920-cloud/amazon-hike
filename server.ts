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
// Public APIs
// ----------------------------------------------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Front-end public content
app.get('/api/public-data', (req: Request, res: Response) => {
  try {
    const data = getPublicData();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Calendar activities proxy from official system
let cachedActivities: any[] | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache

app.get('/api/calendar-activities', async (req: Request, res: Response) => {
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
});

// ----------------------------------------------------
// Admin Auth & Management APIs
// ----------------------------------------------------

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: '請輸入管理密碼' });
  }

  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_SECRET_TOKEN });
  }

  return res.status(401).json({ error: '管理員認證密碼不符' });
});

app.get('/api/admin/data', requireAdmin, (req: Request, res: Response) => {
  try {
    const db = loadDatabase();
    res.json({ success: true, data: db });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Intro Item
app.post('/api/admin/save-intro', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/save-tool', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/save-highlight', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/save-survey', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/save-survey-item', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/save-nav-button', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/reset-nav-buttons', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/save-policy', requireAdmin, (req: Request, res: Response) => {
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
app.delete('/api/admin/item/:type/:id', requireAdmin, (req: Request, res: Response) => {
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
app.post('/api/admin/delete-item', requireAdmin, (req: Request, res: Response) => {
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
    <loc>/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>/intro</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>/tools</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>/highlights</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>/policies</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`);
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
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
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
