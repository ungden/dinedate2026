import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://dinedate.vn'),
  title: 'DineDate - Hẹn hò và Gặp gỡ',
  description: 'Ứng dụng hẹn hò và booking dịch vụ đồng hành',
  keywords: ['hẹn hò', 'dating', 'booking', 'gặp gỡ', 'dinedate'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'DineDate - Hẹn hò và Gặp gỡ',
    description: 'Ứng dụng hẹn hò và booking dịch vụ đồng hành',
    siteName: 'DineDate',
    url: 'https://dinedate.vn',
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
    title: 'DineDate - Hẹn hò và Gặp gỡ',
    description: 'Ứng dụng hẹn hò và booking dịch vụ đồng hành',
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