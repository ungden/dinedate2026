'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Camera, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/Skeleton';
import ProfileGalleryUploader from '@/components/profile/ProfileGalleryUploader';
import { uploadUserImage, deleteByPublicUrl } from '@/lib/storage';
import { cn } from '@/lib/utils';

const MIN_BIO_LEN = 30;
const MIN_PHOTOS = 3;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '/default-avatar.png');
  const [galleryImages, setGalleryImages] = useState<string[]>((user?.images || []).filter(Boolean));

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    occupation: user?.occupation || '',
    interests: user?.interests?.join(', ') || '',
  });

  const bioLen = (formData.bio || '').trim().length;
  const galleryCount = galleryImages.length;

  const partnerReadiness = useMemo(() => {
    const okBio = bioLen >= MIN_BIO_LEN;
    const okPhotos = galleryCount >= MIN_PHOTOS;
    return { okBio, okPhotos, ok: okBio && okPhotos };
  }, [bioLen, galleryCount]);

  const handlePickAvatar = () => avatarInputRef.current?.click();

  const handleAvatarFile = async (file: File) => {
    if (!user?.id) return;
    setIsUploading(true);

    const uploadedUrl = await uploadUserImage({
      userId: user.id,
      folder: 'avatars',
      file,
    });

    // optional cleanup old avatar if it lives in our bucket
    const prev = avatarUrl;
    setAvatarUrl(uploadedUrl);

    await updateUser({ avatar: uploadedUrl });

    // Try to cleanup old avatar if it was a user-media public url
    if (prev && prev !== uploadedUrl) {
      await deleteByPublicUrl(prev);
    }

    setIsUploading(false);
  };

  const handleAddGalleryFiles = async (files: File[]) => {
    if (!user?.id) return;
    setIsUploading(true);

    const uploadedUrls: string[] = [];
    for (const f of files) {
      const url = await uploadUserImage({ userId: user.id, folder: 'gallery', file: f });
      uploadedUrls.push(url);
    }

    const next = [...galleryImages, ...uploadedUrls];
    setGalleryImages(next);

    // Persist immediately so it doesn't get lost
    await updateUser({ images: next });

    setIsUploading(false);
  };

  const handleRemoveGalleryImage = async (url: string) => {
    if (!user?.id) return;
    setIsUploading(true);

    const next = galleryImages.filter((x) => x !== url);
    setGalleryImages(next);

    await updateUser({ images: next });
    await deleteByPublicUrl(url);

    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await updateUser({
      name: formData.name,
      bio: formData.bio,
      location: formData.location,
      occupation: formData.occupation,
      interests: formData.interests.split(',').map((i) => i.trim()).filter(Boolean),
      avatar: avatarUrl,
      images: galleryImages,
    });

    setLoading(false);
    router.push('/profile');
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-500">
        Không tìm thấy người dùng.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Chỉnh sửa hồ sơ</h1>
      </div>

      {/* Partner readiness banner (info) */}
      {!partnerReadiness.ok && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-rose-100">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">Để trở thành Partner, bạn cần:</p>
            <ul className="text-sm text-gray-700 mt-1 space-y-1">
              <li className={cn(!partnerReadiness.okBio && 'text-rose-700 font-semibold')}>
                • Bio tối thiểu {MIN_BIO_LEN} ký tự ({bioLen}/{MIN_BIO_LEN})
              </li>
              <li className={cn(!partnerReadiness.okPhotos && 'text-rose-700 font-semibold')}>
                • Ít nhất {MIN_PHOTOS} ảnh rõ mặt ({galleryCount}/{MIN_PHOTOS})
              </li>
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Ảnh đại diện</p>
              <p className="text-sm text-gray-500">Tải ảnh lên từ thiết bị của bạn</p>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarFile(f);
                if (e.currentTarget) e.currentTarget.value = '';
              }}
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Image
                src={avatarUrl}
                alt={user?.name || 'User'}
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button
                type="button"
                onClick={handlePickAvatar}
                disabled={isUploading}
                className={cn(
                  'absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-colors',
                  isUploading ? 'bg-gray-300 text-gray-500' : 'bg-primary-600 text-white hover:bg-primary-700'
                )}
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 w-full">
              <button
                type="button"
                onClick={handlePickAvatar}
                disabled={isUploading}
                className={cn(
                  'w-full sm:w-auto px-4 py-2 rounded-xl font-bold border transition',
                  isUploading
                    ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                )}
              >
                {isUploading ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              </button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <ProfileGalleryUploader
          images={galleryImages}
          minImages={MIN_PHOTOS}
          onAddFiles={handleAddGalleryFiles}
          onRemoveImage={handleRemoveGalleryImage}
          isUploading={isUploading}
        />

        {/* Form Fields */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Nhập tên của bạn"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Giới thiệu
              </label>
              <span className={cn('text-xs font-bold', bioLen >= MIN_BIO_LEN ? 'text-green-600' : 'text-rose-600')}>
                {bioLen}/{MIN_BIO_LEN}
              </span>
            </div>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              placeholder="Viết vài dòng giới thiệu về bản thân..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Ví dụ: Quận 1, TP.HCM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nghề nghiệp
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Ví dụ: Kỹ sư phần mềm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sở thích
            </label>
            <input
              type="text"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Phân cách bằng dấu phẩy, ví dụ: Du lịch, Ẩm thực, Âm nhạc"
            />
            <p className="mt-1 text-sm text-gray-500">
              Phân cách các sở thích bằng dấu phẩy
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || isUploading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-primary disabled:opacity-50"
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Lưu thay đổi
            </>
          )}
        </button>
      </form>
    </div>
  );
}