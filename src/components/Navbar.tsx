import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  ChevronDown,
  Heart,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  UserCog,
  UserPlus,
  Wrench,
  X,
} from 'lucide-react';
import { PRODUCT_CATEGORY_GROUP, SERVICE_CATEGORY_GROUPS } from '../data/categories';
import { UserAccount } from '../types/marketplace';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  onFocusSearch: () => void;
  cartCount: number;
  favoritesCount: number;
  onOpenCart: () => void;
  user: UserAccount | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onOpenActivity: () => void;
  onOpenProviderModal: () => void;
  onOpenSellerModal: () => void;
  onOpenSupport: (mode: 'help' | 'contact') => void;
  ordersAndBookingsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onFocusSearch,
  cartCount,
  favoritesCount,
  onOpenCart,
  user,
  onOpenAuth,
  onLogout,
  onOpenActivity,
  onOpenProviderModal,
  onOpenSellerModal,
  onOpenSupport,
  ordersAndBookingsCount,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-[#EADBC2] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-left shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-[#F5B82E]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#593B2A] flex items-center justify-center shadow-xs shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#F5B82E]" />
          </div>
          <div className="leading-tight">
            <span className="font-display text-xl font-extrabold tracking-tight text-[#382619] whitespace-nowrap">
              Local<span className="text-[#F5B82E]">Market</span>
            </span>
            <p className="text-[11px] font-medium text-[#6F5643] hidden xl:block whitespace-nowrap">
              Buy · Sell · Find Services
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              isActive('/')
                ? 'bg-[#F5B82E] text-[#382619]'
                : 'text-[#382619] hover:bg-[#FFF9ED]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <Link
            to="/buy-sell"
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              isActive('/buy-sell')
                ? 'bg-[#F5B82E] text-[#382619] font-semibold'
                : 'text-[#382619] hover:bg-[#FFF9ED]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy &amp; Sell</span>
          </Link>

          <Link
            to="/services"
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              isActive('/services')
                ? 'bg-[#F5B82E] text-[#382619] font-semibold'
                : 'text-[#382619] hover:bg-[#FFF9ED]'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Services</span>
          </Link>

          {/* Categories Dropdown */}
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatMenuOpen((o) => !o)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive('/categories')
                  ? 'bg-[#F5B82E] text-[#382619] font-semibold'
                  : 'text-[#382619] hover:bg-[#FFF9ED]'
              }`}
              aria-expanded={catMenuOpen}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Categories</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {catMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-[420px] bg-white rounded-xl shadow-xl border border-[#EADBC2] p-3 z-50 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#593B2A] px-2 pb-1.5 border-b border-[#F3E9D7]">
                    Product Categories
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {PRODUCT_CATEGORY_GROUP.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCatMenuOpen(false);
                          navigate(`/categories/${encodeURIComponent(item.slug.toLowerCase())}`);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] cursor-pointer"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#593B2A] px-2 pb-1.5 border-b border-[#F3E9D7]">
                    Service Groups
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {SERVICE_CATEGORY_GROUPS.map((grp) => (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => {
                          setCatMenuOpen(false);
                          navigate(`/categories#${grp.id}`);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] cursor-pointer"
                      >
                        {grp.title}
                      </button>
                    ))}
                  </div>
                  <Link
                    to="/categories"
                    onClick={() => setCatMenuOpen(false)}
                    className="mt-2 block text-center py-1.5 px-2 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-bold"
                  >
                    All Categories →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/about"
            className={`px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              isActive('/about')
                ? 'bg-[#F5B82E] text-[#382619] font-semibold'
                : 'text-[#382619] hover:bg-[#FFF9ED]'
            }`}
          >
            About
          </Link>

          <Link
            to="/blog"
            className={`px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              isActive('/blog')
                ? 'bg-[#F5B82E] text-[#382619] font-semibold'
                : 'text-[#382619] hover:bg-[#FFF9ED]'
            }`}
          >
            Blog
          </Link>

          {/* More Dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((o) => !o)}
              className="px-2.5 py-2 rounded-lg text-sm font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-expanded={moreMenuOpen}
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {moreMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#EADBC2] py-1.5 z-50 text-xs">
                <Link
                  to="/favorites"
                  onClick={() => setMoreMenuOpen(false)}
                  className="px-3.5 py-2 font-semibold text-[#382619] hover:bg-[#FFF9ED] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-[#D92D20]" />
                    <span>Saved Favorites</span>
                  </span>
                  <span className="tabular-nums font-bold text-[#593B2A]">{favoritesCount}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenSellerModal();
                  }}
                  className="w-full text-left px-3.5 py-2 font-semibold text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-[#593B2A]" />
                  <span>Become a Seller</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenProviderModal();
                  }}
                  className="w-full text-left px-3.5 py-2 font-semibold text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#F5B82E]" />
                  <span>Become a Service Provider</span>
                </button>
                <div className="my-1 border-t border-[#F3E9D7]" />
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenSupport('help');
                  }}
                  className="w-full text-left px-3.5 py-2 text-[#382619] hover:bg-[#FFF9ED] cursor-pointer"
                >
                  Help Center
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenSupport('contact');
                  }}
                  className="w-full text-left px-3.5 py-2 text-[#382619] hover:bg-[#FFF9ED] cursor-pointer"
                >
                  Contact Support
                </button>
                <Link
                  to="/privacy"
                  onClick={() => setMoreMenuOpen(false)}
                  className="block px-3.5 py-2 text-[#382619] hover:bg-[#FFF9ED]"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  onClick={() => setMoreMenuOpen(false)}
                  className="block px-3.5 py-2 text-[#382619] hover:bg-[#FFF9ED]"
                >
                  Terms &amp; Conditions
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onFocusSearch}
            className="w-9 h-9 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Search LocalMarket"
            title="Search marketplace"
          >
            <Search className="w-4 h-4 stroke-[2.4]" />
          </button>

          <Link
            to="/favorites"
            className={`relative h-9 px-2.5 rounded-lg border flex items-center gap-1 transition-colors shrink-0 ${
              isActive('/favorites')
                ? 'border-[#D92D20] bg-red-50 text-[#D92D20]'
                : 'border-[#EADBC2] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-[#382619]'
            }`}
            aria-label={`Favorites (${favoritesCount} saved)`}
            title="Saved Favorites"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-[#D92D20] text-[#D92D20]' : ''}`} />
            {favoritesCount > 0 && (
              <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-[#D92D20] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {favoritesCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative h-9 px-2.5 rounded-lg border border-[#EADBC2] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-[#382619] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <ShoppingCart className="w-4 h-4 text-[#593B2A]" />
            <span className="hidden xl:inline text-xs font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#593B2A] text-[#F5B82E] text-[11px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative hidden sm:block" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="h-9 pl-1.5 pr-3 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                <span className="max-w-[90px] truncate">{user.name}</span>
                {ordersAndBookingsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-[#F5B82E] text-[#382619] text-[10px] font-bold tabular-nums">
                    {ordersAndBookingsCount}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#EADBC2] py-1.5 z-50">
                  <div className="px-3.5 py-2.5 border-b border-[#F3E9D7]">
                    <p className="text-xs font-bold text-[#382619] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#6F5643] truncate">
                      {user.area}, {user.city}
                    </p>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="px-3.5 py-2 text-xs font-bold text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#C98A09]" />
                    <span>Dashboard Overview</span>
                  </Link>
                  <Link
                    to="/dashboard/customer"
                    onClick={() => setUserMenuOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#593B2A]" />
                    <span>Customer Hub</span>
                  </Link>
                  <Link
                    to="/dashboard/seller"
                    onClick={() => setUserMenuOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#593B2A]" />
                      <span>Seller Dashboard</span>
                    </span>
                    {!user.capabilities.sell && (
                      <span className="text-[10px] font-semibold text-[#8A7158]">Off</span>
                    )}
                  </Link>
                  <Link
                    to="/dashboard/provider"
                    onClick={() => setUserMenuOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#593B2A]" />
                      <span>Provider Dashboard</span>
                    </span>
                    {!user.capabilities.offerServices && (
                      <span className="text-[10px] font-semibold text-[#8A7158]">Off</span>
                    )}
                  </Link>
                  <Link
                    to="/dashboard/bookings"
                    onClick={() => setUserMenuOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2"
                  >
                    <CalendarCheck className="w-4 h-4 text-[#1D8348]" />
                    <span>Booking Requests</span>
                  </Link>
                  <Link
                    to="/dashboard/notifications"
                    onClick={() => setUserMenuOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4 text-[#C98A09]" />
                    <span>Notifications</span>
                  </Link>
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2"
                  >
                    <UserCog className="w-4 h-4 text-[#593B2A]" />
                    <span>Profile &amp; Capabilities</span>
                  </Link>

                  <div className="my-1 border-t border-[#F3E9D7]" />

                  <button
                    type="button"
                    onClick={() => {
                      onOpenActivity();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#382619] hover:bg-[#FFF9ED] flex items-center gap-2 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4 text-[#593B2A]" />
                    <span>Quick Orders &amp; Bookings ({ordersAndBookingsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#B42318] hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 px-3 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF9ED] text-[#382619] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#593B2A]" />
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 px-3.5 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#F5B82E]" />
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden w-9 h-9 rounded-lg border border-[#EADBC2] bg-white flex items-center justify-center text-[#382619] cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EADBC2] bg-white px-4 py-4 space-y-2.5 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/', label: 'Home' },
              { to: '/buy-sell', label: 'Buy & Sell' },
              { to: '/services', label: 'Services' },
              { to: '/categories', label: 'All Categories' },
              { to: '/favorites', label: `Favorites (${favoritesCount})` },
              { to: '/search', label: 'Search' },
              { to: '/about', label: 'About' },
              { to: '/blog', label: 'Blog' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
                  isActive(item.to)
                    ? 'bg-[#F5B82E] text-[#382619]'
                    : 'bg-[#FFF9ED] text-[#382619]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onOpenSellerModal();
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2.5 rounded-lg bg-[#593B2A] text-white text-xs font-bold cursor-pointer"
            >
              Become a Seller
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenProviderModal();
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2.5 rounded-lg bg-[#F5B82E] text-[#382619] text-xs font-bold cursor-pointer"
            >
              Become a Service Provider
            </button>
          </div>

          {!user ? (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F3E9D7]">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-lg border border-[#D8C5A5] font-semibold text-sm text-center text-[#382619]"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-lg bg-[#593B2A] text-white font-semibold text-sm text-center"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#F3E9D7] flex items-center justify-between gap-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2 rounded-lg bg-[#F5B82E] text-[#382619] text-xs font-extrabold inline-flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{user.name} · Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-[#B42318] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
