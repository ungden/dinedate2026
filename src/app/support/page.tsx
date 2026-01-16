import { Metadata } from 'next';
import SupportClient from '@/components/pages/SupportClient';

export const metadata: Metadata = {
  title: 'Ho tro khach hang | DineDate',
  description: 'Lien he ho tro khach hang DineDate',
};

export default function SupportPage() {
  return <SupportClient />;
}
