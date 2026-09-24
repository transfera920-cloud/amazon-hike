import fs from 'fs';
import path from 'path';
import worker from './server/worker.ts';
import { getDefaultChapters } from './server/default-chapters.ts';
import baselineData from './data/association_db.json';

// In-memory KV mock for simulation and verification
class MockKV {
  private store = new Map<string, string>();

  async get(key: string, type?: string) {
    const val = this.store.get(key);
    if (!val) return null;
    if (type === 'json') {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return val;
  }

  async put(key: string, value: string) {
    this.store.set(key, value);
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  has(key: string) {
    return this.store.has(key);
  }
}

// Mock ASSETS fetcher that simulates Cloudflare Workers Assets behavior:
// For certain non-static SPA paths, Cloudflare Workers Assets may return 307 Temporary Redirect (Location: /).
// Static files return 200, missing static paths return 404 or 307.
const mockAssets = {
  async fetch(req: Request | string): Promise<Response> {
    const requestUrl = typeof req === 'string' ? new URL(req, 'http://localhost') : new URL(req.url);
    const p = requestUrl.pathname;

    // Simulate Cloudflare Workers Assets returning 307 on SPA directory-like paths when queried directly
    if (p === '/intro' || p === '/tools' || p === '/highlights' || p === '/surveys') {
      return new Response(null, {
        status: 307,
        headers: { Location: '/' },
      });
    }

    let filePath = path.join(process.cwd(), 'dist', p);

    // If directory, try index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      const mimeMap: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
      };
      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': mimeMap[ext] || 'application/octet-stream' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function runTests() {
  console.log('=== STARTING WORKER INTEGRATION SUITE ===\n');
  const mockKV = new MockKV();
  const env = {
    ASSOCIATION_DB: mockKV,
    ASSETS: mockAssets,
    ADMIN_TOKEN: 'amazon-alpine-secure-token-2026',
    ADMIN_PASSWORD: 'yy661003',
  };

  let allPassed = true;
  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      allPassed = false;
    }
  }

  // 1. GET /api/health
  {
    const res = await worker.fetch(new Request('http://localhost/api/health'), env, {});
    const json: any = await res.json();
    assert(res.status === 200, '/api/health status is 200');
    assert(res.headers.get('content-type')?.includes('application/json') === true, '/api/health content-type is json');
    assert(json.status === 'ok' && json.service === 'api', '/api/health returns correct payload');
  }

  // 2. GET /api/public-data (Baseline from JSON when KV empty)
  {
    const res = await worker.fetch(new Request('http://localhost/api/public-data'), env, {});
    const json: any = await res.json();
    assert(res.status === 200, '/api/public-data status is 200');
    assert(json.success === true, '/api/public-data success is true');
    assert(Array.isArray(json.data.tools), '/api/public-data tools is array');
    assert(Array.isArray(json.data.policies) && json.data.policies.length >= 1, '/api/public-data policies has items');
    assert(Array.isArray(json.data.highlights), '/api/public-data highlights is array');
    assert(Array.isArray(json.data.navButtons) && json.data.navButtons.length >= 1, '/api/public-data navButtons has items');
  }

  // 3. GET /api/content
  {
    const res = await worker.fetch(new Request('http://localhost/api/content'), env, {});
    const json: any = await res.json();
    assert(res.status === 200, '/api/content status is 200');
    assert(json.success === true && Array.isArray(json.data.navButtons), '/api/content matches public-data');
  }

  // 4. GET /api/calendar-activities
  {
    const res = await worker.fetch(new Request('http://localhost/api/calendar-activities'), env, {});
    assert(res.status === 200 || res.status === 502, `/api/calendar-activities responded with ${res.status}`);
    assert(res.headers.get('content-type')?.includes('application/json') === true, 'calendar-activities content-type is json');
  }

  // 5. GET /api/activities
  {
    const res = await worker.fetch(new Request('http://localhost/api/activities'), env, {});
    assert(res.status === 200 || res.status === 502, `/api/activities responded with ${res.status}`);
    assert(res.headers.get('content-type')?.includes('application/json') === true, 'activities content-type is json');
  }

