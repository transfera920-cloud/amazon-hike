# 新增 YouTube 影片 + 字幕（逐字稿）流程

1. 影片上傳 YouTube（說明欄寫完整：路線、登山口、車程、預約方式）。
2. 在 YouTube Studio 下載字幕（SRT），校對後存成 `subtitles/<路線資料夾>.zh-TW.srt`
   例：`subtitles/yushan.zh-TW.srt`
3. 編輯 `public/videos.json`，填入該路線的 youtubeId、title、description、uploadDate（YYYY-MM-DD）、
   duration（ISO 8601，例 PT5M30S）、summary。
4. commit 後 Cloudflare 建置時會自動執行 `scripts/build-videos.mjs`，把
   影片、重點摘要、逐字稿與 VideoObject 結構化資料寫進 `public/<路線>/index.html`。
5. youtubeId 留空 = 該頁不顯示影片（已注入的內容會在下次建置時移除）。

注意：若 Cloudflare 的建置指令不是 `npm run build`，請改成 `npm run build`，或在原指令前加上 `node scripts/build-videos.mjs &&`。

---

# 路線攻略文章連結（public/articles.json）

- 每條路線一個陣列，每篇 `{ "title": "...", "url": "https://...", "show": true }`。
- 文章還沒做好：`show` 設 `false`（或整筆先不放），頁面不會出現。做好後改成 `true`、commit 即可。
- 建置時由 `scripts/build-articles.mjs` 自動寫進 `public/<路線>/index.html`，連結直接在 HTML 裡，爬蟲讀得到。
