'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Phone, Lock, Eye, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';

const SafetyTip = ({ title, content, icon: Icon }: { title: string; content: string; icon: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 text-sm text-gray-600 leading-relaxed"
          >
            <div className="pt-2 border-t border-gray-100">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SafetyClient() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Trung tâm An toàn</h1>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">An toàn là trên hết</h2>
            <p className="text-white/90 text-sm">Chúng tôi cam kết bảo vệ cộng đồng DineDate.</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <p className="text-sm leading-relaxed">
            Mọi người dùng trên DineDate đều phải tuân thủ Quy tắc Cộng đồng. Nếu bạn thấy hành vi đáng ngờ, hãy báo cáo ngay cho chúng tôi.
          </p>
        </div>
      </div>

      {/* Emergency Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 px-2">Hỗ trợ khẩn cấp</h3>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Phone className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-700">Tổng đài CSKH 24/7</p>
              <p className="text-xs text-red-600">Dành cho các vấn đề gấp</p>
            </div>
          </div>
          <a href="tel:19001234" className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-sm">
            Gọi ngay
          </a>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 px-2">Lời khuyên an toàn</h3>
        <div className="space-y-2">
          <SafetyTip
            title="Luôn gặp ở nơi công cộng"
            icon={Eye}
            content="Trong những lần hẹn đầu tiên, hãy luôn chọn địa điểm đông người như quán cafe, nhà hàng, trung tâm thương mại. Tránh những nơi vắng vẻ, riêng tư hoặc tại nhà riêng."
          />
          <SafetyTip
            title="Không chuyển tiền riêng"
            icon={Lock}
            content="Tuyệt đối không chuyển khoản trực tiếp cho đối tác. Hãy sử dụng hệ thống thanh toán của DineDate để được bảo vệ bởi chính sách Escrow (giữ tiền đảm bảo)."
          />
          <SafetyTip
            title="Giữ liên lạc với người thân"
            icon={Phone}
            content="Hãy cho bạn bè hoặc người thân biết bạn đi đâu, gặp ai và khi nào về. Bạn có thể sử dụng tính năng chia sẻ vị trí của Zalo/Messenger."
          />
          <SafetyTip
            title="Báo cáo hành vi xấu"
            icon={Flag}
            content="Nếu ai đó có hành vi thô lỗ, quấy rối, hoặc vi phạm pháp luật, hãy sử dụng tính năng 'Báo cáo' trong hồ sơ của họ. Chúng tôi sẽ xử lý nghiêm khắc."
          />
        </div>
      </div>

      {/* Report Button */}
      <div className="pt-4">
        <button className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition">
          <AlertTriangle className="w-5 h-5" />
          Báo cáo vấn đề an toàn
        </button>
      </div>
    </div>
  );
}