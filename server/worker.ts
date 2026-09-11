import { handleApiRequest } from './api-handler.js';
import type { WorkerEnv } from './db-kv.js';

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. All /api/* requests are handled strictly by the API Handler
    if (pathname.startsWith('/api/') || pathname === '/api') {
      return handleApiRequest(request, env, url);
    }

    // 2. SEO Endpoints: robots.txt and sitemap.xml
    if (pathname === '/robots.txt') {
      return new Response(
        `User-agent: *
Allow: /
Disallow: /admin
Sitemap: /sitemap.xml
`,
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        }
      );
    }

    if (pathname === '/sitemap.xml') {
      const now = new Date().toISOString().split('T')[0];
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
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
</urlset>`,
        {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
        }
      );
    }

    // 3. Static Assets / SPA fallback
    // If env.ASSETS is provided (Cloudflare Workers Static Assets), delegate to it.
    if (env && env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // SPA Fallback for client routes (/intro, /tools, /policies, etc.)
      const spaRequest = new Request(new URL('/index.html', request.url), request);
      return env.ASSETS.fetch(spaRequest);
    }

    // Fallback if accessed in testing harness without ASSETS binding
    return new Response('Cloudflare Worker Entry Point active. Static assets require ASSETS binding.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
