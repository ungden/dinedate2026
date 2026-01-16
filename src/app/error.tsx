'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { captureException, addBreadcrumb } from '@/lib/error-tracking';

function isErrorWithMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as any).message === 'string'
  );
}

function getReadableMessage(error: unknown): string {
  if (!error) return 'Đã xảy ra lỗi không xác định';
  if (typeof error === 'string') return error;

  if (isErrorWithMessage(error)) {
    return error.message || 'Đã xảy ra lỗi';
  }

  if (typeof error === 'object') {
    const e = error as {
      context?: { body?: { message?: unknown } };
    };

    const msg = typeof e.context?.body?.message === 'string' ? e.context.body.message : null;
    if (msg) return msg;
  }

  return 'Đã xảy ra lỗi (object)';
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking system
    captureException(error, {
      component: 'GlobalErrorPage',
      action: 'pageLoad',
      extra: {
        digest: error?.digest,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    // Add breadcrumb
    addBreadcrumb('error', 'Global error page displayed', {
      errorMessage: error?.message,
      digest: error?.digest,
    });

    // Console log for development
    console.error('Application error:', error);
    console.error('Application error (raw):', (error as any)?.cause || error);
  }, [error]);

  const message = getReadableMessage(error);

  const handleReset = () => {
    addBreadcrumb('ui', 'User clicked reset on global error page');
    reset();
  };

  const handleGoHome = () => {
    addBreadcrumb('ui', 'User clicked go home on global error page');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Đã xảy ra lỗi</h1>
        <p className="text-gray-600 mb-6">
          Rất tiếc, đã có lỗi xảy ra khi tải trang này. Vui lòng thử lại hoặc quay về trang chủ.
        </p>

        {process.env.NODE_ENV === 'development' && message && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-1">Chi tiết lỗi:</p>
            <code className="text-sm text-red-600 break-all">{message}</code>
            {error?.digest && (
              <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Thử lại
          </button>

          <Link
            href="/"
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            Quay lại trang chủ
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          Nếu lỗi vẫn tiếp tục, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.
        </p>
      </div>
    </div>
  );
}
