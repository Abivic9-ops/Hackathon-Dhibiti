import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Just now", "3h ago", "Yesterday", "12 Mar" — short, human, never technical. */
export function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hoursPast = Math.round(minutes / 60);
  if (hoursPast < 24) return `${hoursPast}h ago`;
  const daysPast = Math.round(hoursPast / 24);
  if (daysPast === 1) return 'Yesterday';
  if (daysPast < 7) return `${daysPast} days ago`;
  return new Date(timestamp).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatKes(amount: number) {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, phone.length - 5)}•••${phone.slice(-2)}`;
}
