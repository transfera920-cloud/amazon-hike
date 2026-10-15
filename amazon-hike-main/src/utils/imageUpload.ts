const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('無法讀取圖片檔案，請確認檔案未損毀'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * 將使用者選取的圖片在瀏覽器端以 canvas 縮放（最長邊 1600px）並壓縮為 WebP（品質 0.85）；
 * 若瀏覽器不支援輸出 WebP，則先鋪白底後轉為 JPEG（品質 0.85）。
 */
export async function compressImageForUpload(file: File): Promise<{ blob: Blob; contentType: string }> {
  const mimeType = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('僅支援上傳 JPG、PNG、WebP 或 GIF 格式的照片（不支援 SVG）');
  }

  const img = await loadImageFromFile(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error('圖片尺寸無效，請選擇其他圖片');
  }

  let targetWidth = srcWidth;
  let targetHeight = srcHeight;
  if (srcWidth > MAX_DIMENSION || srcHeight > MAX_DIMENSION) {
    if (srcWidth >= srcHeight) {
      targetWidth = MAX_DIMENSION;
      targetHeight = Math.max(1, Math.round((srcHeight * MAX_DIMENSION) / srcWidth));
    } else {
      targetHeight = MAX_DIMENSION;
      targetWidth = Math.max(1, Math.round((srcWidth * MAX_DIMENSION) / srcHeight));
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('瀏覽器不支援 Canvas 影像處理');
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 優先嘗試輸出 WebP
  const webpBlob = await canvasToBlob(canvas, 'image/webp', QUALITY);
  if (webpBlob && webpBlob.type === 'image/webp' && webpBlob.size > 0) {
    return { blob: webpBlob, contentType: 'image/webp' };
  }

  // 若瀏覽器不支援輸出 WebP，先鋪白底再輸出 JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', QUALITY);
  if (!jpegBlob || jpegBlob.size === 0) {
    throw new Error('圖片壓縮轉換失敗，請換一張照片再試');
  }

  return { blob: jpegBlob, contentType: 'image/jpeg' };
}

/**
 * 壓縮並上傳封面照片至後端 `/api/admin/upload-image`，成功後回傳圖片網址。
 */
export async function uploadCoverImage(file: File, token: string): Promise<string> {
  if (!file) {
    throw new Error('請先選擇要上傳的照片檔案');
  }
  if (!token) {
    throw new Error('管理員登入狀態已失效，請重新登入後再試');
  }

  const { blob, contentType } = await compressImageForUpload(file);

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('圖片壓縮後仍超過 5MB 上限，請選擇較小的照片');
  }

  let res: Response;
  try {
    res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${token}`,
      },
      body: blob,
    });
  } catch {
    throw new Error('網路連線異常，無法上傳照片');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`圖片上傳失敗（伺服器回應狀態 ${res.status}）`);
  }

  if (!res.ok || !data?.success || !data?.url) {
    throw new Error(data?.error || `圖片上傳失敗（狀態碼 ${res.status}）`);
  }

  return String(data.url);
}
