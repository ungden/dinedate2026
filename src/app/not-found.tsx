import Link from 'next/link';
import { Home } from 'lucide-react';
import BackButton from '@/components/BackButton';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold gradient-text">404</div>
          <div className="w-32 h-1 bg-gradient-primary mx-auto rounded-full mt-4" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Trang không tồn tại
        </h1>
        <p className="text-gray-600 mb-8">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-primary"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>
          <BackButton />
        </div>

        {/* Suggestions */}
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Bạn có thể thử:
          </p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>
              <Link href="/discover" className="hover:text-primary-600 transition-colors">
                Khám phá các lời mời hẹn
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-primary-600 transition-colors">
                Tìm kiếm thành viên
              </Link>
            </li>
            <li>
              <Link href="/create-request" className="hover:text-primary-600 transition-colors">
                Tạo lời mời mới
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}