import {
  loadDatabaseWorker,
  saveDatabaseWorker,
  formatPublicData,
  WorkerEnv
} from './db-kv.js';
import type {
  IntroItem,
  ToolItem,
  HighlightItem,
  PolicyItem,
  SurveyItem,
  NavButtonItem
} from '../src/types.js';

const ADMIN_SECRET_TOKEN = 'amazon-alpine-secure-token-2026';
const ADMIN_PASSWORD = 'yy661003';

// In-memory cache for calendar activities within Worker instance
let cachedActivities: any[] | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 60 * 1000;

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

function verifyAdmin(request: Request, env: WorkerEnv): boolean {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.substring(7);
  const expected = env.ADMIN_TOKEN || ADMIN_SECRET_TOKEN;
  return token === expected;
}

export async function handleApiRequest(
  request: Request,
  env: WorkerEnv,
  url: URL
): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = url.pathname;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // GET /api/health
  if (path === '/api/health' && method === 'GET') {
    return jsonResponse({
      status: 'ok',
      service: 'api',
      environment: 'production',
    });
  }

  // GET /api/public-data or /api/content
  if ((path === '/api/public-data' || path === '/api/content') && method === 'GET') {
    try {
      const db = await loadDatabaseWorker(env);
      const data = formatPublicData(db);
      return jsonResponse({ success: true, data });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  // GET /api/calendar-activities or /api/activities
  if ((path === '/api/calendar-activities' || path === '/api/activities') && method === 'GET') {
    const now = Date.now();
    if (cachedActivities && now - cacheTime < CACHE_DURATION_MS) {
      return jsonResponse({ success: true, source: 'cache', activities: cachedActivities });
    }

    try {
      const externalRes = await fetch('https://amazon-trail.ai.studio/api/activities', {
        headers: { Accept: 'application/json' },
      });

      if (!externalRes.ok) {
        throw new Error(`External API responded with status ${externalRes.status}`);
      }

      const json: any = await externalRes.json();
      const rawList = Array.isArray(json.activities) ? json.activities : [];

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
      return jsonResponse({ success: true, source: 'live', activities: formatted });
    } catch (err: any) {
      if (cachedActivities) {
        return jsonResponse({ success: true, source: 'stale-cache', activities: cachedActivities });
      }
      return jsonResponse(
        {
          success: false,
          error: `無法自活動中心取得最新行程資料：${err.message}`,
          activities: [],
        },
        502
      );
    }
  }

  // Admin APIs
  if (path.startsWith('/api/admin/')) {
    // POST /api/admin/login
    if (path === '/api/admin/login' && method === 'POST') {
      try {
        const body: any = await request.json();
        const pwd = body?.password;
        if (!pwd) {
          return jsonResponse({ error: '請輸入管理密碼' }, 400);
        }
        const expectedPwd = env.ADMIN_PASSWORD || ADMIN_PASSWORD;
        if (pwd === expectedPwd) {
          const token = env.ADMIN_TOKEN || ADMIN_SECRET_TOKEN;
          return jsonResponse({ success: true, token });
        }
        return jsonResponse({ error: '管理員認證密碼不符' }, 401);
      } catch {
        return jsonResponse({ error: '無效的請求內容' }, 400);
      }
    }

    // Require Auth for all other admin routes
    if (!verifyAdmin(request, env)) {
      return jsonResponse({ error: '未授權存取：請先登入後台管理系統' }, 401);
    }

    // GET /api/admin/data
    if (path === '/api/admin/data' && method === 'GET') {
      try {
        const db = await loadDatabaseWorker(env);
        return jsonResponse({ success: true, data: db });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-intro
    if (path === '/api/admin/save-intro' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: IntroItem = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '標題名稱為必填欄位' }, 400);
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
        const idx = db.intros.findIndex((i) => i.id === cleanItem.id);
        if (idx >= 0) db.intros[idx] = cleanItem;
        else db.intros.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-tool
    if (path === '/api/admin/save-tool' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: ToolItem = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '工具名稱為必填欄位' }, 400);
        }
        const cleanItem: ToolItem = {
          id: item.id || `tool_${Date.now()}`,
          title: item.title.trim(),
          description: (item.description || '').trim(),
          url: (item.url || '').trim(),
          enabled: item.enabled ?? true,
          sortOrder: Number(item.sortOrder) || 0,
        };
        const idx = db.tools.findIndex((t) => t.id === cleanItem.id);
        if (idx >= 0) db.tools[idx] = cleanItem;
        else db.tools.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-highlight
    if (path === '/api/admin/save-highlight' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: HighlightItem = await request.json();
        if (!item.youtubeUrl || !item.youtubeUrl.trim()) {
          return jsonResponse({ error: 'YouTube URL 為必填欄位' }, 400);
        }
        const cleanItem: HighlightItem = {
          id: item.id || `hl_${Date.now()}`,
          youtubeUrl: item.youtubeUrl.trim(),
          enabled: item.enabled ?? true,
          sortOrder: Number(item.sortOrder) || 0,
        };
        const idx = db.highlights.findIndex((h) => h.id === cleanItem.id);
        if (idx >= 0) db.highlights[idx] = cleanItem;
        else db.highlights.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-survey
    if (path === '/api/admin/save-survey' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const { surveyUrl }: any = await request.json();
        db.surveyUrl = (surveyUrl || '').trim();
        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, surveyUrl: db.surveyUrl });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-survey-item
    if (path === '/api/admin/save-survey-item' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: SurveyItem = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '問卷名稱為必填欄位' }, 400);
        }
        if (!item.url || !item.url.trim()) {
          return jsonResponse({ error: '問卷網址為必填欄位' }, 400);
        }
        const cleanItem: SurveyItem = {
          id: item.id || `survey_${Date.now()}`,
          title: item.title.trim(),
          url: item.url.trim(),
          description: (item.description || '').trim(),
          enabled: item.enabled ?? true,
          sortOrder: Number(item.sortOrder) || 0,
        };
        const idx = db.surveys.findIndex((s) => s.id === cleanItem.id);
        if (idx >= 0) db.surveys[idx] = cleanItem;
        else db.surveys.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-nav-button
    if (path === '/api/admin/save-nav-button' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: NavButtonItem = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '按鈕名稱為必填欄位' }, 400);
        }
        if (!item.url || !item.url.trim()) {
          return jsonResponse({ error: '連結網址為必填欄位' }, 400);
        }
        const cleanItem: NavButtonItem = {
          id: item.id || `btn_${Date.now()}`,
          title: item.title.trim(),
          url: item.url.trim(),
          isExternal: Boolean(item.isExternal),
          enabled: item.enabled ?? true,
          sortOrder: Number(item.sortOrder) || 0,
        };
        const idx = db.navButtons.findIndex((b) => b.id === cleanItem.id);
        if (idx >= 0) db.navButtons[idx] = cleanItem;
        else db.navButtons.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/reset-nav-buttons
    if (path === '/api/admin/reset-nav-buttons' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        // Reset nav buttons to default baseline
        db.navButtons = [
          { id: 'btn_calendar', title: '活動行事曆', url: '/', isExternal: false, enabled: true, sortOrder: 1 },
          { id: 'btn_recent', title: '近期活動', url: 'https://amazon-trail.ai.studio/activity/', isExternal: true, enabled: true, sortOrder: 2 },
          { id: 'btn_intro', title: '登山入門', url: '/intro', isExternal: false, enabled: true, sortOrder: 3 },
          { id: 'btn_tools', title: '登山工具', url: '/tools', isExternal: false, enabled: true, sortOrder: 4 },
          { id: 'btn_highlights', title: '活動花絮', url: '/highlights', isExternal: false, enabled: true, sortOrder: 5 },
          { id: 'btn_survey', title: '問卷調查', url: '/surveys', isExternal: false, enabled: true, sortOrder: 6 },
          { id: 'btn_policies', title: '政策與條款', url: '/policies', isExternal: false, enabled: true, sortOrder: 7 },
          { id: 'btn_routes', title: '行程總表', url: 'https://amazon-data.ai.studio/routes', isExternal: true, enabled: true, sortOrder: 8 },
        ];
        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, navButtons: db.navButtons });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-policy
    if (path === '/api/admin/save-policy' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: PolicyItem = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '條款標題為必填欄位' }, 400);
        }
        if (!item.content || !item.content.trim()) {
          return jsonResponse({ error: '條款內容為必填欄位' }, 400);
        }
        const cleanItem: PolicyItem = {
          id: item.id || `pol_${Date.now()}`,
          title: item.title.trim(),
          content: item.content.trim(),
          enabled: item.enabled ?? true,
          sortOrder: Number(item.sortOrder) || 0,
        };
        const idx = db.policies.findIndex((p) => p.id === cleanItem.id);
        if (idx >= 0) db.policies[idx] = cleanItem;
        else db.policies.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // DELETE or POST item deletion
    const isDeleteRoute =
      (method === 'DELETE' && path.startsWith('/api/admin/item/')) ||
      (method === 'POST' && path === '/api/admin/delete-item');

    if (isDeleteRoute) {
      try {
        let type = '';
        let id = '';
        if (method === 'DELETE') {
          const parts = path.replace('/api/admin/item/', '').split('/');
          type = parts[0] || '';
          id = parts[1] || '';
        } else {
          const body: any = await request.json().catch(() => ({}));
          type = body?.type;
          id = body?.id;
        }

        if (!type || !id) {
          return jsonResponse({ error: '缺少必要欄位 type 或 id' }, 400);
        }

        const db = await loadDatabaseWorker(env);
        const normType = type.toLowerCase();
        const targetId = String(id);

        if (normType === 'intro') {
          db.intros = (db.intros || []).filter((i) => String(i.id) !== targetId);
        } else if (normType === 'tool') {
          db.tools = (db.tools || []).filter((t) => String(t.id) !== targetId);
        } else if (normType === 'highlight') {
          db.highlights = (db.highlights || []).filter((h) => String(h.id) !== targetId);
        } else if (normType === 'policy') {
          db.policies = (db.policies || []).filter((p) => String(p.id) !== targetId);
        } else if (normType === 'survey') {
          db.surveys = (db.surveys || []).filter((s) => String(s.id) !== targetId);
          const first = db.surveys.find((s) => s.enabled);
          db.surveyUrl = first ? first.url : '';
        } else if (normType === 'navbutton' || normType === 'nav_button') {
          db.navButtons = (db.navButtons || []).filter((b) => String(b.id) !== targetId);
        } else {
          return jsonResponse({ error: `未知的資料類別: ${type}` }, 400);
        }

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }
  }

  // Any other /api/* route: ALWAYS JSON 404!
  return jsonResponse(
    {
      success: false,
      error: `API 端點未找到 (404 Not Found): ${method} ${path}`,
    },
    404
  );
}
