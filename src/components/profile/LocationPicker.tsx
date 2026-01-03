'use client';

import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export const COMMON_VN_LOCATIONS = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Khánh Hòa',
  'Quảng Ninh',
  'Thanh Hóa',
  'Nghệ An',
  'Thừa Thiên Huế',
  'Bà Rịa - Vũng Tàu',
  'Bắc Ninh',
  'Lâm Đồng',
];

export default function LocationPicker({
  value,
  onChange,
  className,
  label = 'Tỉnh/Thành phố',
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <select
          value={COMMON_VN_LOCATIONS.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white',
            'focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors outline-none',
            'appearance-none'
          )}
        >
          <option value="" disabled>
            Chọn tỉnh/thành
          </option>
          {COMMON_VN_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500">
        Dữ liệu này được chuẩn hoá để lọc Partner theo khu vực chính xác.
      </p>
    </div>
  );
}