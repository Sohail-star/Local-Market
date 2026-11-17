import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  Check,
  Heart,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  User,
} from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import { ServiceCard } from '../../components/ServiceCard';
import { StatusBadge } from '../../components/StatusBadge';
import { UserAvatar } from '../../components/UserAvatar';
import {
  BookingStatus,
  MarketplaceEnquiry,
  NotificationItem,
  OrderRecord,
  Product,
  ServiceBooking,
  ServiceItem,
  UserAccount,
  UserCapabilities,
} from '../../types/marketplace';

interface CustomerDashboardPageProps {
  user: UserAccount;
  products: Product[];
  services: ServiceItem[];
  favoriteProductIds: string[];
  favoriteServiceIds: string[];
  onToggleFavoriteProduct: (id: string) => void;
  onToggleFavoriteService: (id: string) => void;
  onAddToCart: (p: Product) => void;
  onContactService: (s: ServiceItem) => void;
  orders: OrderRecord[];
  bookings: ServiceBooking[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  enquiries: MarketplaceEnquiry[];
  notifications: NotificationItem[];
  onMarkAllNotificationsRead: () => void;
  onToggleCapability?: (cap: keyof UserCapabilities) => void;
}

type CustomerTab =
  | 'overview'
  | 'profile'
  | 'favorites'
  | 'enquiries'
  | 'orders'
  | 'requests'
  | 'notifications'
  | 'settings';

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({
  user,
  products,
  services,
  favoriteProductIds,
  favoriteServiceIds,
  onToggleFavoriteProduct,
  onToggleFavoriteService,
  onAddToCart,
  onContactService,
  orders,
  bookings,
  onUpdateBookingStatus,
  enquiries,
  notifications,
  onMarkAllNotificationsRead,
  onToggleCapability,
}) => {
  const [tab, setTab] = useState<CustomerTab>('overview');

  const savedProducts = products.filter((p) => favoriteProductIds.includes(p.id));
  const savedServices = services.filter((s) => favoriteServiceIds.includes(s.id));
  const mySentEnquiries = enquiries.filter(
    (e) => e.senderUserId === user.id || e.senderName.toLowerCase() === user.name.toLowerCase()
  );
  const myServiceRequests = bookings.filter(
    (b) =>
      b.customerId === user.id ||
      b.customerName.toLowerCase() === user.name.toLowerCase() ||
      !b.providerOwnerId
  );

  const tabs: { id: CustomerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-3.5 h-3.5" /> },
    {
      id: 'favorites',
      label: `My Favorites (${savedProducts.length + savedServices.length})`,
      icon: <Heart className="w-3.5 h-3.5" />,
    },
    {
      id: 'enquiries',
      label: `My Enquiries (${mySentEnquiries.length})`,
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    {
      id: 'orders',
      label: `My Orders (${orders.length})`,
      icon: <Package className="w-3.5 h-3.5" />,
    },
    {
      id: 'requests',
      label: `Service Requests (${myServiceRequests.length})`,
      icon: <CalendarCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'notifications',
      label: `Notifications (${notifications.filter((n) => !n.read).length})`,
      icon: <Bell className="w-3.5 h-3.5" />,
    },
    { id: 'settings', label: 'Account Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#382619]">
              Customer Dashboard
            </h1>
            <p className="text-xs text-[#6F5643] mt-0.5">
              Track your saved favorites, product orders, service bookings, enquiries, and account
              preferences.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/buy-sell"
              className="px-3.5 py-2 rounded-xl border border-[#D8C5A5] text-xs font-bold text-[#382619] hover:bg-[#FFF9ED]"
            >
              Browse Products
            </Link>
            <Link
              to="/services"
              className="px-3.5 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-xs font-extrabold text-[#382619]"
            >
              Find Services
            </Link>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0E3CC]">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                tab === item.id
                  ? 'bg-[#593B2A] text-[#F5B82E]'
                  : 'bg-[#FFF9ED] text-[#593B2A] hover:bg-[#FFF2D6]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#382619]">
                Recent Orders ({orders.length})
              </h2>
              <button
                type="button"
                onClick={() => setTab('orders')}
                className="text-xs font-bold text-[#593B2A] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>
            {orders.length === 0 ? (
              <p className="text-xs text-[#6F5643]">No product orders placed yet.</p>
            ) : (
              orders.slice(0, 2).map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-[#382619]">
                    <span>Order #{ord.id}</span>
                    <span className="text-[#B8320A] tabular-nums">
                      Rs. {ord.total.toLocaleString('en-PK')}
                    </span>
                  </div>
                  <p className="text-[#5C432D]">
                    {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')}
                  </p>
                  <StatusBadge status={ord.status} />
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#382619]">
                My Service Requests ({myServiceRequests.length})
              </h2>
              <button
                type="button"
                onClick={() => setTab('requests')}
                className="text-xs font-bold text-[#593B2A] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>
            {myServiceRequests.length === 0 ? (
              <p className="text-xs text-[#6F5643]">No service bookings requested yet.</p>
            ) : (
              myServiceRequests.slice(0, 2).map((bk) => (
                <div
                  key={bk.id}
                  className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#382619] truncate">{bk.serviceTitle}</p>
                    <p className="text-[11px] text-[#6F5643] tabular-nums">
                      {bk.providerName} · {bk.date}
                    </p>
                  </div>
                  <StatusBadge status={bk.status} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
              <div>
                <h2 className="font-display text-xl font-bold text-[#382619]">{user.name}</h2>
                <p className="text-xs text-[#6F5643]">
                  {user.email} · {user.phone}
                </p>
                <p className="text-xs text-[#593B2A] font-semibold mt-0.5">
                  {user.area}, {user.city}, {user.province}
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/profile"
              className="px-4 py-2 rounded-xl bg-[#593B2A] text-white text-xs font-bold"
            >
              Edit Full Profile
            </Link>
          </div>
        </section>
      )}

      {tab === 'favorites' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-5">
          {savedProducts.length === 0 && savedServices.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Heart className="w-9 h-9 text-[#D2BA94] mx-auto" />
              <p className="font-display text-base font-bold text-[#382619]">
                No saved favorites yet
              </p>
              <p className="text-xs text-[#6F5643]">
                Tap the heart icon on any product or service card to save it here.
              </p>
            </div>
          ) : (
            <>
              {savedProducts.length > 0 && (
                <div>
                  <h2 className="font-display text-base font-bold text-[#382619] mb-3">
                    Saved Products ({savedProducts.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        isFavorite={true}
                        onToggleFavorite={onToggleFavoriteProduct}
                        onAddToCart={onAddToCart}
                      />
                    ))}
                  </div>
                </div>
              )}
              {savedServices.length > 0 && (
                <div>
                  <h2 className="font-display text-base font-bold text-[#382619] mb-3">
                    Saved Service Providers ({savedServices.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedServices.map((s) => (
                      <ServiceCard
                        key={s.id}
                        service={s}
                        isFavorite={true}
                        onToggleFavorite={onToggleFavoriteService}
                        onContactService={onContactService}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'enquiries' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#382619]">My Enquiries</h2>
          {mySentEnquiries.length === 0 ? (
            <p className="text-xs text-[#6F5643] py-6 text-center">
              You have not sent any product or service enquiries yet.
            </p>
          ) : (
            <div className="space-y-3">
              {mySentEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 space-y-1.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-[#382619]">
                      {enq.targetTitle} · <span className="text-[#593B2A]">{enq.recipientName}</span>
                    </p>
                    <StatusBadge status={enq.status} />
                  </div>
                  <p className="text-[#4A3523]">{enq.message}</p>
                  {enq.replyNote && (
                    <p className="text-[#1D8348] font-semibold bg-white border border-[#EADBC2] rounded-lg px-3 py-2">
                      Seller Reply: {enq.replyNote}
                    </p>
                  )}
                  <p className="text-[11px] text-[#6F5643]">
                    {enq.locationLabel} · {enq.createdAt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'orders' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#382619]">My Orders</h2>
          {orders.length === 0 ? (
            <p className="text-xs text-[#6F5643] py-6 text-center">
              No product orders yet. Add products to your cart from Buy &amp; Sell.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#382619]">
                      Order #{ord.id} · {ord.paymentMethod}
                    </span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <p className="text-[#4A3523]">
                    {ord.items.map((i) => `${i.quantity}× ${i.title}`).join(', ')}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6F5643]">
                    <span>
                      {ord.address} ({ord.city}) · {ord.createdAt}
                    </span>
                    <span className="font-extrabold text-sm text-[#B8320A] tabular-nums">
                      Rs. {ord.total.toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'requests' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#382619]">
              My Service Requests
            </h2>
            <Link
              to="/dashboard/bookings"
              className="text-xs font-bold text-[#593B2A] hover:underline"
            >
              Open Booking Manager →
            </Link>
          </div>
          {myServiceRequests.length === 0 ? (
            <p className="text-xs text-[#6F5643] py-6 text-center">
              No service requests yet. Browse local providers to book a visit.
            </p>
          ) : (
            <div className="space-y-3">
              {myServiceRequests.map((bk) => (
                <div
                  key={bk.id}
                  className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-[#382619]">
                        {bk.serviceTitle} ({bk.id})
                      </p>
                      <StatusBadge status={bk.status} />
                    </div>
                    <p className="text-[#5C432D]">
                      Provider: <strong>{bk.providerName}</strong> · {bk.neighborhood}, {bk.city}
                    </p>
                    <p className="text-[11px] text-[#6F5643] tabular-nums">
                      {bk.date} · {bk.timeSlot} · From Rs. {bk.startingPrice.toLocaleString('en-PK')}
                    </p>
                  </div>
                  {(bk.status === 'Pending' || bk.status === 'Accepted') && (
                    <button
                      type="button"
                      onClick={() => onUpdateBookingStatus(bk.id, 'Cancelled')}
                      className="px-3.5 py-2 rounded-lg border border-[#D8C5A5] bg-white hover:bg-stone-100 text-xs font-bold text-[#382619] self-start sm:self-center cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'notifications' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#382619]">Notifications</h2>
            <button
              type="button"
              onClick={onMarkAllNotificationsRead}
              className="text-xs font-bold text-[#593B2A] hover:underline cursor-pointer"
            >
              Mark all read
            </button>
          </div>
          <div className="divide-y divide-[#F0E3CC]">
            {notifications.map((n) => (
              <div key={n.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <p className={`font-bold ${n.read ? 'text-[#5C432D]' : 'text-[#382619]'}`}>
                    {n.title}
                  </p>
                  <p className="text-[#6F5643] mt-0.5">{n.message}</p>
                </div>
                <span className="text-[11px] text-[#8A7158] shrink-0">{n.time}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#382619]">Account Settings</h2>
            <p className="text-xs text-[#6F5643] mt-0.5">
              Activate additional marketplace capabilities on your single LocalMarket account or
              open full profile and password settings.
            </p>
          </div>

          {onToggleCapability && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { key: 'buy', title: 'Buy Products', desc: 'Shop local products and place orders' },
                  { key: 'sell', title: 'Sell Products', desc: 'Publish listings in Seller Dashboard' },
                  {
                    key: 'offerServices',
                    title: 'Offer Services',
                    desc: 'Accept job bookings in Provider Dashboard',
                  },
                  {
                    key: 'hireProviders',
                    title: 'Hire Service Providers',
                    desc: 'Book trusted local technicians',
                  },
                ] as const
              ).map((item) => {
                const active = user.capabilities[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onToggleCapability(item.key)}
                    aria-pressed={active}
                    className={`text-left rounded-xl border p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      active ? 'bg-[#FFF4D6] border-[#593B2A]' : 'bg-[#FFF9ED] border-[#EADBC2]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#382619]">{item.title}</p>
                      <p className="text-[11px] text-[#6F5643] mt-0.5">{item.desc}</p>
                    </div>
                    <span
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-[#593B2A] border-[#593B2A] text-[#F5B82E]'
                          : 'bg-white border-[#D8C5A5]'
                      }`}
                    >
                      {active && <Check className="w-4 h-4 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <Link
            to="/dashboard/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#593B2A] text-white text-xs font-bold"
          >
            <Settings className="w-4 h-4 text-[#F5B82E]" />
            <span>Open Profile &amp; Password Settings</span>
          </Link>
        </section>
      )}
    </div>
  );
};
