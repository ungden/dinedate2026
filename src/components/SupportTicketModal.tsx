'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, HelpCircle, Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useSupportTickets, TicketCategory } from '@/hooks/useSupportTickets';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'booking', label: 'Van de ve booking' },
  { value: 'payment', label: 'Thanh toan & Hoan tien' },
  { value: 'account', label: 'Tai khoan' },
  { value: 'partner', label: 'Partner' },
  { value: 'technical', label: 'Loi ky thuat' },
  { value: 'other', label: 'Khac' },
];

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBookingId?: string;
}

interface BookingOption {
  id: string;
  activity: string;
  created_at: string;
}

export default function SupportTicketModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBookingId,
}: SupportTicketModalProps) {
  const { user } = useAuth();
  const { createTicket } = useSupportTickets();

  const [category, setCategory] = useState<TicketCategory>('other');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string>(defaultBookingId || '');
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Fetch user's recent bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id || !isOpen) return;

      setLoadingBookings(true);
      try {
        const { data } = await supabase
          .from('bookings')
          .select('id, activity, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user?.id, isOpen]);

  // Set default booking if provided
  useEffect(() => {
    if (defaultBookingId) {
      setSelectedBookingId(defaultBookingId);
      setCategory('booking');
    }
  }, [defaultBookingId]);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error('Vui long nhap tieu de');
      return;
    }

    if (!description.trim()) {
      toast.error('Vui long mo ta chi tiet van de');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        related_booking_id: selectedBookingId || undefined,
      });

      if (result) {
        setIsSuccess(true);
        toast.success('Da gui yeu cau ho tro thanh cong');

        setTimeout(() => {
          setIsSuccess(false);
          setCategory('other');
          setSubject('');
          setDescription('');
          setSelectedBookingId('');
          onClose();
          onSuccess?.();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err?.message || 'Khong the gui yeu cau. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCategory('other');
      setSubject('');
      setDescription('');
      setSelectedBookingId('');
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
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Tao yeu cau ho tro</h3>
                  <p className="text-xs text-gray-500">Chung toi se phan hoi trong 24h</p>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Da gui thanh cong!</h3>
                  <p className="text-gray-500">Chung toi se xem xet va phan hoi som nhat.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Category Select */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Loai van de <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TicketCategory)}
                        className={cn(
                          'w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition appearance-none',
                          'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        )}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Booking Reference (Optional) */}
                  {(category === 'booking' || category === 'payment' || category === 'partner') && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Booking lien quan (khong bat buoc)
                      </label>
                      <div className="relative">
                        <select
                          value={selectedBookingId}
                          onChange={(e) => setSelectedBookingId(e.target.value)}
                          disabled={loadingBookings}
                          className={cn(
                            'w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition appearance-none',
                            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            loadingBookings && 'opacity-50'
                          )}
                        >
                          <option value="">-- Chon booking --</option>
                          {bookings.map((booking) => (
                            <option key={booking.id} value={booking.id}>
                              {booking.activity} - {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tieu de <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Tom tat van de ban gap..."
                      maxLength={100}
                      className={cn(
                        'w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition',
                        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      )}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mo ta chi tiet <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Vui long mo ta cu the van de ban gap phai de chung toi co the ho tro tot hon..."
                      rows={4}
                      maxLength={2000}
                      className={cn(
                        'w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition resize-none',
                        'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      )}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {description.length}/2000
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <strong>Luu y:</strong> De nhan phan hoi nhanh hon, vui long mo ta cu the van de,
                      bao gom thoi gian va cac buoc da thuc hien. Doi ngu ho tro se phan hoi trong vong 24h.
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
                      disabled={isSubmitting || !subject.trim() || !description.trim()}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2',
                        isSubmitting || !subject.trim() || !description.trim()
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Dang gui...
                        </>
                      ) : (
                        'Gui yeu cau'
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
