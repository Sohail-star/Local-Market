import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { SubmittedEnquiryPayload } from './components/EnquiryModals';
import { AboutSection, BlogSection } from './components/SecondaryViews';
import {
  DEMO_INITIAL_BOOKINGS,
  DEMO_INITIAL_ENQUIRIES,
  DEMO_INITIAL_ORDERS,
  DEMO_USER_ACCOUNT,
  DEMO_USER_PRODUCTS,
  DEMO_USER_SERVICES,
  PHASE3_INITIAL_NOTIFICATIONS,
} from './data/dashboardSeed';
import {
  INITIAL_NOTIFICATIONS,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
} from './data/marketplaceData';
import { DashboardLayout } from './layouts/DashboardLayout';
import { MainLayout } from './layouts/MainLayout';
import { BuySellPage } from './pages/BuySellPage';
import { CategorySlugPage, PolicyPage, SearchResultsPage } from './pages/CatalogPages';
import { CategoriesPage } from './pages/CategoriesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ServiceProfilePage } from './pages/ServiceProfilePage';
import { ServicesPage } from './pages/ServicesPage';
import { SignupPage } from './pages/SignupPage';
import { AccountProfilePage } from './pages/dashboard/AccountProfilePage';
import { BookingsManagementPage } from './pages/dashboard/BookingsManagementPage';
import { CustomerDashboardPage } from './pages/dashboard/CustomerDashboardPage';
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { ProviderDashboardPage } from './pages/dashboard/ProviderDashboardPage';
import { SellerDashboardPage } from './pages/dashboard/SellerDashboardPage';
import { AdminDashboardBlueprintPage } from './pages/admin/AdminDashboardBlueprintPage';
import {
  BookingStatus,
  CartItem,
  CityName,
  MarketplaceEnquiry,
  NotificationItem,
  OrderRecord,
  Product,
  ServiceBooking,
  ServiceItem,
  UserAccount,
  UserCapabilities,
} from './types/marketplace';

const FAV_PRODUCTS_KEY = 'localmarket_fav_products';
const FAV_SERVICES_KEY = 'localmarket_fav_services';
const SESSION_USER_KEY = 'localmarket_session_profile';

function loadStoredIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Loads non-sensitive user profile metadata only (never stores passwords).
 */
function loadStoredSession(): UserAccount | null {
  try {
    const raw =
      window.localStorage.getItem(SESSION_USER_KEY) ??
      window.sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserAccount>;
    if (!parsed || typeof parsed.name !== 'string' || typeof parsed.email !== 'string') {
      return null;
    }
    return {
      id: parsed.id || `usr-${Date.now()}`,
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone || '0300-0000000',
      province: parsed.province || 'Khyber Pakhtunkhwa',
      city: parsed.city || 'Peshawar',
      area: parsed.area || 'University Road',
      avatarUrl: parsed.avatarUrl,
      capabilities: parsed.capabilities ?? {
        buy: true,
        sell: false,
        offerServices: false,
        hireProviders: true,
      },
      role: parsed.role ?? 'Buyer',
      memberSince: parsed.memberSince || 'Nov 2026',
    };
  } catch {
    return null;
  }
}

function saveSessionProfile(account: UserAccount | null, rememberMe: boolean) {
  try {
    window.localStorage.removeItem(SESSION_USER_KEY);
    window.sessionStorage.removeItem(SESSION_USER_KEY);
    if (!account) return;
    const serialized = JSON.stringify(account);
    if (rememberMe) {
      window.localStorage.setItem(SESSION_USER_KEY, serialized);
    } else {
      window.sessionStorage.setItem(SESSION_USER_KEY, serialized);
    }
  } catch {
    // Ignore storage quota errors
  }
}

