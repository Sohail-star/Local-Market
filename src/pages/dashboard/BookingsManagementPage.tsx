import React, { useState } from 'react';
import { CalendarCheck, Check, CheckCircle2, X } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { BookingStatus, ServiceBooking, UserAccount } from '../../types/marketplace';

interface BookingsManagementPageProps {
  user: UserAccount;
  bookings: ServiceBooking[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
}

const ALL_STATUSES: ('All' | BookingStatus)[] = [
  'All',
  'Pending',
  'Accepted',
  'Rejected',
  'Completed',
  'Cancelled',
];

export const BookingsManagementPage: React.FC<BookingsManagementPageProps> = ({
  user,
  bookings,
  onUpdateBookingStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | BookingStatus>('All');
  const [perspective, setPerspective] = useState<'all' | 'incoming' | 'sent'>('all');

  const filtered = bookings.filter((b) => {
    const statusOk = statusFilter === 'All' || b.status === statusFilter;
    const isIncoming = b.providerOwnerId === user.id;
    const isSent = !isIncoming;
    const perspectiveOk =
      perspective === 'all' || (perspective === 'incoming' ? isIncoming : isSent);
    return statusOk && perspectiveOk;
  });

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#382619] flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-[#C98A09]" />
              <span>Booking Request Management</span>
            </h1>
            <p className="text-xs text-[#6F5643] mt-0.5">
              Accept, reject, complete, or cancel service bookings across Pending, Accepted,
              Rejected, Completed, and Cancelled states.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-[#FFF9ED] border border-[#EADBC2]">
            {(
              [
                { id: 'all', label: 'All Requests' },
                { id: 'incoming', label: 'Provider Inbox' },
                { id: 'sent', label: 'My Requests' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPerspective(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  perspective === p.id ? 'bg-[#F5B82E] text-[#382619]' : 'text-[#593B2A]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0E3CC]">
          {ALL_STATUSES.map((status) => {
            const count =
              status === 'All'
                ? bookings.length
                : bookings.filter((b) => b.status === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors tabular-nums ${
                  statusFilter === status
                    ? 'bg-[#593B2A] text-[#F5B82E]'
                    : 'bg-[#FFF9ED] text-[#593B2A] hover:bg-[#FFF2D6]'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D8C5A5] p-10 text-center">
          <CalendarCheck className="w-10 h-10 text-[#B89B78] mx-auto mb-2" />
          <h2 className="font-display text-lg font-bold text-[#382619]">
            No bookings in &ldquo;{statusFilter}&rdquo;
          </h2>
          <p className="text-xs text-[#6F5643] mt-1">
            Switch status filters or book a service provider to test live status updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((bk) => {
            const isIncomingProviderRequest = bk.providerOwnerId === user.id;
            return (
              <article
                key={bk.id}
                className="bg-white rounded-2xl border border-[#EADBC2] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold text-[#382619]">
                      {bk.serviceTitle}
                    </span>
                    <span className="text-[11px] font-bold text-[#6F5643] tabular-nums">
                      #{bk.id}
                    </span>
                    <StatusBadge status={bk.status} />
                    <span className="text-[11px] font-semibold text-[#593B2A]">
                      {isIncomingProviderRequest ? 'Incoming Provider Job' : 'Customer Request'}
                    </span>
                  </div>

                  <p className="text-xs text-[#4A3523]">
                    Customer: <strong>{bk.customerName}</strong> ({bk.phone}) · Provider:{' '}
                    <strong>{bk.providerName}</strong>
                  </p>
                  <p className="text-xs text-[#6F5643] tabular-nums">
                    {bk.neighborhood}, {bk.city} · {bk.date} · {bk.timeSlot} · From Rs.{' '}
                    {bk.startingPrice.toLocaleString('en-PK')}
                  </p>
                  {bk.notes && (
                    <p className="text-xs text-[#5C432D] bg-[#FFF9ED] border border-[#F0E3CC] rounded-lg px-3 py-1.5">
                      {bk.notes}
                    </p>
                  )}
                </div>

                {/* Contextual Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {bk.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(bk.id, 'Accepted')}
                        className="px-3.5 py-2 rounded-lg bg-[#1D8348] hover:bg-[#166838] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(bk.id, 'Rejected')}
                        className="px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[#B42318] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {bk.status === 'Accepted' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(bk.id, 'Completed')}
                        className="px-3.5 py-2 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F5B82E]" />
                        <span>Mark Completed</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(bk.id, 'Cancelled')}
                        className="px-3.5 py-2 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF9ED] text-[#382619] text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {(bk.status === 'Rejected' || bk.status === 'Cancelled') && (
                    <button
                      type="button"
                      onClick={() => onUpdateBookingStatus(bk.id, 'Pending')}
                      className="px-3.5 py-2 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF9ED] text-[#593B2A] text-xs font-bold cursor-pointer"
                    >
                      Reopen as Pending
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
