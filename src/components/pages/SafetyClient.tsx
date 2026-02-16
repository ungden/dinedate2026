'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Phone, Lock, Eye, Flag, ChevronDown, ChevronUp, MapPin, Users } from 'lucide-react';
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
            <p className="text-white/90 text-sm">DineDate cam kết bảo vệ bạn trong mọi buổi hẹn.</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <p className="text-sm leading-relaxed">
            Tất cả buổi hẹn ẩn danh đều diễn ra tại nhà hàng đối tác đã xác minh của DineDate. Bạn không cần gặp ở nơi vắng vẻ hay xa lạ. Hệ thống escrow bảo vệ tài chính của bạn.
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
        <h3 className="font-bold text-gray-900 px-2">Lời khuyên an toàn cho hẹn hò ẩn danh</h3>
        <div className="space-y-2">
          <SafetyTip
            title="Luôn gặp tại nhà hàng đối tác"
            icon={MapPin}
            content="Tất cả buổi hẹn DineDate đều diễn ra tại nhà hàng đã được xác minh. Không bao giờ đồng ý gặp ở địa điểm khác ngoài nhà hàng đã đặt. Nhà hàng có nhân viên và camera, đảm bảo an toàn cho bạn."
          />
          <SafetyTip
            title="Không chia sẻ thông tin cá nhân trước khi gặp"
            icon={Eye}
            content="DineDate sử dụng avatar anime để bảo vệ danh tính của bạn. Đừng chia sẻ số điện thoại, địa chỉ, hoặc mạng xã hội trước khi gặp mặt. Chỉ khi cả hai đánh giá 'muốn gặp lại' sau buổi hẹn, bạn mới được kết nối và xem ảnh thật."
          />
          <SafetyTip
            title="Thanh toán qua hệ thống DineDate"
            icon={Lock}
            content="Tuyệt đối không chuyển tiền trực tiếp cho đối phương. Hệ thống escrow của DineDate giữ tiền an toàn. Chỉ thanh toán khi buổi hẹn diễn ra thành công. Nếu có vấn đề, bạn sẽ được hoàn tiền."
          />
          <SafetyTip
            title="Thông báo người thân"
            icon={Phone}
            content="Hãy cho bạn bè hoặc người thân biết bạn đi hẹn tại nhà hàng nào, thời gian nào. Bạn có thể chia sẻ vị trí qua Zalo/Messenger để người thân an tâm."
          />
          <SafetyTip
            title="Báo cáo hành vi không phù hợp"
            icon={Flag}
            content="Nếu đối phương có hành vi thô lỗ, quấy rối, hoặc không phù hợp, hãy sử dụng tính năng 'Báo cáo' ngay. DineDate sẽ xử lý nghiêm khắc và có thể cấm tài khoản vĩnh viễn."
          />
          <SafetyTip
            title="Không ép uống rượu bia"
            icon={Users}
            content="Buổi hẹn là để giao lưu và tận hưởng ẩm thực. Không nên ép đối phương uống rượu bia. Nếu cảm thấy không thoải mái, bạn có quyền kết thúc buổi hẹn bất cứ lúc nào."
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
