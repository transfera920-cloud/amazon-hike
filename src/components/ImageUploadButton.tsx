import React, { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { uploadCoverImage } from '../utils/imageUpload.js';
import { normalizeUrl } from '../utils/url.js';

export interface ImageUploadButtonProps {
  token: string;
  value?: string;
  onUploaded: (url: string) => void;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  token,
  value,
  onUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const trimmedValue = (value || '').trim();

  useEffect(() => {
    setPreviewFailed(false);
  }, [trimmedValue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const uploadedUrl = await uploadCoverImage(file, token);
      onUploaded(uploadedUrl);
    } catch (err: any) {
      setError(err?.message || '上傳照片失敗，請稍後再試');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 space-y-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
          <span>{uploading ? '上傳中…' : '上傳照片'}</span>
        </button>

        {trimmedValue && !previewFailed && (
          <img
            src={normalizeUrl(trimmedValue)}
            alt="封面預覽"
            referrerPolicy="no-referrer"
            onError={() => setPreviewFailed(true)}
            className="h-12 w-20 object-cover rounded border border-neutral-700 bg-neutral-900"
          />
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
};
