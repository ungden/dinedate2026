'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Camera, Save, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/Skeleton';
import ProfileGalleryUploader from '@/components/profile/ProfileGalleryUploader';
import { uploadUserMedia, deleteByPublicUrl } from '@/lib/storage';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import LocationPicker from '@/components/profile/LocationPicker';
import { supabase } from '@/integrations/supabase/client';
import DiceBearAvatar from '@/components/DiceBearAvatar';
import { CuisineType, CUISINE_LABELS, CUISINE_ICONS } from '@/types';

const MIN_BIO_LEN = 30;
const MIN_PHOTOS = 3;

const ALL_CUISINES: CuisineType[] = [
  'vietnamese', 'japanese', 'korean', 'chinese', 'italian',
  'thai', 'bbq', 'hotpot', 'seafood', 'vegetarian', 'fusion', 'other',
];

function getNiceUploadError(err: unknown): string {
  const anyErr = err as any;
  const msg = String(anyErr?.message || anyErr?.error_description || anyErr?.context?.body?.message || '');
  return msg || 'Lỗi không xác định';
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const realAvatarInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [realAvatarUrl, setRealAvatarUrl] = useState<string>(user?.avatar || '');
  const [galleryImages, setGalleryImages] = useState<string[]>((user?.images || []).filter(Boolean));
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>(user?.foodPreferences || []);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || 'Hà Nội',
    locationDetail: user?.locationDetail || '',
    occupation: user?.occupation || '',
    interests: user?.interests?.join(', ') || '',
    birthYear: user?.birthYear?.toString() || '',
    coordinates: user?.coordinates,
    phone: user?.phone || ''
  });

  const bioLen = (formData.bio || '').trim().length;
  const galleryCount = galleryImages.length;

  const handlePickRealAvatar = () => realAvatarInputRef.current?.click();

  const handleRealAvatarFile = async (file: File) => {
    if (!user?.id) return;
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadUserMedia({ userId: user.id, folder: 'avatars', file });
      const prev = realAvatarUrl;
      setRealAvatarUrl(uploadedUrl);
      await updateUser({ avatar: uploadedUrl });
      if (prev && prev !== uploadedUrl && !prev.includes('dicebear')) await deleteByPublicUrl(prev);
      toast.success('Đã cập nhật ảnh thật.');
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
        const url = await uploadUserMedia({ userId: user.id, folder: 'gallery', file: f });
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

  const toggleCuisine = (cuisine: CuisineType) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
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

    if (!formData.birthYear) {
        toast.error('Vui lòng nhập năm sinh');
        return;
    }

    const year = parseInt(formData.birthYear);
    if (year < 1960 || year > new Date().getFullYear() - 16) {
        toast.error('Năm sinh không hợp lệ (phải trên 16 tuổi)');
        return;
    }

    setLoading(true);

    try {
      await updateUser({
        name: formData.name,
        bio: formData.bio,
        location: formData.location, 
        locationDetail: formData.locationDetail,
        occupation: formData.occupation,
        interests: formData.interests.split(',').map((i) => i.trim()).filter(Boolean),
        avatar: realAvatarUrl,
        images: galleryImages,
        coordinates: formData.coordinates,
        birthYear: year,
        phone: formData.phone,
        foodPreferences: selectedCuisines,
      } as any);

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DiceBear Avatar (auto-generated, not editable) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="font-bold text-gray-900 mb-1">Avatar hiển thị</p>
          <p className="text-sm text-gray-500 mb-4">Avatar anime tự động tạo, không thể chỉnh sửa</p>
          <div className="flex items-center gap-4">
            <DiceBearAvatar userId={user.id} size="xl" />
            <p className="text-xs text-gray-400">Đây là avatar mọi người sẽ thấy khi xem hồ sơ của bạn.</p>
          </div>
        </div>

        {/* Real Photo Upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Ảnh thật</p>
              <p className="text-sm text-gray-500">Chỉ VIP và kết nối thấy được ảnh này</p>
            </div>
            <input ref={realAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleRealAvatarFile(e.target.files[0])} />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              {realAvatarUrl ? (
                <Image src={realAvatarUrl} alt="Ảnh thật" width={120} height={120} className="rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <button type="button" onClick={handlePickRealAvatar} disabled={isUploading} className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <ProfileGalleryUploader images={galleryImages} minImages={MIN_PHOTOS} onAddFiles={handleAddGalleryFiles} onRemoveImage={handleRemoveGalleryImage} isUploading={isUploading} />

        {/* Food Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900">Sở thích ẩm thực</h3>
            <p className="text-sm text-gray-500">Chọn các loại ẩm thực bạn yêu thích</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_CUISINES.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine);
              return (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                    isSelected
                      ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <span>{CUISINE_ICONS[cuisine]}</span>
                  <span>{CUISINE_LABELS[cuisine]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g,'') })} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              placeholder="0912xxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm sinh (Bắt buộc)</label>
            <input 
                type="number" 
                value={formData.birthYear} 
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                placeholder="VD: 1999"
                required 
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Giới thiệu</label>
              <span className={cn('text-xs font-bold', bioLen >= MIN_BIO_LEN ? 'text-green-600' : 'text-rose-600')}>{bioLen}/{MIN_BIO_LEN}</span>
            </div>
            <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" />
          </div>

          <LocationPicker value={formData.location} onChange={(next) => setFormData({ ...formData, location: next })} />

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
              Cập nhật GPS giúp bạn xuất hiện chính xác trong tính năng "Tìm quanh đây".
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
