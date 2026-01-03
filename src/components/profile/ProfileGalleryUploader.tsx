'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Upload, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileGalleryUploader({
  images,
  minImages = 3,
  onAddFiles,
  onRemoveImage,
  isUploading = false,
}: {
  images: string[];
  minImages?: number;
  onAddFiles: (files: File[]) => void;
  onRemoveImage: (url: string) => void;
  isUploading?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const status = useMemo(() => {
    const count = images.length;
    if (count >= minImages) {
      return { ok: true, text: `Đã đủ ảnh (${count}/${minImages})` };
    }
    return { ok: false, text: `Cần tối thiểu ${minImages} ảnh rõ mặt (${count}/${minImages})` };
  }, [images.length, minImages]);

  const pick = () => fileRef.current?.click();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    onAddFiles(files);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">Ảnh hồ sơ (Gallery)</h3>
          <p className={cn('text-sm font-medium', status.ok ? 'text-green-600' : 'text-rose-600')}>
            {status.text}
          </p>
        </div>

        <button
          type="button"
          onClick={pick}
          disabled={isUploading}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition',
            isUploading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          )}
        >
          <Upload className="w-4 h-4" />
          Thêm ảnh
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div
        className={cn(
          'rounded-2xl border-2 border-dashed p-5 transition',
          isDragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50'
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <button
          type="button"
          onClick={pick}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-600"
        >
          <Images className="w-5 h-5 text-gray-400" />
          Kéo thả ảnh vào đây hoặc bấm để chọn
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          JPG/PNG/WEBP • Ảnh rõ mặt, đủ sáng
        </p>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">Chưa có ảnh nào.</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url) => (
            <div
              key={url}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200"
            >
              <Image src={url} alt="Gallery" fill className="object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(url)}
                disabled={isUploading}
                className={cn(
                  'absolute top-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition',
                  isUploading
                    ? 'bg-white/70 text-gray-400 cursor-not-allowed'
                    : 'bg-white/90 hover:bg-white text-rose-600'
                )}
                aria-label="Xóa ảnh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={pick}
            disabled={isUploading}
            className={cn(
              'aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2',
              isUploading ? 'border-gray-200 text-gray-400' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-bold">Thêm</span>
          </button>
        </div>
      )}
    </div>
  );
}