  // 6. Unknown /api/* route: MUST be JSON 404, NEVER HTML!
  {
    const res = await worker.fetch(new Request('http://localhost/api/__test_not_found__'), env, {});
    const json: any = await res.json();
    assert(res.status === 404, 'Unknown /api route returns 404');
    assert(res.headers.get('content-type')?.includes('application/json') === true, 'Unknown /api route content-type is json');
    assert(json.success === false && json.error.includes('404 Not Found'), 'Unknown /api route returns proper error structure');
  }

  // 7. GET / (Frontend root via Static Assets)
  {
    const res = await worker.fetch(new Request('http://localhost/'), env, {});
    const text = await res.text();
    assert(res.status === 200, 'Root / status is 200');
    assert(res.headers.get('content-type')?.includes('text/html') === true, 'Root / content-type is text/html');
    assert(text.includes('亞馬遜國家山岳協會 | Amazon Alpine Association'), 'Root / returns front-end title');
    assert(text.includes('href="https://amazon-hike.com/"'), 'Root / canonical points to https://amazon-hike.com/');
    assert(text.includes('content="https://amazon-hike.com/"'), 'Root / og:url points to https://amazon-hike.com/');
  }

  // 8. GET /intro, /tools, /highlights, /policies, /surveys (Frontend SPA client routes via dynamic SEO SPA fallback)
  {
    const resIntro = await worker.fetch(new Request('http://localhost/intro'), env, {});
    const textIntro = await resIntro.text();
    assert(resIntro.status === 200, 'Frontend SPA route /intro status is 200');
    assert(resIntro.headers.get('content-type')?.includes('text/html') === true, '/intro content-type is text/html');
    assert(textIntro.includes('<div id="root"'), '/intro returns SPA root element');
    assert(textIntro.includes('登山入門指南 | 亞馬遜國家山岳協會 | Amazon Alpine Association'), '/intro has custom SEO title');
    assert(textIntro.includes('href="https://amazon-hike.com/intro"'), '/intro has custom canonical link');
    assert(textIntro.includes('content="https://amazon-hike.com/intro"'), '/intro has custom og:url');

    const resTools = await worker.fetch(new Request('http://localhost/tools'), env, {});
    const textTools = await resTools.text();
    assert(resTools.status === 200, 'Frontend SPA route /tools status is 200');
    assert(textTools.includes('登山工具與氣象服務 | 亞馬遜國家山岳協會 | Amazon Alpine Association'), '/tools has custom SEO title');
    assert(textTools.includes('href="https://amazon-hike.com/tools"'), '/tools has custom canonical link');
    assert(textTools.includes('content="https://amazon-hike.com/tools"'), '/tools has custom og:url');

    const resHighlights = await worker.fetch(new Request('http://localhost/highlights'), env, {});
    const textHighlights = await resHighlights.text();
    assert(resHighlights.status === 200, 'Frontend SPA route /highlights status is 200');
    assert(textHighlights.includes('活動花絮影音專區 | 亞馬遜國家山岳協會 | Amazon Alpine Association'), '/highlights has custom SEO title');
    assert(textHighlights.includes('href="https://amazon-hike.com/highlights"'), '/highlights has custom canonical link');
    assert(textHighlights.includes('content="https://amazon-hike.com/highlights"'), '/highlights has custom og:url');

    const resPolicies = await worker.fetch(new Request('http://localhost/policies'), env, {});
    const textPolicies = await resPolicies.text();
    assert(resPolicies.status === 200, 'Frontend SPA route /policies status is 200');
    assert(textPolicies.includes('政策與章程條款 | 亞馬遜國家山岳協會 | Amazon Alpine Association'), '/policies has custom SEO title');
    assert(textPolicies.includes('href="https://amazon-hike.com/policies"'), '/policies has custom canonical link');
    assert(textPolicies.includes('content="https://amazon-hike.com/policies"'), '/policies has custom og:url');

    const resSurveys = await worker.fetch(new Request('http://localhost/surveys'), env, {});
    const textSurveys = await resSurveys.text();
    assert(resSurveys.status === 200, 'Frontend SPA route /surveys status is 200');
    assert(textSurveys.includes('問卷調查專區 | 亞馬遜國家山岳協會 | Amazon Alpine Association'), '/surveys has custom SEO title');
    assert(textSurveys.includes('href="https://amazon-hike.com/surveys"'), '/surveys has custom canonical link');
    assert(textSurveys.includes('content="https://amazon-hike.com/surveys"'), '/surveys has custom og:url');

    // Unmatched route like /admin should NOT be replaced
    const resAdmin = await worker.fetch(new Request('http://localhost/admin'), env, {});
    const textAdmin = await resAdmin.text();
    assert(resAdmin.status === 200, 'Frontend SPA route /admin status is 200');
    assert(!textAdmin.includes('href="https://amazon-hike.com/admin"'), '/admin keeps default root index.html');
  }

