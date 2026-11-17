import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  Menu,
  ShoppingBag,
  Sparkles,
  Store,
  UserCog,
  UserPlus,
  Wrench,
  X,
} from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { UserAccount } from '../types/marketplace';

interface DashboardLayoutProps {
  user: UserAccount | null;
  unreadNotificationsCount: number;
  pendingBookingsCount: number;
  onDemoSignIn: () => void;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  unreadNotificationsCount,
  pendingBookingsCount,
  onDemoSignIn,
  onLogout,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!user) {
    return (
      <section className="max-w-2xl mx-auto my-6 bg-white rounded-2xl border border-[#EADBC2] p-6 sm:p-10 text-center space-y-5 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF4D6] border border-[#EADBC2] text-[#593B2A] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
            Sign In to Access Your Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#6F5643] max-w-md mx-auto leading-relaxed">
            Manage your favorites, orders, seller products, service listings, booking requests, and
            account capabilities from one unified LocalMarket dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4 text-[#F5B82E]" />
            <span>Go to Login</span>
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-xl border border-[#D8C5A5] bg-white hover:bg-[#FFF9ED] text-[#382619] text-xs sm:text-sm font-bold inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-[#593B2A]" />
            <span>Create Account</span>
          </Link>
          <button
            type="button"
            onClick={onDemoSignIn}
            className="px-5 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Continue with Demo Account</span>
          </button>
        </div>

        <p className="text-[11px] text-[#8A7158]">
          Frontend-only protected view · Real route authorization will be enforced on the backend
          later.
        </p>
      </section>
    );
  }

  const navItems: {
    to: string;
    label: string;
    icon: React.ReactNode;
    end?: boolean;
    badge?: number | string;
    muted?: boolean;
  }[] = [
    {
      to: '/dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      end: true,
    },
    {
      to: '/dashboard/customer',
      label: 'Customer Hub',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      to: '/dashboard/seller',
      label: 'Seller Dashboard',
      icon: <Store className="w-4 h-4" />,
      badge: user.capabilities.sell ? undefined : 'Off',
      muted: !user.capabilities.sell,
    },
    {
      to: '/dashboard/provider',
      label: 'Provider Dashboard',
      icon: <Wrench className="w-4 h-4" />,
      badge: user.capabilities.offerServices ? undefined : 'Off',
      muted: !user.capabilities.offerServices,
    },
    {
      to: '/dashboard/bookings',
      label: 'Booking Requests',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
    },
    {
      to: '/dashboard/notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    {
      to: '/dashboard/profile',
      label: 'Profile & Settings',
      icon: <UserCog className="w-4 h-4" />,
    },
  ];

  const activeCapabilities = [
    user.capabilities.buy && 'Buy',
    user.capabilities.sell && 'Sell',
    user.capabilities.offerServices && 'Services',
    user.capabilities.hireProviders && 'Hire',
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {/* Compact Mobile/Tablet Header + Horizontal Scroll Nav */}
      <div className="lg:hidden bg-white rounded-2xl border border-[#EADBC2] p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#382619] truncate">{user.name}</p>
              <p className="text-[11px] text-[#6F5643] truncate">
                {user.area}, {user.city}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="px-3 py-1.5 rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] text-xs font-bold text-[#382619] inline-flex items-center gap-1.5 cursor-pointer"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>Menu</span>
          </button>
        </div>

        {/* Horizontal Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#F5B82E] text-[#382619]'
                    : 'bg-[#FFF9ED] text-[#593B2A] hover:bg-[#FFF2D6]'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded bg-[#593B2A] text-[#F5B82E] text-[10px] font-bold tabular-nums">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {mobileNavOpen && (
          <div className="pt-2 border-t border-[#F0E3CC] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#6F5643]">
              Capabilities: <strong className="text-[#382619]">{activeCapabilities.join(' · ') || 'None'}</strong>
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-[#B42318] inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop 2-Column Workspace Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-[#EADBC2] overflow-hidden sticky top-[84px]">
          <div className="p-4 bg-[#593B2A] text-white space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold truncate">{user.name}</p>
                <p className="text-[11px] text-[#E9D8BA] truncate">
                  {user.area}, {user.city}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-white/15 flex flex-wrap gap-1.5">
              {activeCapabilities.length === 0 ? (
                <span className="text-[11px] text-[#E9D8BA]">No capabilities enabled</span>
              ) : (
                activeCapabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-0.5 rounded bg-white/10 text-[#F5B82E] text-[10px] font-bold"
                  >
                    {cap}
                  </span>
                ))
              )}
            </div>
          </div>

          <nav className="p-2.5 space-y-1" aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
                    isActive
                      ? 'bg-[#F5B82E] text-[#382619]'
                      : item.muted
                      ? 'text-[#8A7158] hover:bg-[#FFF9ED]'
                      : 'text-[#382619] hover:bg-[#FFF9ED]'
                  }`
                }
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined ? (
                  <span className="px-1.5 py-0.5 rounded bg-[#593B2A] text-[#F5B82E] text-[10px] font-bold tabular-nums">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-45 shrink-0" />
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-[#F0E3CC] bg-[#FFF9ED]">
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-[#B42318] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Dashboard Viewport */}
        <div className="lg:col-span-9 min-w-0 space-y-5">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
