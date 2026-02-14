'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, AlertTriangle, Loader2, CheckCircle, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';
import Image from 'next/image';

const DISPUTE_REASONS = [
  { value: 'no_show', label: 'Doi phuong khong den' },
  { value: 'bad_behavior', label: 'Hanh vi khong phu hop' },
  { value: 'wrong_restaurant', label: 'Nha hang khong dung' },
  { value: 'food_quality', label: 'Chat luong mon an kem' },
  { value: 'other', label: 'Khac' },
] as const;

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateOrderId: string;
  otherUserName: string;
  onSuccess?: () => void;
}

export default function DisputeModal({
  isOpen,
  onClose,
  dateOrderId,
  otherUserName,
  onSuccess,
}: DisputeModalProps) {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (evidenceUrls.length + files.length > 5) {
      toast.error('Toi da 5 hinh anh');
      return;
    }

    setIsUploading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) {
        toast.error('Ban can dang nhap');
        return;
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Chi chap nhan file hinh anh');
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File qua lon (toi da 5MB)');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${authData.user.id}/${dateOrderId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('dispute-evidence')
          .upload(fileName, file);

        if (uploadError) {
          // If bucket doesn't exist, try public bucket
          const { error: publicError } = await supabase.storage
            .from('public')
            .upload(`disputes/${fileName}`, file);

          if (publicError) {
            throw new Error('Khong the tai hinh len');
          }

          const { data: publicUrl } = supabase.storage
            .from('public')
            .getPublicUrl(`disputes/${fileName}`);

          return publicUrl.publicUrl;
        }

        const { data: urlData } = supabase.storage
          .from('dispute-evidence')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setEvidenceUrls((prev) => [...prev, ...urls]);
      toast.success('Da tai hinh len thanh cong');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err?.message || 'Khong the tai hinh len');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeEvidence = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Vui long chon ly do khieu nai');
      return;
    }

    if (!description.trim()) {
      toast.error('Vui long mo ta chi tiet van de');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-dispute', {
        body: {
          dateOrderId,
          reason,
          description: description.trim(),
          evidenceUrls,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setIsSuccess(true);
      toast.success('Da gui khieu nai thanh cong');

      setTimeout(() => {
        setIsSuccess(false);
        setReason('');
        setDescription('');
        setEvidenceUrls([]);
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      console.error('Dispute error:', err);
      toast.error(err?.message || 'Khong the gui khieu nai. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setDescription('');
      setEvidenceUrls([]);
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Khieu nai don hen</h3>
                  <p className="text-xs text-gray-500">Doi phuong: {otherUserName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {isSuccess ? (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Da gui khieu nai!</h3>
                  <p className="text-gray-500">Chung toi se xem xet va phan hoi trong 24-48h.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Reason Select */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Ly do khieu nai <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={cn(
                        'w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition',
                        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                        !reason ? 'text-gray-400' : 'text-gray-900'
                      )}
                    >
                      <option value="">-- Chon ly do --</option>
                      {DISPUTE_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mo ta chi tiet <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Vui long mo ta cu the van de ban gap phai..."
                      rows={4}
                      className={cn(
                        'w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition resize-none',
                        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      )}
                    />
                  </div>

                  {/* Evidence Upload */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Bang chung (khong bat buoc)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Tai len hinh anh lien quan (toi da 5 hinh, moi hinh toi da 5MB)
                    </p>

                    {/* Upload Button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || evidenceUrls.length >= 5}
                      className={cn(
                        'w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition',
                        isUploading || evidenceUrls.length >= 5
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                      )}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Dang tai len...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Chon hinh anh
                        </>
                      )}
                    </button>

                    {/* Preview Uploaded Images */}
                    {evidenceUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {evidenceUrls.map((url, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                            <Image
                              src={url}
                              alt={`Evidence ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => removeEvidence(index)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <strong>Luu y:</strong> Khi gui khieu nai, qua trinh tu dong thanh toan se tam dung.
                      Doi ngu ho tro se xem xet va phan hoi trong vong 24-48 gio.
                    </p>
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Canh bao:</strong> Khieu nai gia mao hoac khong co can cu co the dan den viec
                      tai khoan cua ban bi han che.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      Huy
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !reason || !description.trim()}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2',
                        isSubmitting || !reason || !description.trim()
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Dang gui...
                        </>
                      ) : (
                        'Gui khieu nai'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
