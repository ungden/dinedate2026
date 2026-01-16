'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { supabase } from '@/integrations/supabase/client';

const REPORT_REASONS = [
  { value: 'inappropriate_behavior', label: 'Hanh vi khong phu hop' },
  { value: 'fake_photos', label: 'Anh gia mao' },
  { value: 'scam', label: 'Lua dao/Scam' },
  { value: 'harassment', label: 'Quay roi' },
  { value: 'other', label: 'Khac' },
] as const;

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

export default function ReportUserModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
}: ReportUserModalProps) {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Vui long chon ly do bao cao');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user?.id) {
        toast.error('Ban can dang nhap de bao cao');
        setIsSubmitting(false);
        return;
      }

      const reporterId = authData.user.id;

      // Call edge function or directly insert
      const { data, error } = await supabase.functions.invoke('report-user', {
        body: {
          reportedUserId,
          reason,
          description,
        },
      });

      if (error) {
        // Fallback to direct insert if edge function fails
        const { error: insertError } = await supabase.from('reports').insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          reason,
          description,
          status: 'pending',
        });

        if (insertError) {
          throw insertError;
        }
      }

      setIsSuccess(true);
      toast.success('Da gui bao cao thanh cong');

      setTimeout(() => {
        setIsSuccess(false);
        setReason('');
        setDescription('');
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Report error:', err);
      toast.error(err?.message || 'Khong the gui bao cao. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setDescription('');
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
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Bao cao nguoi dung</h3>
                  <p className="text-xs text-gray-500">{reportedUserName}</p>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Da gui bao cao!</h3>
                  <p className="text-gray-500">Chung toi se xem xet va xu ly bao cao cua ban.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Reason Select */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Ly do bao cao <span className="text-red-500">*</span>
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
                      {REPORT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mo ta chi tiet
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Vui long mo ta cu the ve hanh vi vi pham..."
                      rows={4}
                      className={cn(
                        'w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition resize-none',
                        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      )}
                    />
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Luu y:</strong> Bao cao gia mao hoac khong co can cu co the dan den viec tai khoan cua ban bi han che.
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
                      disabled={isSubmitting || !reason}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2',
                        isSubmitting || !reason
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Dang gui...
                        </>
                      ) : (
                        'Gui bao cao'
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