  // 9. SEO Endpoints
  {
    // Ensure mockKV has the 15 default chapters so sitemap and intro links can reflect them
    const currentDb = await env.ASSOCIATION_DB.get('association_data', 'json') || baselineData;
    const chapters = getDefaultChapters();
    await env.ASSOCIATION_DB.put('association_data', JSON.stringify({ ...currentDb, chapters }));

    const resRobots = await worker.fetch(new Request('http://localhost/robots.txt'), env, {});
    const textRobots = await resRobots.text();
    assert(resRobots.status === 200, '/robots.txt status is 200');
    assert(textRobots.includes('Sitemap: https://amazon-hike.com/sitemap.xml'), '/robots.txt contains sitemap directive');

    const resSitemap = await worker.fetch(new Request('http://localhost/sitemap.xml'), env, {});
    const textSitemap = await resSitemap.text();
    assert(resSitemap.status === 200, '/sitemap.xml status is 200');
    assert(textSitemap.includes('<urlset') && textSitemap.includes('<loc>https://amazon-hike.com/intro</loc>'), '/sitemap.xml contains URL list');
    assert(textSitemap.includes('<loc>https://amazon-hike.com/surveys</loc>'), '/sitemap.xml includes /surveys');
    assert(textSitemap.includes('<loc>https://amazon-hike.com/chapter01/</loc>'), '/sitemap.xml includes /chapter01/');
    assert(textSitemap.includes('<loc>https://amazon-hike.com/chapter15/</loc>'), '/sitemap.xml includes /chapter15/');
    assert(!textSitemap.includes('/intro/chapter01'), '/sitemap.xml does not contain /intro/chapter01');
  }

  // 9-1. Chapter 301 Redirects and /intro Injected Links
  {
    const resIntroRedirect = await worker.fetch(new Request('http://localhost/intro/chapter01', { redirect: 'manual' }), env, {});
    assert(resIntroRedirect.status === 301, '/intro/chapter01 returns 301 redirect');
    assert(resIntroRedirect.headers.get('location') === 'https://amazon-hike.com/chapter01/', '/intro/chapter01 redirects to https://amazon-hike.com/chapter01/');

    const resChapterRedirect = await worker.fetch(new Request('http://localhost/chapter01', { redirect: 'manual' }), env, {});
    assert(resChapterRedirect.status === 301, 'GET /chapter01 returns 301 redirect');
    assert(resChapterRedirect.headers.get('location') === 'https://amazon-hike.com/chapter01/', 'GET /chapter01 redirects to https://amazon-hike.com/chapter01/');

    const resIntro = await worker.fetch(new Request('http://localhost/intro'), env, {});
    const htmlIntro = await resIntro.text();
    assert(resIntro.status === 200, '/intro status is 200');
    assert(htmlIntro.includes('href="/chapter01/"'), '/intro HTML includes href="/chapter01/"');
    assert(htmlIntro.includes('href="/chapter15/"'), '/intro HTML includes href="/chapter15/"');
    assert(!htmlIntro.includes('<h1'), '/intro HTML does not contain <h1');
  }

