import React from 'react';
import { OrderStatus } from '@/lib/api';

const statusStyles: Record<OrderStatus, string> = {
  Pending: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
  Confirmed: 'bg-blue-500/10 text-blue-500 ring-blue-500/20',
  Processing: 'bg-purple-500/10 text-purple-500 ring-purple-500/20',
  Delivered: 'bg-green-500/10 text-green-500 ring-green-500/20',
  Cancelled: 'bg-red-500/10 text-red-500 ring-red-500/20',
};

export function StatusBadge({ status, className = '' }: { status: OrderStatus | string; className?: string }) {
  const style = statusStyles[status as OrderStatus] || 'bg-gray-500/10 text-gray-500 ring-gray-500/20';
  
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${style} ${className}`}>
      {status}
    </span>
  );
}
