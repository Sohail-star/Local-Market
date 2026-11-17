import React from 'react';
import {
  Ban,
  CheckCircle2,
  Clock,
  MessageSquare,
  PauseCircle,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { BookingStatus, EnquiryStatus, ListingStatus } from '../types/marketplace';

type AnyStatus = BookingStatus | ListingStatus | EnquiryStatus | 'Confirmed — Preparing Dispatch' | 'Delivered';

interface StatusBadgeProps {
  status: AnyStatus;
}

const STATUS_STYLE: Record<
  AnyStatus,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  Pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  Accepted: {
    bg: 'bg-emerald-50',
    text: 'text-[#1D8348]',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Rejected: {
    bg: 'bg-red-50',
    text: 'text-[#B42318]',
    border: 'border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  Completed: {
    bg: 'bg-[#FFF4D6]',
    text: 'text-[#593B2A]',
    border: 'border-[#EADBC2]',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Cancelled: {
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
    icon: <Ban className="w-3.5 h-3.5" />,
  },
  Active: {
    bg: 'bg-emerald-50',
    text: 'text-[#1D8348]',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Paused: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <PauseCircle className="w-3.5 h-3.5" />,
  },
  Sold: {
    bg: 'bg-[#FFF4D6]',
    text: 'text-[#593B2A]',
    border: 'border-[#EADBC2]',
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
  },
  Open: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  Replied: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  Resolved: {
    bg: 'bg-emerald-50',
    text: 'text-[#1D8348]',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  'Confirmed — Preparing Dispatch': {
    bg: 'bg-emerald-50',
    text: 'text-[#1D8348]',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  Delivered: {
    bg: 'bg-[#FFF4D6]',
    text: 'text-[#593B2A]',
    border: 'border-[#EADBC2]',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold whitespace-nowrap ${style.bg} ${style.text} ${style.border}`}
    >
      {style.icon}
      <span>{status}</span>
    </span>
  );
};
