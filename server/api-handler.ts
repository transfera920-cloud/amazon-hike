import {
  loadDatabaseWorker,
  saveDatabaseWorker,
  formatPublicData,
  WorkerEnv
} from './db-kv.js';
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
  CalendarActivity
} from '../src/types.js';
import { RESERVED_SLUGS, getCategorySlug } from '../src/utils/activitySeo.js';

const ADMIN_SECRET_TOKEN = 'amazon-alpine-secure-token-2026';
const ADMIN_PASSWORD = 'yy661003';

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
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
    try {
      const db = await loadDatabaseWorker(env);
      const list = (db.calendarActivities || [])
        .filter((a) => a.enabled)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      return jsonResponse({ success: true, source: 'db', activities: list });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message, activities: [] }, 500);
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

    // POST /api/admin/save-chapter
    if (path === '/api/admin/save-chapter' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: ChapterItem = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '章節標題為必填欄位' }, 400);
        }
        if (!item.slug || !item.slug.trim()) {
          return jsonResponse({ error: '網址代稱 (slug) 為必填欄位' }, 400);
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

        const idx = db.chapters.findIndex((c) => c.id === cleanItem.id);
        if (idx >= 0) db.chapters[idx] = cleanItem;
        else db.chapters.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
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

    // POST /api/admin/save-calendar-activity
    if (path === '/api/admin/save-calendar-activity' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: CalendarActivity = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '活動名稱為必填欄位' }, 400);
        }
        if (!item.startDate || !item.startDate.trim()) {
          return jsonResponse({ error: '開始日期為必填欄位' }, 400);
        }
        const sDate = item.startDate.trim();
        const eDate = (item.endDate || '').trim() || sDate;

        let days = item.days;
        if (!days && sDate && eDate) {
          const d1 = new Date(sDate).getTime();
          const d2 = new Date(eDate).getTime();
          if (!isNaN(d1) && !isNaN(d2)) {
            days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
          }
        }

        const cleanItem: CalendarActivity = {
          id: item.id || `cal_${Date.now()}`,
          title: item.title.trim(),
          startDate: sDate,
          endDate: eDate,
          url: (item.url || '').trim(),
          days: days || 1,
          enabled: item.enabled ?? true,
          sortOrder: Number(item.sortOrder) || 0,
        };

        if (!Array.isArray(db.calendarActivities)) {
          db.calendarActivities = [];
        }

        const idx = db.calendarActivities.findIndex((a) => a.id === cleanItem.id);
        if (idx >= 0) db.calendarActivities[idx] = cleanItem;
        else db.calendarActivities.push(cleanItem);

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

        const cleanCatSlug = (item.categorySlug || '').trim().toLowerCase();
        if (cleanCatSlug) {
          if (RESERVED_SLUGS.has(cleanCatSlug) || /^chapter(0[1-9]|1[0-5])$/i.test(cleanCatSlug)) {
            return jsonResponse({ error: '此代稱與系統既有路徑衝突，請更換' }, 400);
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
          return jsonResponse({ error: '此分類網址代稱已被其他按鈕使用，請更換' }, 400);
        }

        const cleanItem: NavButtonItem = {
          id: item.id || `btn_${Date.now()}`,
          title: item.title.trim(),
          url: (item.url || '').trim(),
          isExternal: Boolean(item.isExternal),
          enabled: item.enabled ?? true,
          sortOrder: Number(item.sortOrder) || 0,
          categorySlug: cleanCatSlug || undefined,
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

    // POST /api/admin/save-nav-button-entry
    if (path === '/api/admin/save-nav-button-entry' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: NavButtonEntry = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '項目標題為必填欄位' }, 400);
        }
        if (!item.url || !item.url.trim()) {
          return jsonResponse({ error: '連結網址為必填欄位' }, 400);
        }
        if (!item.navButtonId || !item.navButtonId.trim()) {
          return jsonResponse({ error: '所屬按鈕為必填欄位' }, 400);
        }

        if (!Array.isArray(db.navButtonEntries)) {
          db.navButtonEntries = [];
        }

        const cleanItem: NavButtonEntry = {
          id: item.id || `entry_${Date.now()}`,
          navButtonId: item.navButtonId.trim(),
          title: item.title.trim(),
          description: (item.description || '').trim(),
          url: item.url.trim(),
          sortOrder: Number(item.sortOrder) || 0,
        };

        const idx = db.navButtonEntries.findIndex((e) => e.id === cleanItem.id);
        if (idx >= 0) db.navButtonEntries[idx] = cleanItem;
        else db.navButtonEntries.push(cleanItem);

        await saveDatabaseWorker(db, env);
        return jsonResponse({ success: true, item: cleanItem });
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // POST /api/admin/save-nav-button-activity
    if (path === '/api/admin/save-nav-button-activity' && method === 'POST') {
      try {
        const db = await loadDatabaseWorker(env);
        const item: NavButtonActivity = await request.json();
        if (!item.title || !item.title.trim()) {
          return jsonResponse({ error: '行程／活動名稱為必填欄位' }, 400);
        }
        if (!item.navButtonId || !item.navButtonId.trim()) {
          return jsonResponse({ error: '所屬按鈕為必填欄位' }, 400);
        }
        if (!item.slug || !item.slug.trim()) {
          return jsonResponse({ error: '主站內部路徑為必填欄位' }, 400);
        }
        if (!item.externalUrl || !item.externalUrl.trim()) {
          return jsonResponse({ error: '完整行程／報名網址為必填欄位' }, 400);
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
          return jsonResponse({ error: '同一個分類底下已有相同代稱（slug）的活動，請更換' }, 400);
        }

        const cleanItem: NavButtonActivity = {
          id: item.id || `act_${Date.now()}`,
          navButtonId: item.navButtonId.trim(),
          slug: cleanSlug,
          title: item.title.trim(),
          description: (item.description || '').trim(),
          externalUrl: item.externalUrl.trim(),
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
          updatedAt: new Date().toISOString().split('T')[0],
        };

        const idx = db.navButtonActivities.findIndex((a) => a.id === cleanItem.id);
        if (idx >= 0) db.navButtonActivities[idx] = cleanItem;
        else db.navButtonActivities.push(cleanItem);

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

        if (normType === 'chapter') {
          db.chapters = (db.chapters || []).filter((c) => String(c.id) !== targetId);
        } else if (normType === 'intro') {
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
          db.navButtonActivities = (db.navButtonActivities || []).filter((a) => String(a.navButtonId) !== targetId);
        } else if (
          normType === 'navbuttonentry' ||
          normType === 'nav_button_entry' ||
          normType === 'navbuttonentries'
        ) {
          db.navButtonEntries = (db.navButtonEntries || []).filter((e) => String(e.id) !== targetId);
        } else if (
          normType === 'navbuttonactivity' ||
          normType === 'nav_button_activity' ||
          normType === 'navbuttonactivities'
        ) {
          db.navButtonActivities = (db.navButtonActivities || []).filter((a) => String(a.id) !== targetId);
        } else if (
          normType === 'calendaractivity' ||
          normType === 'calendar_activity' ||
          normType === 'calendaractivities'
        ) {
          db.calendarActivities = (db.calendarActivities || []).filter((a) => String(a.id) !== targetId);
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
