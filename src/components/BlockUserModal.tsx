'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, ShieldOff, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onBlock: () => Promise<boolean>;
}

export default function BlockUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  onBlock,
}: BlockUserModalProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBlock = async () => {
    setIsBlocking(true);

    try {
      const success = await onBlock();

      if (success) {
        setIsSuccess(true);
        toast.success(`Da chan ${userName}`);

        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1500);
      } else {
        toast.error('Khong the chan nguoi dung. Vui long thu lai.');
      }
    } catch (err: any) {
      console.error('Block error:', err);
      toast.error(err?.message || 'Khong the chan nguoi dung');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleClose = () => {
    if (!isBlocking) {
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
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isBlocking}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition z-10 disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="p-8 text-center">
              {isSuccess ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Da chan!</h3>
                  <p className="text-gray-500">
                    Ban se khong con nhin thay {userName} trong ket qua tim kiem.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ShieldOff className="w-10 h-10 text-red-500" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Chan {userName}?
                  </h3>
                  <p className="text-gray-500 mb-6 leading-relaxed">
                    Nguoi nay se khong the nhin thay ban trong ket qua tim kiem va cac cuoc tro chuyen hien tai se bi an.
                  </p>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">Khi chan nguoi dung:</strong>
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400">-</span>
                        Ho se khong nhin thay ban trong tim kiem
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400">-</span>
                        Ban se khong nhin thay ho trong tim kiem
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400">-</span>
                        Cac cuoc tro chuyen hien tai se bi an
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400">-</span>
                        Ban co the bo chan bat ky luc nao
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleBlock}
                      disabled={isBlocking}
                      className={cn(
                        'w-full py-4 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-2',
                        isBlocking
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      )}
                    >
                      {isBlocking ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Dang xu ly...
                        </>
                      ) : (
                        <>
                          <ShieldOff className="w-5 h-5" />
                          Chan nguoi nay
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleClose}
                      disabled={isBlocking}
                      className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      Huy bo
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