  // 9-2. Dynamic Chapter SPA Route 404 on Missing or Disabled Chapter
  {
    // A nonexistent slug
    const res404 = await worker.fetch(new Request('http://localhost/intro/nonexistent-chapter'), env, {});
    const html404 = await res404.text();
    assert(res404.status === 404, '/intro/nonexistent-chapter returns HTTP 404 status');
    assert(html404.includes('<title>找不到此章節 | 亞馬遜國家山岳協會 | Amazon Alpine Association</title>'), '/intro/nonexistent-chapter sets 404 title');
    assert(html404.includes('找不到此章節'), '/intro/nonexistent-chapter includes 404 meta content in HTML');
  }

  // 9-3. SEO Shell, Trailing Slash 301, Unknown Route 404, and Index.html Static Links
  {
    // 1. /tools 外殼 (buildSectionShellHtml 注入 <main><h1>登山工具...</h1> 與 site nav)
    const resTools = await worker.fetch(new Request('http://localhost/tools'), env, {});
    const htmlTools = await resTools.text();
    assert(resTools.status === 200, '/tools returns 200');
    assert(htmlTools.includes('<main><h1>登山工具與氣象服務'), '/tools includes static section shell with <h1>');
    assert(htmlTools.includes('<nav aria-label="主要導覽">'), '/tools includes site nav shell');

    // 2. /intro/ 帶結尾斜線 301 導向無斜線版本 /intro
    const resIntroSlash = await worker.fetch(new Request('http://localhost/intro/', { redirect: 'manual' }), env, {});
    assert(resIntroSlash.status === 301, '/intro/ returns 301 redirect');
    assert(resIntroSlash.headers.get('location') === 'https://amazon-hike.com/intro', '/intro/ redirects to https://amazon-hike.com/intro');

    // 3. 未知路徑 404 (例如 /unknown-route)
    const resUnknown = await worker.fetch(new Request('http://localhost/unknown-route'), env, {});
    const htmlUnknown = await resUnknown.text();
    assert(resUnknown.status === 404, 'Unknown path returns HTTP 404 status');
    assert(htmlUnknown.includes('<title>找不到此頁面 | 亞馬遜國家山岳協會 | Amazon Alpine Association</title>'), 'Unknown path sets 404 title');
    assert(htmlUnknown.includes('content="noindex, follow"'), 'Unknown path has noindex, follow robots meta');
    assert(htmlUnknown.includes('href="https://amazon-hike.com/"'), 'Unknown path canonical points to home');

    // 4. index.html 靜態連結（未執行 JS 時首頁包含的靜態導覽與簡介）
    const resHome = await worker.fetch(new Request('http://localhost/'), env, {});
    const htmlHome = await resHome.text();
    assert(htmlHome.includes('<h1>亞馬遜國家山岳協會</h1>'), 'index.html includes static <h1> title');
    assert(htmlHome.includes('href="/intro"'), 'index.html includes static link to /intro');
    assert(htmlHome.includes('href="/tools"'), 'index.html includes static link to /tools');
    assert(htmlHome.includes('href="/highlights"'), 'index.html includes static link to /highlights');
    assert(htmlHome.includes('href="/surveys"'), 'index.html includes static link to /surveys');
    assert(htmlHome.includes('href="/policies"'), 'index.html includes static link to /policies');
  }

  // 10. Admin Auth & KV Write / Delete Cycle
  {
    // Login
    const loginRes = await worker.fetch(
      new Request('http://localhost/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'yy661003' }),
      }),
      env,
      {}
    );
    const loginJson: any = await loginRes.json();
    assert(loginJson.success === true && loginJson.token, 'Admin login succeeded and issued token');
    const token = loginJson.token;

