import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Check,
  Heart,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Users,
  Wrench,
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import {
  MarketplaceEnquiry,
  NotificationItem,
  OrderRecord,
  Product,
  ServiceBooking,
  ServiceItem,
  UserAccount,
  UserCapabilities,
} from '../../types/marketplace';

interface DashboardOverviewPageProps {
  user: UserAccount;
  onToggleCapability: (cap: keyof UserCapabilities) => void;
  favoritesCount: number;
  orders: OrderRecord[];
  bookings: ServiceBooking[];
  enquiries: MarketplaceEnquiry[];
  myProducts: Product[];
  myServices: ServiceItem[];
  notifications: NotificationItem[];
}

export const DashboardOverviewPage: React.FC<DashboardOverviewPageProps> = ({
  user,
  onToggleCapability,
  favoritesCount,
  orders,
  bookings,
  enquiries,
  myProducts,
  myServices,
  notifications,
}) => {
  const pendingBookings = bookings.filter((b) => b.status === 'Pending');
  const unreadNotifs = notifications.filter((n) => !n.read);

  const capabilityOptions: {
    key: keyof UserCapabilities;
    label: string;
    sub: string;
    icon: React.ReactNode;
    route?: string;
  }[] = [
    {
      key: 'buy',
      label: 'Buy Products',
      sub: 'Shop marketplace & track orders',
      icon: <ShoppingCart className="w-4 h-4 text-[#593B2A]" />,
      route: '/buy-sell',
    },
    {
      key: 'sell',
      label: 'Sell Products',
      sub: 'Manage product store & buyer enquiries',
      icon: <Store className="w-4 h-4 text-[#593B2A]" />,
      route: '/dashboard/seller',
    },
    {
      key: 'offerServices',
      label: 'Offer Services',
      sub: 'List skills & handle booking requests',
      icon: <Wrench className="w-4 h-4 text-[#593B2A]" />,
      route: '/dashboard/provider',
    },
    {
      key: 'hireProviders',
      label: 'Hire Service Providers',
      sub: 'Book verified technicians & artisans',
      icon: <Users className="w-4 h-4 text-[#593B2A]" />,
      route: '/services',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#6F5643]">
            Dashboard Overview · {user.area}, {user.city}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619] mt-0.5">
            Assalam-o-Alaikum, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#6F5643] mt-1">
            Use one LocalMarket account across buying, selling, and offering or hiring local
            services.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/dashboard/seller"
            className="px-4 py-2 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Store className="w-3.5 h-3.5 text-[#F5B82E]" />
            <span>Sell Product</span>
          </Link>
          <Link
            to="/dashboard/provider"
            className="px-4 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Offer Service</span>
          </Link>
        </div>
      </section>

      {/* KPI Metrics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          to="/dashboard/customer"
          className="bg-white rounded-xl border border-[#EADBC2] p-4 hover:border-[#F5B82E] transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F5643]">
            <span>Saved Favorites</span>
            <Heart className="w-4 h-4 text-[#D92D20]" />
          </div>
          <p className="font-display text-2xl font-extrabold text-[#382619] mt-2 tabular-nums">
            {favoritesCount}
          </p>
          <p className="text-[11px] text-[#6F5643] mt-0.5">Products &amp; providers</p>
        </Link>

        <Link
          to="/dashboard/customer"
          className="bg-white rounded-xl border border-[#EADBC2] p-4 hover:border-[#F5B82E] transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F5643]">
            <span>Orders &amp; Enquiries</span>
            <PackageCheck className="w-4 h-4 text-[#593B2A]" />
          </div>
          <p className="font-display text-2xl font-extrabold text-[#382619] mt-2 tabular-nums">
            {orders.length + enquiries.length}
          </p>
          <p className="text-[11px] text-[#6F5643] mt-0.5">
            {orders.length} orders · {enquiries.length} enquiries
          </p>
        </Link>

        <Link
          to="/dashboard/seller"
          className="bg-white rounded-xl border border-[#EADBC2] p-4 hover:border-[#F5B82E] transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F5643]">
            <span>Seller Listings</span>
            <ShoppingBag className="w-4 h-4 text-[#C98A09]" />
          </div>
          <p className="font-display text-2xl font-extrabold text-[#382619] mt-2 tabular-nums">
            {myProducts.length}
          </p>
          <p className="text-[11px] text-[#6F5643] mt-0.5">
            {myProducts.filter((p) => (p.status ?? 'Active') === 'Active').length} active in catalog
          </p>
        </Link>

        <Link
          to="/dashboard/bookings"
          className="bg-white rounded-xl border border-[#EADBC2] p-4 hover:border-[#F5B82E] transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F5643]">
            <span>Service Bookings</span>
            <CalendarCheck className="w-4 h-4 text-[#1D8348]" />
          </div>
          <p className="font-display text-2xl font-extrabold text-[#382619] mt-2 tabular-nums">
            {bookings.length}
          </p>
          <p className="text-[11px] text-[#6F5643] mt-0.5">
            {pendingBookings.length} pending · {myServices.length} services
          </p>
        </Link>
      </section>

      {/* Multi-Capability Management Card */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#382619]">
              Account Capabilities (Single Unified Account)
            </h2>
            <p className="text-xs text-[#6F5643]">
              Activate or pause buying, selling, offering services, and hiring professionals anytime.
            </p>
          </div>
          <Link
            to="/dashboard/profile"
            className="text-xs font-bold text-[#593B2A] hover:underline inline-flex items-center gap-1"
          >
            <span>Full Profile Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {capabilityOptions.map((item) => {
            const active = user.capabilities[item.key];
            return (
              <div
                key={item.key}
                className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                  active ? 'bg-[#FFF9ED] border-[#F5B82E]' : 'bg-white border-[#EADBC2]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EADBC2] flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#382619]">{item.label}</p>
                    <p className="text-[11px] text-[#6F5643] truncate">{item.sub}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleCapability(item.key)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#593B2A] text-[#F5B82E]'
                      : 'bg-[#FFF4D6] text-[#382619] hover:bg-[#F5B82E]'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  <span>{active ? 'Active' : 'Activate'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Bookings & Notifications Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base sm:text-lg font-bold text-[#382619]">
              Recent Booking Requests
            </h2>
            <Link
              to="/dashboard/bookings"
              className="text-xs font-bold text-[#593B2A] hover:underline"
            >
              Manage All →
            </Link>
          </div>

          {bookings.length === 0 ? (
            <p className="text-xs text-[#6F5643] py-6 text-center">No booking requests yet.</p>
          ) : (
            <div className="divide-y divide-[#F0E3CC]">
              {bookings.slice(0, 4).map((bk) => (
                <div
                  key={bk.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#382619] truncate">
                      {bk.serviceTitle} ({bk.id})
                    </p>
                    <p className="text-[11px] text-[#6F5643] tabular-nums">
                      {bk.customerName} · {bk.neighborhood}, {bk.city} · {bk.date}
                    </p>
                  </div>
                  <StatusBadge status={bk.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base sm:text-lg font-bold text-[#382619] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#C98A09]" />
              <span>Notifications ({unreadNotifs.length} new)</span>
            </h2>
            <Link
              to="/dashboard/notifications"
              className="text-xs font-bold text-[#593B2A] hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="divide-y divide-[#F0E3CC]">
            {notifications.slice(0, 4).map((notif) => (
              <div key={notif.id} className="py-2.5 space-y-0.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-bold ${notif.read ? 'text-[#5C432D]' : 'text-[#382619]'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-[#8A7158] shrink-0">{notif.time}</span>
                </div>
                <p className="text-[11px] text-[#6F5643] leading-snug">{notif.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
