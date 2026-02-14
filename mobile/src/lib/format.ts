export function formatPrice(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}

export function formatPriceShort(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return String(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} - ${hours}:${mins}`;
}
