import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle2, MessageSquare, Package, Wrench, XCircle } from 'lucide-react';
import { NotificationCategory, NotificationItem } from '../../types/marketplace';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

type NotifFilter = 'all' | 'unread' | NotificationCategory;

const FILTER_OPTIONS: { id: NotifFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'product_enquiry', label: 'Product Enquiries' },
  { id: 'service_request', label: 'Service Requests' },
  { id: 'booking_accepted', label: 'Booking Accepted' },
  { id: 'booking_rejected', label: 'Booking Rejected' },
  { id: 'listing_update', label: 'Listing Updates' },
];

function iconForType(type?: NotificationCategory) {
  switch (type) {
    case 'product_enquiry':
      return <MessageSquare className="w-4 h-4 text-[#593B2A]" />;
    case 'service_request':
      return <Wrench className="w-4 h-4 text-[#C98A09]" />;
    case 'booking_accepted':
      return <CheckCircle2 className="w-4 h-4 text-[#1D8348]" />;
    case 'booking_rejected':
      return <XCircle className="w-4 h-4 text-[#B42318]" />;
    case 'listing_update':
      return <Package className="w-4 h-4 text-[#593B2A]" />;
    default:
      return <Bell className="w-4 h-4 text-[#C98A09]" />;
  }
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [filter, setFilter] = useState<NotifFilter>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#382619] flex items-center gap-2">
              <Bell className="w-6 h-6 text-[#C98A09]" />
              <span>Notifications ({unreadCount} unread)</span>
            </h1>
            <p className="text-xs text-[#6F5643] mt-0.5">
              Alerts for product enquiries, new service requests, booking accept/reject updates, and
              listing changes.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="px-4 py-2 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[#F5B82E]" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0E3CC]">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                filter === opt.id
                  ? 'bg-[#F5B82E] text-[#382619]'
                  : 'bg-[#FFF9ED] text-[#593B2A] hover:bg-[#FFF2D6]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-[#EADBC2] divide-y divide-[#F0E3CC] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Bell className="w-9 h-9 text-[#B89B78] mx-auto" />
            <p className="font-display text-base font-bold text-[#382619]">
              No notifications in this category
            </p>
            <p className="text-xs text-[#6F5643]">
              Submit an enquiry, update a listing, or accept/reject a booking to see live alerts.
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                n.read ? 'bg-white' : 'bg-[#FFF9ED]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#EADBC2] flex items-center justify-center shrink-0 mt-0.5">
                  {iconForType(n.type)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#382619]">{n.title}</p>
                    {!n.read && (
                      <span className="px-2 py-0.5 rounded bg-[#F5B82E] text-[#382619] text-[10px] font-bold">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5C432D] mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-[#8A7158] mt-1">{n.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.linkTo && (
                  <Link
                    to={n.linkTo}
                    onClick={() => onMarkRead(n.id)}
                    className="px-3 py-1.5 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF2D6] text-xs font-bold text-[#593B2A]"
                  >
                    Open
                  </Link>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#593B2A] text-white text-xs font-bold cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
