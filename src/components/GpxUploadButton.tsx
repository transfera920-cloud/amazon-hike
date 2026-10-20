import React, { useRef, useState } from 'react';
import { Upload, FileDown, X } from 'lucide-react';
import { uploadGpxFile } from '../utils/gpxUpload.js';

export interface GpxUploadButtonProps {
  token: string;
  value?: string;
  fileName?: string;
  onUploaded: (url: string, fileName: string) => void;
  onClear: () => void;
}

export const GpxUploadButton: React.FC<GpxUploadButtonProps> = ({
  token,
  value,
  fileName,
  onUploaded,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedValue = (value || '').trim();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const result = await uploadGpxFile(file, token);
      onUploaded(result.url, result.fileName);
    } catch (err: any) {
      setError(err?.message || '上傳 GPX 失敗，請稍後再試');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 space-y-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx,application/gpx+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-300 border border-neutral-700 transition-colors"
        >
          <Upload size={13} />
          <span>{uploading ? '上傳中…' : trimmedValue ? '重新上傳 GPX' : '上傳 GPX'}</span>
        </button>

        {trimmedValue && (
          <>
            <a
              href={trimmedValue}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              <FileDown size={13} />
              <span>{fileName || '已上傳的 GPX'}</span>
            </a>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
            >
              <X size={13} />
              <span>移除</span>
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};
