const MAX_GPX_BYTES = 5 * 1024 * 1024;

/**
 * 上傳 GPX 航跡檔至後端 `/api/admin/upload-gpx`，成功後回傳下載網址與檔名。
 */
export async function uploadGpxFile(
  file: File,
  token: string
): Promise<{ url: string; fileName: string }> {
  if (!file) {
    throw new Error('請先選擇要上傳的 GPX 檔案');
  }
  if (!token) {
    throw new Error('管理員登入狀態已失效，請重新登入後再試');
  }
  if (!/\.gpx$/i.test(file.name)) {
    throw new Error('僅支援副檔名為 .gpx 的檔案');
  }
  if (file.size === 0) {
    throw new Error('檔案內容為空');
  }
  if (file.size > MAX_GPX_BYTES) {
    throw new Error('GPX 檔案大小不得超過 5MB');
  }

  const text = await file.text();
  if (!/<gpx[\s>]/i.test(text)) {
    throw new Error('檔案內容不是 GPX 格式（找不到 <gpx> 標籤）');
  }

  let res: Response;
  try {
    res = await fetch('/api/admin/upload-gpx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/gpx+xml',
        'X-File-Name': encodeURIComponent(file.name),
        Authorization: `Bearer ${token}`,
      },
      body: text,
    });
  } catch {
    throw new Error('網路連線異常，無法上傳 GPX');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`GPX 上傳失敗（伺服器回應狀態 ${res.status}）`);
  }

  if (!res.ok || !data?.success || !data?.url) {
    throw new Error(data?.error || `GPX 上傳失敗（狀態碼 ${res.status}）`);
  }

  return { url: String(data.url), fileName: String(data.fileName || file.name) };
}
