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
        <h1 className="text-2xl font-bold text-gray-900">Trung tam An toan</h1>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">An toan la tren het</h2>
            <p className="text-white/90 text-sm">DineDate cam ket bao ve ban trong moi buoi hen.</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <p className="text-sm leading-relaxed">
            Tat ca buoi hen blind date deu dien ra tai nha hang doi tac da xac minh cua DineDate. Ban khong can gap o noi vang ve hay xa la. He thong escrow bao ve tai chinh cua ban.
          </p>
        </div>
      </div>

      {/* Emergency Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 px-2">Ho tro khan cap</h3>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Phone className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-700">Tong dai CSKH 24/7</p>
              <p className="text-xs text-red-600">Danh cho cac van de gap</p>
            </div>
          </div>
          <a href="tel:19001234" className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-sm">
            Goi ngay
          </a>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 px-2">Loi khuyen an toan cho blind date</h3>
        <div className="space-y-2">
          <SafetyTip
            title="Luon gap tai nha hang doi tac"
            icon={MapPin}
            content="Tat ca buoi hen DineDate deu dien ra tai nha hang da duoc xac minh. Khong bao gio dong y gap o dia diem khac ngoai nha hang da dat. Nha hang co nhan vien va camera, dam bao an toan cho ban."
          />
          <SafetyTip
            title="Khong chia se thong tin ca nhan truoc khi gap"
            icon={Eye}
            content="DineDate su dung avatar anime de bao ve danh tinh cua ban. Dung chia se so dien thoai, dia chi, hoac mang xa hoi truoc khi gap mat. Chi khi ca hai danh gia 'muon gap lai' sau buoi hen, ban moi duoc ket noi va xem anh that."
          />
          <SafetyTip
            title="Thanh toan qua he thong DineDate"
            icon={Lock}
            content="Tuyet doi khong chuyen tien truc tiep cho doi phuong. He thong escrow cua DineDate giu tien an toan. Chi thanh toan khi buoi hen dien ra thanh cong. Neu co van de, ban se duoc hoan tien."
          />
          <SafetyTip
            title="Thong bao nguoi than"
            icon={Phone}
            content="Hay cho ban be hoac nguoi than biet ban di hen tai nha hang nao, thoi gian nao. Ban co the chia se vi tri qua Zalo/Messenger de nguoi than an tam."
          />
          <SafetyTip
            title="Bao cao hanh vi khong phu hop"
            icon={Flag}
            content="Neu doi phuong co hanh vi tho lo, quay roi, hoac khong phu hop, hay su dung tinh nang 'Bao cao' ngay. DineDate se xu ly nghiem khac va co the cam tai khoan vinh vien."
          />
          <SafetyTip
            title="Khong ep uong ruou bia"
            icon={Users}
            content="Buoi hen la de giao luu va tan huong am thuc. Khong nen ep doi phuong uong ruou bia. Neu cam thay khong thoai mai, ban co quyen ket thuc buoi hen bat cu luc nao."
          />
        </div>
      </div>

      {/* Report Button */}
      <div className="pt-4">
        <button className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition">
          <AlertTriangle className="w-5 h-5" />
          Bao cao van de an toan
        </button>
      </div>
    </div>
  );
}
