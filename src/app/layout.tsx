import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dinedate.vn'),
  title: 'DineDate - Hen Ho Mu x Kham Pha Am Thuc',
  description: 'Kham pha am thuc cung nguoi la. Dat ban, chon combo, gap mat - hoan toan blind. Trai nghiem hen ho doc dao nhat Viet Nam.',
  keywords: ['hen ho', 'blind date', 'nha hang', 'am thuc', 'dinedate', 'gap mat', 'combo'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'DineDate - Hen Ho Mu x Kham Pha Am Thuc',
    description: 'Kham pha am thuc cung nguoi la. Dat ban, chon combo, gap mat - hoan toan blind. Trai nghiem hen ho doc dao nhat Viet Nam.',
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
    title: 'DineDate - Hen Ho Mu x Kham Pha Am Thuc',
    description: 'Kham pha am thuc cung nguoi la. Dat ban, chon combo, gap mat - hoan toan blind. Trai nghiem hen ho doc dao nhat Viet Nam.',
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