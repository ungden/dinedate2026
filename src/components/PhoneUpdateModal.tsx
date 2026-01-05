'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Phone, X, Save, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface PhoneUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export default function PhoneUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Cập nhật số điện thoại',
  description = 'Để đảm bảo an toàn và liên lạc khi thực hiện giao dịch, vui lòng cập nhật số điện thoại chính chủ.',
}: PhoneUpdateModalProps) {
  const { user, updateUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate VN Phone: 03, 05, 07, 08, 09 + 8 digits
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
      toast.error('Số điện thoại không hợp lệ (VD: 0912345678)');
      return;
    }

    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Check duplicate
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .neq('id', user.id) // Exclude self
        .maybeSingle();

      if (existing) {
        toast.error('Số điện thoại này đã được sử dụng bởi tài khoản khác');
        setIsSubmitting(false);
        return;
      }

      await updateUser({ phone });
      toast.success('Cập nhật thành công!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                {title}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              
              <p className="text-center text-sm text-gray-600 mb-6 leading-relaxed">
                {description}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="0912xxxxxx"
                    autoFocus
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!phone || isSubmitting}
                  className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Lưu & Tiếp tục
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}