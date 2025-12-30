import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'DineDate - Hẹn hò và Gặp gỡ',
  description: 'Ứng dụng hẹn hò và booking dịch vụ đồng hành',
  keywords: ['hẹn hò', 'dating', 'booking', 'gặp gỡ', 'dinedate'],
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
