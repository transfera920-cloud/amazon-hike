import React, { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { uploadCoverImage } from '../utils/imageUpload.js';

export interface InsertImageButtonProps {
  token: string;
  /** 要插入圖片的 textarea 的 id（用來取得游標位置） */
  targetId: string;
  /** 目前 textarea 的內容 */
  value: string;
  /** 插入後的新內容 */
  onChange: (next: string) => void;
}

/**
 * 內文欄位旁的「插入圖片」：選照片 → 自動壓縮上傳 → 在游標位置插入 ![說明](網址)。
 * 圖片會獨立成一段；圖說填了就顯示在照片正下方，不填則不顯示（前後各空一行），前台與 Worker 注入的 HTML 都會顯示。
 */
export const InsertImageButton: React.FC<InsertImageButtonProps> = ({ token, targetId, value, onChange }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCoverImage(file, token);
      const cleanAlt = alt.replace(/[\[\]\r\n]/g, ' ').trim() || '請填寫圖片說明';
      const cleanCaption = caption.replace(/["\r\n]/g, ' ').trim();
      const md = cleanCaption ? `![${cleanAlt}](${url} "${cleanCaption}")` : `![${cleanAlt}](${url})`;
      const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
      const pos = el && typeof el.selectionStart === 'number' ? el.selectionStart : value.length;
      const before = value.slice(0, pos).replace(/\s+$/, '');
      const after = value.slice(pos).replace(/^\s+/, '');
      const next = `${before}${before ? '\n\n' : ''}${md}${after ? '\n\n' : ''}${after}`;
      onChange(next);
      setAlt('');
      setCaption('');
    } catch (err: any) {
      setError(err?.message || '上傳照片失敗，請稍後再試');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        maxLength={120}
        placeholder="圖片說明 alt，例如：馬比杉山山頂隊員合影"
        className="flex-1 min-w-[200px] px-2.5 py-1 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs"
      />
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={120}
        placeholder="圖說（選填，顯示在照片正下方）"
        className="flex-1 min-w-[200px] px-2.5 py-1 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs"
      />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-emerald-300 border border-neutral-700 transition-colors"
      >
        <ImagePlus size={13} />
        <span>{uploading ? '上傳中…' : '插入圖片到游標位置'}</span>
      </button>
      {error && <p className="w-full text-xs text-rose-400">{error}</p>}
    </div>
  );
};
