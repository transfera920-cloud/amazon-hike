// 讀取 public/articles.json，把「路線攻略文章」連結區塊注入 public/<slug>/index.html。
// 只顯示 show 不是 false、且有標題與 https 網址的項目；沒有可顯示的項目時，該頁不會出現這個區塊。
// 可重複執行（以標記取代）。在 `npm run build` 時自動執行，缺資料只會警告，不會讓建置失敗。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'public', 'articles.json');
const START = '<!--ARTICLES:START-->';
const END = '<!--ARTICLES:END-->';
const ANCHOR = '<p>延伸閱讀：';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (!fs.existsSync(CONFIG)) { console.log('[articles] 找不到 public/articles.json，略過'); process.exit(0); }
const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
let shown = 0;

for (const [slug, list] of Object.entries(config)) {
  if (slug.startsWith('_') || !Array.isArray(list)) continue;
  const file = path.join(ROOT, 'public', slug, 'index.html');
  if (!fs.existsSync(file)) { console.warn(`[articles] ${slug}: 沒有對應頁面`); continue; }
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`), '');

  const items = list.filter((a) => a && a.show !== false && a.title && /^https:\/\//.test(a.url || ''));
  if (items.length) {
    if (!html.includes(ANCHOR)) { console.warn(`[articles] ${slug}: 找不到錨點，略過`); continue; }
    const block = `${START}
<h2>路線攻略文章</h2>
<ul>
${items.map((a) => `<li><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title)}</a></li>`).join('\n')}
</ul>
${END}
`;
    html = html.replace(ANCHOR, () => block + ANCHOR);
    shown += items.length;
    console.log(`[articles] ${slug}: ${items.length} 篇`);
  }
  if (html !== before) fs.writeFileSync(file, html);
}
console.log(`[articles] 完成，共顯示 ${shown} 篇`);