    // Test /api/admin/save-chapter updatedAt overwrite behavior
    {
      const todayStr = new Date().toISOString().split('T')[0];
      const testChapId = 'chap_test_updatedat';

      // 1. Initial creation with an older updatedAt
      const initChapRes = await worker.fetch(
        new Request('http://localhost/api/admin/save-chapter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: testChapId,
            slug: 'test-updatedat',
            title: '測試章節初始標題',
            description: '初始摘要',
            content: '初始內容',
            enabled: true,
            sortOrder: 1,
            updatedAt: '2020-01-01',
          }),
        }),
        env,
        {}
      );
      const initJson: any = await initChapRes.json();
      assert(initJson.success === true, 'Initial chapter creation succeeded');
      assert(initJson.item.updatedAt === todayStr, 'New chapter updatedAt is set to today regardless of frontend input');

      // 2. No content change (only sortOrder changed) with old updatedAt passed
      const noChangeRes = await worker.fetch(
        new Request('http://localhost/api/admin/save-chapter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: testChapId,
            slug: 'test-updatedat',
            title: '測試章節初始標題',
            description: '初始摘要',
            content: '初始內容',
            enabled: true,
            sortOrder: 2, // only sortOrder changed
            updatedAt: '1999-01-01', // old string
          }),
        }),
        env,
        {}
      );
      const noChangeJson: any = await noChangeRes.json();
      assert(noChangeJson.item.updatedAt === todayStr, 'When content is untouched, previous updatedAt is preserved (not overridden by 1999-01-01)');

      // 3. Content changed (title modified)
      const contentChangeRes = await worker.fetch(
        new Request('http://localhost/api/admin/save-chapter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: testChapId,
            slug: 'test-updatedat',
            title: '測試章節已修改之新標題', // changed!
            description: '初始摘要',
            content: '初始內容',
            enabled: true,
            sortOrder: 2,
            updatedAt: '2015-05-05', // old date passed from frontend
          }),
        }),
        env,
        {}
      );
      const contentChangeJson: any = await contentChangeRes.json();
      assert(contentChangeJson.item.updatedAt === todayStr, 'When content changes, updatedAt is strictly overwritten to today');

      // 4. Disable chapter and verify worker returns 404
      await worker.fetch(
        new Request('http://localhost/api/admin/save-chapter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: testChapId,
            slug: 'test-updatedat',
            title: '測試章節已修改之新標題',
            description: '初始摘要',
            content: '初始內容',
            enabled: false, // disabled!
            sortOrder: 2,
          }),
        }),
        env,
        {}
      );

      const disabledRes = await worker.fetch(new Request('http://localhost/intro/test-updatedat'), env, {});
      assert(disabledRes.status === 404, 'Disabled chapter returns HTTP 404 status');

      // Clean up test chapter
      await worker.fetch(
        new Request('http://localhost/api/admin/delete-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'chapter',
            id: testChapId,
          }),
        }),
        env,
        {}
      );
    }

    // Add a marked test tool item
    const addRes = await worker.fetch(
      new Request('http://localhost/api/admin/save-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: 'tool_test_verify',
          title: '[TEST_VERIFY] 測試用登山工具',
          description: '僅供相容性驗證',
          url: 'https://example.com/test',
          enabled: true,
          sortOrder: 99,
        }),
      }),
      env,
      {}
    );
    assert(addRes.status === 200, 'Admin save-tool succeeded');
    assert(mockKV.has('association_data') || mockKV.has('association_db'), 'KV was successfully written with updated database');

    // Read back via public API
    const verifyRes = await worker.fetch(new Request('http://localhost/api/public-data'), env, {});
    const verifyJson: any = await verifyRes.json();
    const found = verifyJson.data.tools.find((t: any) => t.id === 'tool_test_verify');
    assert(Boolean(found), 'Verified test item is now readable from KV');

    // Delete the marked test item
    const delRes = await worker.fetch(
      new Request('http://localhost/api/admin/delete-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'tool',
          id: 'tool_test_verify',
        }),
      }),
      env,
      {}
    );
    assert(delRes.status === 200, 'Admin delete-item succeeded');

    // Re-verify it is gone
    const afterDelRes = await worker.fetch(new Request('http://localhost/api/public-data'), env, {});
    const afterDelJson: any = await afterDelRes.json();
    const stillThere = afterDelJson.data.tools.find((t: any) => t.id === 'tool_test_verify');
    assert(!stillThere, 'Verified test item was cleanly deleted');
    assert(Array.isArray(afterDelJson.data.tools), 'Tools collection remains valid');
  }

  console.log(`\n=== TEST SUITE COMPLETE: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} ===`);
  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
