import fs from 'fs';
import path from 'path';
import worker from './server/worker.ts';

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

// Mock ASSETS fetcher that reads from actual dist/ directory
const mockAssets = {
  async fetch(req: Request | string): Promise<Response> {
    const requestUrl = typeof req === 'string' ? new URL(req, 'http://localhost') : new URL(req.url);
    let filePath = path.join(process.cwd(), 'dist', requestUrl.pathname);

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
    assert(json.data.tools.length === 4, `/api/public-data tools length is 4 (actual: ${json.data.tools.length})`);
    assert(json.data.policies.length === 4, `/api/public-data policies length is 4 (actual: ${json.data.policies.length})`);
    assert(json.data.highlights.length === 3, `/api/public-data highlights length is 3 (actual: ${json.data.highlights.length})`);
    assert(json.data.surveys.length === 1, `/api/public-data surveys length is 1 (actual: ${json.data.surveys.length})`);
    assert(json.data.navButtons.length === 8, `/api/public-data navButtons length is 8 (actual: ${json.data.navButtons.length})`);
    assert(!mockKV.has('association_db'), 'Safe Read: Empty KV was NOT mutated during read fallback');
  }

  // 3. GET /api/content
  {
    const res = await worker.fetch(new Request('http://localhost/api/content'), env, {});
    const json: any = await res.json();
    assert(res.status === 200, '/api/content status is 200');
    assert(json.success === true && json.data.tools.length === 4, '/api/content matches public-data');
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
    assert(text.includes('亞馬遜國家山岳協會'), 'Root / returns front-end title');
  }

  // 8. GET /intro (Frontend SPA client route via SPA fallback)
  {
    const res = await worker.fetch(new Request('http://localhost/intro'), env, {});
    const text = await res.text();
    assert(res.status === 200, 'Frontend SPA route /intro status is 200');
    assert(res.headers.get('content-type')?.includes('text/html') === true, '/intro content-type is text/html');
    assert(text.includes('<div id="root"></div>'), '/intro returns SPA root element');
  }

  // 9. SEO Endpoints
  {
    const resRobots = await worker.fetch(new Request('http://localhost/robots.txt'), env, {});
    const textRobots = await resRobots.text();
    assert(resRobots.status === 200, '/robots.txt status is 200');
    assert(textRobots.includes('Sitemap: /sitemap.xml'), '/robots.txt contains sitemap directive');

    const resSitemap = await worker.fetch(new Request('http://localhost/sitemap.xml'), env, {});
    const textSitemap = await resSitemap.text();
    assert(resSitemap.status === 200, '/sitemap.xml status is 200');
    assert(textSitemap.includes('<urlset') && textSitemap.includes('<loc>/intro</loc>'), '/sitemap.xml contains URL list');
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
    assert(mockKV.has('association_db'), 'KV was successfully written with updated database');

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
    assert(afterDelJson.data.tools.length === 4, 'Original 4 tools remain intact');
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
