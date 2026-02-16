import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dinedate.vn'),
  title: 'DineDate - Hẹn hò ẩn danh x Khám phá ẩm thực',
  description: 'Khám phá ẩm thực cùng người lạ thú vị. Đặt bàn, chọn combo, gặp mặt ẩn danh tại nhà hàng an toàn.',
  keywords: ['hẹn hò ẩn danh', 'nhà hàng', 'ẩm thực', 'dinedate', 'gặp mặt', 'combo'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'DineDate - Hẹn hò ẩn danh x Khám phá ẩm thực',
    description: 'Khám phá ẩm thực cùng người lạ thú vị. Đặt bàn, chọn combo, gặp mặt ẩn danh tại nhà hàng an toàn.',
    siteName: 'DineDate',
    url: 'https://www.dinedate.vn',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'DineDate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DineDate - Hẹn hò ẩn danh x Khám phá ẩm thực',
    description: 'Khám phá ẩm thực cùng người lạ thú vị. Đặt bàn, chọn combo, gặp mặt ẩn danh tại nhà hàng an toàn.',
    images: ['/twitter-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
