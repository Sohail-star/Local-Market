import React from 'react';
import { Outlet } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { CartDrawer } from '../components/CartDrawer';
import {
  ActivityModal,
  AuthModal,
  ProviderListingModal,
  SellerListingModal,
  SupportModal,
} from '../components/MarketplaceModals';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/SecondaryViews';
import { ServiceBookingModal } from '../components/ServiceBookingModal';
import { TopUtilityBar } from '../components/TopUtilityBar';
import {
  CartItem,
  CityName,
  NotificationItem,
  OrderRecord,
  Product,
  ServiceBooking,
  ServiceItem,
  UserAccount,
} from '../types/marketplace';

interface MainLayoutProps {
  selectedCity: CityName;
  onSelectCity: (city: CityName) => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onOpenSupport: (mode: 'help' | 'contact') => void;
  onOpenProviderModal: () => void;
  onOpenSellerModal: () => void;
  onFocusSearch: () => void;
  cart: CartItem[];
  cartOpen: boolean;
  favoritesCount: number;
  onOpenCart: () => void;
  onCloseCart: () => void;
  onUpdateCartQty: (id: string, delta: number) => void;
  onRemoveCartItem: (id: string) => void;
  onPlaceOrder: (order: OrderRecord) => void;
  user: UserAccount | null;
  authMode: 'login' | 'signup' | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onCloseAuth: () => void;
  onAuthenticate: (user: UserAccount) => void;
  onLogout: () => void;
  activityOpen: boolean;
  onOpenActivity: () => void;
  onCloseActivity: () => void;
  orders: OrderRecord[];
  bookings: ServiceBooking[];
  contactService: ServiceItem | null;
  onCloseContactService: () => void;
  onConfirmBooking: (booking: ServiceBooking) => void;
  sellerModalOpen: boolean;
  onCloseSellerModal: () => void;
  onCreateProduct: (p: Product) => void;
  providerModalOpen: boolean;
  onCloseProviderModal: () => void;
  onCreateService: (s: ServiceItem) => void;
  supportMode: 'help' | 'contact' | null;
  onCloseSupport: () => void;
  toastMessage: string | null;
  onDismissToast: () => void;
  onSocialClick: (network: string) => void;
  unreadMessagesCount?: number;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  selectedCity,
  onSelectCity,
  notifications,
  onMarkAllRead,
  onOpenSupport,
  onOpenProviderModal,
  onOpenSellerModal,
  onFocusSearch,
  cart,
  cartOpen,
  favoritesCount,
  onOpenCart,
  onCloseCart,
  onUpdateCartQty,
  onRemoveCartItem,
  onPlaceOrder,
  user,
  authMode,
  onOpenAuth,
  onCloseAuth,
  onAuthenticate,
  onLogout,
  activityOpen,
  onOpenActivity,
  onCloseActivity,
  orders,
  bookings,
  contactService,
  onCloseContactService,
  onConfirmBooking,
  sellerModalOpen,
  onCloseSellerModal,
  onCreateProduct,
  providerModalOpen,
  onCloseProviderModal,
  onCreateService,
  supportMode,
  onCloseSupport,
  toastMessage,
  onDismissToast,
  onSocialClick,
  unreadMessagesCount = 0,
}) => {
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9ED] text-[#382619]">
      <TopUtilityBar
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
        onOpenHelp={() => onOpenSupport('help')}
        onOpenContact={() => onOpenSupport('contact')}
        onOpenProviderModal={onOpenProviderModal}
      />

      <Navbar
        onFocusSearch={onFocusSearch}
        cartCount={cartCount}
        favoritesCount={favoritesCount}
        onOpenCart={onOpenCart}
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenActivity={onOpenActivity}
        onOpenProviderModal={onOpenProviderModal}
        onOpenSellerModal={onOpenSellerModal}
        onOpenSupport={onOpenSupport}
        ordersAndBookingsCount={orders.length + bookings.length}
        unreadMessagesCount={unreadMessagesCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <Outlet />
      </main>

      <Footer
        onSelectCity={onSelectCity}
        onOpenSupport={onOpenSupport}
        onSocialClick={onSocialClick}
      />

      {/* Global Interactive Modals & Drawers */}
      <ServiceBookingModal
        service={contactService}
        onClose={onCloseContactService}
        onConfirmBooking={onConfirmBooking}
      />

      <CartDrawer
        open={cartOpen}
        onClose={onCloseCart}
        items={cart}
        defaultCity={selectedCity}
        onUpdateQty={onUpdateCartQty}
        onRemoveItem={onRemoveCartItem}
        onPlaceOrder={onPlaceOrder}
      />

      <SellerListingModal
        open={sellerModalOpen}
        onClose={onCloseSellerModal}
        defaultCity={selectedCity}
        onCreateProduct={onCreateProduct}
      />

      <ProviderListingModal
        open={providerModalOpen}
        onClose={onCloseProviderModal}
        defaultCity={selectedCity}
        onCreateService={onCreateService}
      />

      <AuthModal
        mode={authMode}
        onClose={onCloseAuth}
        onSwitchMode={onOpenAuth}
        onAuthenticate={onAuthenticate}
      />

      <SupportModal mode={supportMode} onClose={onCloseSupport} />

      <ActivityModal
        open={activityOpen}
        onClose={onCloseActivity}
        orders={orders}
        bookings={bookings}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#382619] text-white px-4 py-3 rounded-xl shadow-xl border border-[#F5B82E]/40 flex items-center gap-2.5 text-xs font-semibold max-w-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-[#F5B82E] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={onDismissToast}
            className="ml-1 text-white/70 hover:text-white cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
