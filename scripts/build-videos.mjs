// 讀取 public/videos.json，把 YouTube 影片區塊 + 逐字稿 + VideoObject JSON-LD
// 注入 public/<slug>/index.html。可重複執行（以標記取代，不會重複插入）。
// 在 Cloudflare 建置時由 `npm run build` 自動執行；缺資料只會警告，不會讓建置失敗。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://transfer.amazon-hike.com';
const CONFIG = path.join(ROOT, 'public', 'videos.json');

const B_START = '<!--VIDEO:START-->';
const B_END = '<!--VIDEO:END-->';
const C_START = '/*VIDEO:START*/';
const C_END = '/*VIDEO:END*/';
const ANCHOR = '<h2>常見問題</h2>';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function srtToParagraphs(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = [];
  for (const block of raw.split(/\n{2,}/)) {
    const rows = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const text = rows
      .filter((l) => !/^\d+$/.test(l) && !/-->/.test(l) && !/^WEBVTT/i.test(l) && !/^(NOTE|STYLE)\b/.test(l))
      .join('')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (text && text !== lines[lines.length - 1]) lines.push(text);
  }
  const paras = [];
  for (let i = 0; i < lines.length; i += 6) paras.push(lines.slice(i, i + 6).join(''));
  return paras;
}

const css = `${C_START}
.video{margin:16px 0}.video-frame{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#000}
.video-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.video details{margin-top:12px;border:1px solid #10b981;border-radius:12px;padding:8px 16px}
.video summary{cursor:pointer;color:#a7f3d0;font-weight:700}
${C_END}`;

function stripBlocks(html) {
  html = html.replace(new RegExp(`${B_START}[\\s\\S]*?${B_END}\\n?`), '');
  html = html.replace(new RegExp(`\\n?${C_START.replace(/[*/]/g, '\\$&')}[\\s\\S]*?${C_END.replace(/[*/]/g, '\\$&')}`), '');
  return html;
}

function setJsonLd(html, slug, video) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const m = html.match(re);
  if (!m) return { html, ok: false };
  let data;
  try { data = JSON.parse(m[1]); } catch { return { html, ok: false }; }
  const graph = (data['@graph'] || []).filter((n) => n['@type'] !== 'VideoObject');
  if (video) graph.push(video);
  data['@graph'] = graph;
  return { html: html.replace(re, () => `<script type="application/ld+json">${JSON.stringify(data)}</script>`), ok: true };
}

if (!fs.existsSync(CONFIG)) { console.log('[videos] 找不到 public/videos.json，略過'); process.exit(0); }
const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
let injected = 0;

for (const [slug, v] of Object.entries(config)) {
  if (slug.startsWith('_')) continue;
  const file = path.join(ROOT, 'public', slug, 'index.html');
  if (!fs.existsSync(file)) { console.warn(`[videos] ${slug}: 沒有對應頁面 public/${slug}/index.html`); continue; }
  let html = stripBlocks(fs.readFileSync(file, 'utf8'));

  const id = (v.youtubeId || '').trim();
  if (!id) {
    const before = fs.readFileSync(file, 'utf8');
    if (before.includes('VideoObject') || before.includes(B_START)) {
      html = setJsonLd(html, slug, null).html;
      fs.writeFileSync(file, html);
    }
    continue;
  }

  // 逐字稿：優先用 SRT/VTT，其次用 videos.json 的 transcript 欄位
  let paras = [];
  for (const ext of ['zh-TW.srt', 'zh-TW.vtt', 'srt', 'vtt']) {
    const f = path.join(ROOT, 'subtitles', `${slug}.${ext}`);
    if (fs.existsSync(f)) { paras = srtToParagraphs(f); break; }
  }
  if (!paras.length && v.transcript) paras = String(v.transcript).split(/\n+/).filter(Boolean);

  const title = v.title || '';
  const summary = (v.summary || []).map((s) => `<li>${esc(s)}</li>`).join('');
  const block = `${B_START}
<h2>${esc(v.heading || '路線影片')}</h2>
<div class="video">
<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}" title="${esc(title)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
${summary ? `<ul>${summary}</ul>` : ''}
${paras.length ? `<details><summary>影片逐字稿</summary>${paras.map((p) => `<p>${esc(p)}</p>`).join('')}</details>` : ''}
</div>
${B_END}
`;

  if (!html.includes(ANCHOR)) { console.warn(`[videos] ${slug}: 找不到錨點 ${ANCHOR}，略過`); continue; }
  html = html.replace(ANCHOR, () => block + ANCHOR);
  html = html.replace('</style>', () => `${css}\n</style>`);

  let videoLd = null;
  if (title && v.description && v.uploadDate) {
    videoLd = {
      '@type': 'VideoObject',
      '@id': `${SITE}/${slug}/#video`,
      name: title,
      description: v.description,
      thumbnailUrl: [v.thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`],
      uploadDate: v.uploadDate,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      inLanguage: 'zh-TW',
      publisher: { '@id': `${SITE}/#org` },
    };
    if (v.duration) videoLd.duration = v.duration;
    if (paras.length) videoLd.transcript = paras.join('\n');
  } else {
    console.warn(`[videos] ${slug}: title / description / uploadDate 缺一，已嵌入影片但未輸出 VideoObject`);
  }
  const r = setJsonLd(html, slug, videoLd);
  if (!r.ok) console.warn(`[videos] ${slug}: JSON-LD 解析失敗，未更新結構化資料`);
  fs.writeFileSync(file, r.html);
  injected++;
  console.log(`[videos] ${slug}: 已注入影片 ${id}${paras.length ? `，逐字稿 ${paras.length} 段` : '（無逐字稿）'}`);
}
console.log(`[videos] 完成，共注入 ${injected} 頁`);
