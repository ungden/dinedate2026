'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Camera, Save, AlertTriangle, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/Skeleton';
import ProfileGalleryUploader from '@/components/profile/ProfileGalleryUploader';
import { uploadUserImage, deleteByPublicUrl } from '@/lib/storage';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import LocationPicker from '@/components/profile/LocationPicker';
import { supabase } from '@/integrations/supabase/client';

const MIN_BIO_LEN = 30;
const MIN_PHOTOS = 3;

function getNiceUploadError(err: unknown): string {
  // ... (keep existing error helper)
  const anyErr = err as any;
  const msg = String(anyErr?.message || anyErr?.error_description || anyErr?.context?.body?.message || '');
  return msg || 'Lỗi không xác định';
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '/default-avatar.png');
  const [galleryImages, setGalleryImages] = useState<string[]>((user?.images || []).filter(Boolean));

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || 'Hà Nội',
    locationDetail: user?.locationDetail || '',
    occupation: user?.occupation || '',
    interests: user?.interests?.join(', ') || '',
    coordinates: user?.coordinates
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
    try {
      const uploadedUrl = await uploadUserImage({ userId: user.id, folder: 'avatars', file });
      const prev = avatarUrl;
      setAvatarUrl(uploadedUrl);
      await updateUser({ avatar: uploadedUrl });
      if (prev && prev !== uploadedUrl) await deleteByPublicUrl(prev);
      toast.success('Đã cập nhật ảnh đại diện.');
    } catch (err) {
      toast.error(getNiceUploadError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddGalleryFiles = async (files: File[]) => {
    if (!user?.id) return;
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const url = await uploadUserImage({ userId: user.id, folder: 'gallery', file: f });
        uploadedUrls.push(url);
      }
      const next = [...galleryImages, ...uploadedUrls];
      setGalleryImages(next);
      await updateUser({ images: next });
      toast.success(`Đã upload ${uploadedUrls.length} ảnh.`);
    } catch (err) {
      toast.error(getNiceUploadError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveGalleryImage = async (url: string) => {
    if (!user?.id) return;
    setIsUploading(true);
    try {
      const next = galleryImages.filter((x) => x !== url);
      setGalleryImages(next);
      await updateUser({ images: next });
      await deleteByPublicUrl(url);
      toast.success('Đã xóa ảnh.');
    } catch (err) {
      toast.error(getNiceUploadError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          coordinates: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }
        }));
        setIsGettingLocation(false);
        toast.success('Đã lấy toạ độ hiện tại. Nhớ bấm Lưu!');
      },
      (err) => {
        console.error(err);
        toast.error('Không thể lấy vị trí. Kiểm tra quyền truy cập.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);

    try {
      // 1. Update standard profile using auth context helper
      await updateUser({
        name: formData.name,
        bio: formData.bio,
        location: formData.location, 
        locationDetail: formData.locationDetail,
        occupation: formData.occupation,
        interests: formData.interests.split(',').map((i) => i.trim()).filter(Boolean),
        avatar: avatarUrl,
        images: galleryImages,
        coordinates: formData.coordinates
      } as any);

      // 2. Explicitly update lat/long columns in DB if coordinates exist
      // (The helper might map them, but let's be sure since we added logic)
      if (formData.coordinates) {
        await supabase.from('users').update({
          latitude: formData.coordinates.latitude,
          longitude: formData.coordinates.longitude
        }).eq('id', user.id);
      }

      toast.success('Đã lưu hồ sơ.');
      router.push('/profile');
    } catch (err) {
      console.error('Save profile failed:', err);
      toast.error(getNiceUploadError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Chỉnh sửa hồ sơ</h1>
      </div>

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
        {/* Avatar Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Ảnh đại diện</p>
              <p className="text-sm text-gray-500">Tải ảnh lên từ thiết bị</p>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarFile(e.target.files[0])} />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Image src={avatarUrl} alt="User" width={120} height={120} className="rounded-full object-cover border-4 border-white shadow-lg" />
              <button type="button" onClick={handlePickAvatar} disabled={isUploading} className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <ProfileGalleryUploader images={galleryImages} minImages={MIN_PHOTOS} onAddFiles={handleAddGalleryFiles} onRemoveImage={handleRemoveGalleryImage} isUploading={isUploading} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" required />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Giới thiệu</label>
              <span className={cn('text-xs font-bold', bioLen >= MIN_BIO_LEN ? 'text-green-600' : 'text-rose-600')}>{bioLen}/{MIN_BIO_LEN}</span>
            </div>
            <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          <LocationPicker value={formData.location} onChange={(next) => setFormData({ ...formData, location: next })} />

          {/* GPS Coordinate Updater */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-blue-900">Vị trí GPS chính xác</label>
                <p className="text-xs text-blue-700 mt-0.5">
                  {formData.coordinates 
                    ? `Đã lưu: ${formData.coordinates.latitude.toFixed(4)}, ${formData.coordinates.longitude.toFixed(4)}` 
                    : 'Chưa có dữ liệu GPS'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUpdateGPS}
                disabled={isGettingLocation}
                className="flex items-center gap-2 px-3 py-2 bg-white text-blue-600 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition"
              >
                {isGettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                Cập nhật GPS
              </button>
            </div>
            <p className="text-[11px] text-blue-600/70 mt-2">
              Cập nhật GPS giúp bạn xuất hiện chính xác trong tính năng "Tìm quanh đây" của người dùng khác.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực chi tiết</label>
            <input type="text" value={formData.locationDetail} onChange={(e) => setFormData({ ...formData, locationDetail: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="VD: Quận 1..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
            <input type="text" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sở thích</label>
            <input type="text" value={formData.interests} onChange={(e) => setFormData({ ...formData, interests: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="Phân cách bằng dấu phẩy" />
          </div>
        </div>

        <button type="submit" disabled={loading || isUploading} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 shadow-primary disabled:opacity-50">
          {loading ? <LoadingSpinner /> : <><Save className="w-5 h-5" /> Lưu thay đổi</>}
        </button>
      </form>
    </div>
  );
}