function AppRoutes() {
  const navigate = useNavigate();

  const [selectedCity, setSelectedCity] = useState<CityName>('Peshawar');
  const [selectedArea, setSelectedArea] = useState<string>('All Areas');
  const [searchQuery, setSearchQuery] = useState('');

  const [user, setUser] = useState<UserAccount | null>(() => loadStoredSession());
  const [rememberSession, setRememberSession] = useState<boolean>(() => {
    try {
      return Boolean(window.localStorage.getItem(SESSION_USER_KEY));
    } catch {
      return true;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => [
    ...DEMO_USER_PRODUCTS,
    ...INITIAL_PRODUCTS,
  ]);
  const [services, setServices] = useState<ServiceItem[]>(() => [
    ...DEMO_USER_SERVICES,
    ...INITIAL_SERVICES,
  ]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    loadStoredIds(FAV_PRODUCTS_KEY)
  );
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>(() =>
    loadStoredIds(FAV_SERVICES_KEY)
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>(DEMO_INITIAL_ORDERS);
  const [bookings, setBookings] = useState<ServiceBooking[]>(DEMO_INITIAL_BOOKINGS);
  const [enquiries, setEnquiries] = useState<MarketplaceEnquiry[]>(DEMO_INITIAL_ENQUIRIES);

  const [contactService, setContactService] = useState<ServiceItem | null>(null);
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [supportMode, setSupportMode] = useState<'help' | 'contact' | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => [
    ...PHASE3_INITIAL_NOTIFICATIONS,
    ...INITIAL_NOTIFICATIONS,
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAV_PRODUCTS_KEY, JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAV_SERVICES_KEY, JSON.stringify(favoriteServiceIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteServiceIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  const pushNotification = (notif: Omit<NotificationItem, 'id' | 'time' | 'read'>) => {
    setNotifications((prev) => [
      {
        ...notif,
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        time: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleAuthenticate = (account: UserAccount, rememberMe = true) => {
    setUser(account);
    setRememberSession(rememberMe);
    saveSessionProfile(account, rememberMe);
    setSelectedCity(account.city);
    setSelectedArea('All Areas');
    showToast(`Welcome, ${account.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    saveSessionProfile(null, false);
    showToast('Signed out of LocalMarket');
    navigate('/');
  };

  const handleUpdateProfile = (updated: UserAccount) => {
    setUser(updated);
    saveSessionProfile(updated, rememberSession);
    showToast('Account profile updated');
  };

  const handleToggleCapability = (cap: keyof UserCapabilities) => {
    if (!user) return;
    const nextEnabled = !user.capabilities[cap];
    const updated: UserAccount = {
      ...user,
      capabilities: {
        ...user.capabilities,
        [cap]: nextEnabled,
      },
    };
    setUser(updated);
    saveSessionProfile(updated, rememberSession);
    const labelMap: Record<keyof UserCapabilities, string> = {
      buy: 'Buy Products',
      sell: 'Sell Products',
      offerServices: 'Offer Services',
      hireProviders: 'Hire Service Providers',
    };
    showToast(`${labelMap[cap]} ${nextEnabled ? 'activated' : 'paused'}`);
  };

  const handleToggleFavorite = (productId: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(productId);
      showToast(exists ? 'Removed product from favorites' : 'Product saved to favorites');
      return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  };

  const handleToggleFavoriteService = (serviceId: string) => {
    setFavoriteServiceIds((prev) => {
      const exists = prev.includes(serviceId);
      showToast(exists ? 'Removed provider from favorites' : 'Service provider saved to favorites');
      return exists ? prev.filter((id) => id !== serviceId) : [...prev, serviceId];
    });
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(product.stock, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`${product.title} added to cart`);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handlePlaceOrder = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
    pushNotification({
      title: `Order #${order.id} Confirmed`,
      message: `${order.items.length} item(s) scheduled for ${order.city} (${order.paymentMethod}).`,
      type: 'listing_update',
      linkTo: '/dashboard/customer',
    });
    showToast(`Order #${order.id} placed (demo)`);
  };

  const handleConfirmBooking = (booking: ServiceBooking) => {
    const matchedService = services.find((s) => s.id === booking.serviceId);
    const enriched: ServiceBooking = {
      ...booking,
      customerId: user?.id,
      providerOwnerId: matchedService?.ownerId,
    };
    setBookings((prev) => [enriched, ...prev]);
    pushNotification({
      title: `New Service Request (${enriched.id})`,
      message: `${enriched.providerName} requested for ${enriched.date} (${enriched.timeSlot}).`,
      type: 'service_request',
      linkTo: '/dashboard/bookings',
    });
    showToast(`Service request ${enriched.id} submitted (demo)`);
  };

  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus) => {
    const target = bookings.find((b) => b.id === bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    if (target) {
      if (status === 'Accepted') {
        pushNotification({
          title: `Booking Accepted (${target.id})`,
          message: `${target.serviceTitle} with ${target.providerName} was accepted for ${target.date}.`,
          type: 'booking_accepted',
          linkTo: '/dashboard/bookings',
        });
      } else if (status === 'Rejected') {
        pushNotification({
          title: `Booking Rejected (${target.id})`,
          message: `${target.serviceTitle} request (${target.id}) was marked Rejected.`,
          type: 'booking_rejected',
          linkTo: '/dashboard/bookings',
        });
      } else {
        pushNotification({
          title: `Booking ${status} (${target.id})`,
          message: `${target.serviceTitle} status updated to ${status}.`,
          type: 'listing_update',
          linkTo: '/dashboard/bookings',
        });
      }
    }
    showToast(`Booking ${bookingId} marked ${status}`);
  };

  const handleRecordEnquiry = (payload: SubmittedEnquiryPayload) => {
    const isProduct = payload.target.kind === 'seller' || payload.target.targetId?.startsWith('prod-');
    const newEnquiry: MarketplaceEnquiry = {
      id: `ENQ-${Math.floor(100 + Math.random() * 900)}`,
      kind: isProduct ? 'product' : 'service',
      targetId: payload.target.targetId || 'listing',
      targetTitle: payload.target.subjectTitle,
      recipientName: payload.target.recipientName,
      senderName: payload.senderName,
      senderPhone: payload.senderPhone,
      channel: payload.target.kind,
      locationLabel: payload.target.locationLabel,
      message: payload.message,
      status: 'Open',
      createdAt: 'Just now',
      senderUserId: user?.id,
    };
    setEnquiries((prev) => [newEnquiry, ...prev]);
    pushNotification({
      title: isProduct ? 'New Product Enquiry' : 'New Service Request Enquiry',
      message: `${payload.senderName} sent an enquiry about ${payload.target.subjectTitle}.`,
      type: isProduct ? 'product_enquiry' : 'service_request',
      linkTo: '/dashboard/customer',
    });
  };

  const handleReplyEnquiry = (enquiryId: string, replyNote: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === enquiryId ? { ...e, replyNote, status: 'Replied' } : e))
    );
    showToast('Reply sent (demo)');
  };

  const handleCreateProduct = (newProduct: Product, redirectToPublic = true) => {
    const owned: Product = {
      ...newProduct,
      ownerId: newProduct.ownerId || user?.id,
      status: newProduct.status || 'Active',
    };
    setProducts((prev) => [owned, ...prev]);
    pushNotification({
      title: 'Listing Published',
      message: `"${owned.title}" is now ${owned.status} in ${owned.city}.`,
      type: 'listing_update',
      linkTo: '/dashboard/seller',
    });
    if (redirectToPublic) {
      setSelectedCity(owned.city);
      setSelectedArea('All Areas');
      navigate('/buy-sell');
    }
    showToast(`Published "${owned.title}" in ${owned.city}`);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    pushNotification({
      title: 'Listing Updated',
      message: `"${updated.title}" updated (${updated.status ?? 'Active'}).`,
      type: 'listing_update',
      linkTo: '/dashboard/seller',
    });
    showToast(`Updated "${updated.title}"`);
  };

  const handleDeleteProduct = (productId: string) => {
    const removed = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (removed) {
      pushNotification({
        title: 'Listing Deleted',
        message: `"${removed.title}" was removed from your seller listings.`,
        type: 'listing_update',
        linkTo: '/dashboard/seller',
      });
    }
    showToast('Product listing deleted');
  };

  const handleCreateService = (newService: ServiceItem, redirectToPublic = true) => {
    const owned: ServiceItem = {
      ...newService,
      ownerId: newService.ownerId || user?.id,
      status: newService.status || 'Active',
    };
    setServices((prev) => [owned, ...prev]);
    pushNotification({
      title: 'Service Listing Added',
      message: `"${owned.title}" is active in ${owned.city}.`,
      type: 'listing_update',
      linkTo: '/dashboard/provider',
    });
    if (redirectToPublic) {
      setSelectedCity(owned.city);
      setSelectedArea('All Areas');
      navigate('/services');
    }
    showToast(`Registered "${owned.title}" in ${owned.city}`);
  };

  const handleUpdateService = (updated: ServiceItem) => {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    pushNotification({
      title: 'Service Profile Updated',
      message: `"${updated.title}" details updated.`,
      type: 'listing_update',
      linkTo: '/dashboard/provider',
    });
    showToast(`Updated "${updated.title}"`);
  };

  const handleDeleteService = (serviceId: string) => {
    const removed = services.find((s) => s.id === serviceId);
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    if (removed) {
      pushNotification({
        title: 'Service Removed',
        message: `"${removed.title}" was removed from your provider listings.`,
        type: 'listing_update',
        linkTo: '/dashboard/provider',
      });
    }
    showToast('Service listing deleted');
  };

  const handleFocusSearch = () => {
    navigate('/search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const publicProducts = useMemo(
    () => products.filter((p) => (p.status ?? 'Active') === 'Active'),
    [products]
  );

  const publicServices = useMemo(
    () => services.filter((s) => (s.status ?? 'Active') === 'Active'),
    [services]
  );

  const totalFavoritesCount = favoriteIds.length + favoriteServiceIds.length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending').length;

  return (
    <Routes>
      <Route
        element={
          <MainLayout
            selectedCity={selectedCity}
            onSelectCity={(city) => {
              setSelectedCity(city);
              setSelectedArea('All Areas');
            }}
            notifications={notifications}
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onOpenSupport={(mode) => setSupportMode(mode)}
            onOpenProviderModal={() => setProviderModalOpen(true)}
            onOpenSellerModal={() => setSellerModalOpen(true)}
            onFocusSearch={handleFocusSearch}
            cart={cart}
            cartOpen={cartOpen}
            favoritesCount={totalFavoritesCount}
            onOpenCart={() => setCartOpen(true)}
            onCloseCart={() => setCartOpen(false)}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveCartItem={handleRemoveCartItem}
            onPlaceOrder={handlePlaceOrder}
            user={user}
            authMode={authMode}
            onOpenAuth={(mode) => setAuthMode(mode)}
            onCloseAuth={() => setAuthMode(null)}
            onAuthenticate={(account) => handleAuthenticate(account, true)}
            onLogout={handleLogout}
            activityOpen={activityOpen}
            onOpenActivity={() => setActivityOpen(true)}
            onCloseActivity={() => setActivityOpen(false)}
            orders={orders}
            bookings={bookings}
            contactService={contactService}
            onCloseContactService={() => setContactService(null)}
            onConfirmBooking={handleConfirmBooking}
            sellerModalOpen={sellerModalOpen}
            onCloseSellerModal={() => setSellerModalOpen(false)}
            onCreateProduct={(p) => handleCreateProduct(p, true)}
            providerModalOpen={providerModalOpen}
            onCloseProviderModal={() => setProviderModalOpen(false)}
            onCreateService={(s) => handleCreateService(s, true)}
            supportMode={supportMode}
            onCloseSupport={() => setSupportMode(null)}
            toastMessage={toastMessage}
            onDismissToast={() => setToastMessage(null)}
            onSocialClick={(network) =>
              showToast(`LocalMarket ${network} community page (demo link)`)
            }
          />
        }
      >
        <Route
          path="/"
          element={
            <HomePage
              products={publicProducts}
              services={publicServices}
              selectedCity={selectedCity}
              onSelectCity={(city) => {
                setSelectedCity(city);
                setSelectedArea('All Areas');
              }}
              selectedArea={selectedArea}
              onSelectArea={setSelectedArea}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              favoriteIds={favoriteIds}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavorite={handleToggleFavorite}
              onToggleFavoriteService={handleToggleFavoriteService}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onContactService={(s) => setContactService(s)}
              onOpenSellerModal={() => setSellerModalOpen(true)}
              onOpenProviderModal={() => setProviderModalOpen(true)}
              onOpenContactSupport={() => setSupportMode('contact')}
              searchInputRef={searchInputRef}
            />
          }
        />

        <Route
          path="/login"
          element={
            <LoginPage
              defaultCity={selectedCity}
              onAuthenticate={handleAuthenticate}
            />
          }
        />

        <Route
          path="/signup"
          element={
            <SignupPage
              defaultCity={selectedCity}
              onAuthenticate={handleAuthenticate}
            />
          }
        />

        {/* Phase 3 Dashboards */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout
              user={user}
              unreadNotificationsCount={unreadNotifsCount}
              pendingBookingsCount={pendingBookingsCount}
              onDemoSignIn={() => handleAuthenticate(DEMO_USER_ACCOUNT, true)}
              onLogout={handleLogout}
            />
          }
        >
          <Route
            index
            element={
              user ? (
                <DashboardOverviewPage
                  user={user}
                  onToggleCapability={handleToggleCapability}
                  favoritesCount={totalFavoritesCount}
                  orders={orders}
                  bookings={bookings}
                  enquiries={enquiries}
                  myProducts={products.filter(
                    (p) =>
                      p.ownerId === user.id ||
                      p.sellerName.toLowerCase() === user.name.toLowerCase()
                  )}
                  myServices={services.filter(
                    (s) =>
                      s.ownerId === user.id ||
                      s.providerName.toLowerCase().includes(user.name.toLowerCase())
                  )}
                  notifications={notifications}
                />
              ) : null
            }
          />
          <Route
            path="customer"
            element={
              user ? (
                <CustomerDashboardPage
                  user={user}
                  products={products}
                  services={services}
                  favoriteProductIds={favoriteIds}
                  favoriteServiceIds={favoriteServiceIds}
                  onToggleFavoriteProduct={handleToggleFavorite}
                  onToggleFavoriteService={handleToggleFavoriteService}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onContactService={(s) => setContactService(s)}
                  orders={orders}
                  bookings={bookings}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                  enquiries={enquiries}
                  notifications={notifications}
                  onMarkAllNotificationsRead={() =>
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                  }
                  onToggleCapability={handleToggleCapability}
                />
              ) : null
            }
          />
          <Route
            path="seller"
            element={
              user ? (
                <SellerDashboardPage
                  user={user}
                  onActivateSellerCapability={() => handleToggleCapability('sell')}
                  products={products}
                  onCreateProduct={(p) => handleCreateProduct(p, false)}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  enquiries={enquiries}
                  onReplyEnquiry={handleReplyEnquiry}
                />
              ) : null
            }
          />
          <Route
            path="provider"
            element={
              user ? (
                <ProviderDashboardPage
                  user={user}
                  onActivateProviderCapability={() => handleToggleCapability('offerServices')}
                  services={services}
                  onCreateService={(s) => handleCreateService(s, false)}
                  onUpdateService={handleUpdateService}
                  onDeleteService={handleDeleteService}
                  bookings={bookings}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                  enquiries={enquiries}
                  onReplyEnquiry={handleReplyEnquiry}
                />
              ) : null
            }
          />
          <Route
            path="bookings"
            element={
              user ? (
                <BookingsManagementPage
                  user={user}
                  bookings={bookings}
                  onUpdateBookingStatus={handleUpdateBookingStatus}
                />
              ) : null
            }
          />
          <Route
            path="notifications"
            element={
              user ? (
                <NotificationsPage
                  notifications={notifications}
                  onMarkRead={(id) =>
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                    )
                  }
                  onMarkAllRead={() =>
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                  }
                />
              ) : null
            }
          />
          <Route
            path="profile"
            element={
              user ? (
                <AccountProfilePage
                  user={user}
                  onUpdateProfile={handleUpdateProfile}
                  onToggleCapability={handleToggleCapability}
                  onNotifyToast={showToast}
                />
              ) : null
            }
          />
        </Route>

        <Route
          path="/buy-sell"
          element={
            <BuySellPage
              products={publicProducts}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onOpenSellerModal={() => setSellerModalOpen(true)}
            />
          }
        />

        <Route
          path="/services"
          element={
            <ServicesPage
              services={publicServices}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavoriteService={handleToggleFavoriteService}
              onContactService={(s) => setContactService(s)}
              onOpenProviderModal={() => setProviderModalOpen(true)}
            />
          }
        />

        <Route path="/categories" element={<CategoriesPage />} />

        <Route
          path="/categories/:slug"
          element={
            <CategorySlugPage
              products={publicProducts}
              services={publicServices}
              favoriteIds={favoriteIds}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavorite={handleToggleFavorite}
              onToggleFavoriteService={handleToggleFavoriteService}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onContactService={(s) => setContactService(s)}
            />
          }
        />

        <Route
          path="/search"
          element={
            <SearchResultsPage
              products={publicProducts}
              services={publicServices}
              favoriteIds={favoriteIds}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavorite={handleToggleFavorite}
              onToggleFavoriteService={handleToggleFavoriteService}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onContactService={(s) => setContactService(s)}
            />
          }
        />

        <Route
          path="/favorites"
          element={
            <FavoritesPage
              products={publicProducts}
              services={publicServices}
              favoriteProductIds={favoriteIds}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavoriteProduct={handleToggleFavorite}
              onToggleFavoriteService={handleToggleFavoriteService}
              onAddToCart={(p) => handleAddToCart(p, 1)}
              onContactService={(s) => setContactService(s)}
            />
          }
        />

        <Route
          path="/products/:id"
          element={
            <ProductDetailPage
              products={products}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setCartOpen(true)}
              onRecordEnquiry={handleRecordEnquiry}
            />
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductDetailPage
              products={products}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setCartOpen(true)}
              onRecordEnquiry={handleRecordEnquiry}
            />
          }
        />

        <Route
          path="/services/:id"
          element={
            <ServiceProfilePage
              services={services}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavoriteService={handleToggleFavoriteService}
              onContactService={(s) => setContactService(s)}
              onRecordEnquiry={handleRecordEnquiry}
            />
          }
        />
        <Route
          path="/service/:id"
          element={
            <ServiceProfilePage
              services={services}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavoriteService={handleToggleFavoriteService}
              onContactService={(s) => setContactService(s)}
              onRecordEnquiry={handleRecordEnquiry}
            />
          }
        />

        <Route
          path="/about"
          element={
            <AboutSection
              onOpenSeller={() => setSellerModalOpen(true)}
              onOpenProvider={() => setProviderModalOpen(true)}
            />
          }
        />

        <Route
          path="/admin-blueprint"
          element={
            <AdminDashboardBlueprintPage
              totalProducts={publicProducts.length}
              totalServices={publicServices.length}
            />
          }
        />

        <Route path="/blog" element={<BlogSection />} />
        <Route path="/privacy" element={<PolicyPage kind="privacy" />} />
        <Route path="/terms" element={<PolicyPage kind="terms" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
