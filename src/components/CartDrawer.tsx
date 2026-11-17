import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { CITIES } from '../data/marketplaceData';
import { CartItem, CityName, OrderRecord } from '../types/marketplace';
import { SmartImage } from './SmartImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  defaultCity: CityName;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onPlaceOrder: (order: OrderRecord) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onClose,
  items,
  defaultCity,
  onUpdateQty,
  onRemoveItem,
  onPlaceOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState<string>(
    defaultCity === 'All Cities' ? 'Peshawar' : defaultCity
  );
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<OrderRecord['paymentMethod']>(
    'Cash on Delivery'
  );
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= 20000 || subtotal === 0 ? 0 : 250;
  const total = subtotal + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const order: OrderRecord = {
      id: `LM-${Math.floor(1000 + Math.random() * 9000)}`,
      items: items.map((i) => ({
        title: i.product.title,
        quantity: i.quantity,
        price: i.product.price,
      })),
      total,
      paymentMethod,
      city,
      address: address.trim(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      status: 'Confirmed — Preparing Dispatch',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onPlaceOrder(order);
    setConfirmedOrder(order);
  };

  const handleClose = () => {
    setConfirmedOrder(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[#EADBC2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EADBC2] bg-[#FFF8EA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#3A1F0D]" />
            <h2 className="font-display text-lg font-bold text-[#2B1609]">
              Your Cart ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-[#3A1F0D] cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {confirmedOrder ? (
            <div className="py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#1D8348] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-[#2B1609]">
                Order #{confirmedOrder.id} Confirmed
              </h3>
              <p className="text-xs text-[#5C432D] mt-1">{confirmedOrder.status}</p>

              <div className="mt-5 rounded-xl bg-[#FFF8EA] border border-[#EADBC2] p-4 text-left text-xs space-y-2">
                {confirmedOrder.items.map((item) => (
                  <div key={item.title} className="flex justify-between gap-2">
                    <span className="text-[#2B1609] font-medium">
                      {item.quantity}x {item.title}
                    </span>
                    <span className="font-bold tabular-nums">
                      Rs. {(item.price * item.quantity).toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#EADBC2] flex justify-between font-bold text-sm text-[#B8320A]">
                  <span>Total ({confirmedOrder.paymentMethod})</span>
                  <span className="tabular-nums">
                    Rs. {confirmedOrder.total.toLocaleString('en-PK')}
                  </span>
                </div>
                <p className="text-[11px] text-[#70553E] pt-1">
                  Delivering to: {confirmedOrder.address}, {confirmedOrder.city}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="mt-5 w-full py-2.5 rounded-lg bg-[#3A1F0D] text-white text-sm font-bold cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-[#D2BA94] mx-auto mb-3" />
              <p className="font-bold text-[#2B1609]">Your cart is empty</p>
              <p className="text-xs text-[#70553E] mt-1">
                Browse featured products to add items for local delivery or pickup.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Items List */}
              <div className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex gap-3 p-3 rounded-xl border border-[#EFE3CE] bg-[#FFFDF9]"
                  >
                    <div className="w-16 h-16 rounded-lg bg-white border border-[#F0E3CC] overflow-hidden shrink-0">
                      <SmartImage
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#2B1609] truncate">
                          {product.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          className="text-[#8A7158] hover:text-[#D92D20] cursor-pointer"
                          aria-label={`Remove ${product.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs font-bold text-[#B8320A] mt-0.5 tabular-nums">
                        Rs. {product.price.toLocaleString('en-PK')}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="inline-flex items-center border border-[#D8C5A5] rounded-md bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[#FFF5DC] cursor-pointer"
                            aria-label="Decrease item quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[#FFF5DC] cursor-pointer"
                            aria-label="Increase item quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl bg-[#FFF8EA] border border-[#EADBC2] p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between text-[#5C432D]">
                  <span>Subtotal</span>
                  <span className="font-semibold tabular-nums">
                    Rs. {subtotal.toLocaleString('en-PK')}
                  </span>
                </div>
                <div className="flex justify-between text-[#5C432D]">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#1D8348]" />
                    Delivery (Free over Rs. 20,000)
                  </span>
                  <span className="font-semibold tabular-nums">
                    {deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#EADBC2] flex justify-between text-sm font-extrabold text-[#2B1609]">
                  <span>Total Payable</span>
                  <span className="text-[#B8320A] tabular-nums">
                    Rs. {total.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-3 pt-1">
                <h3 className="font-display text-sm font-bold text-[#2B1609] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#C98A09]" />
                  <span>Delivery &amp; Payment Details</span>
                </h3>

                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name *"
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-xs focus:outline-none focus:border-[#3A1F0D]"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (03XX-...) *"
                    className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-xs tabular-nums focus:outline-none focus:border-[#3A1F0D]"
                  />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-[#D8C5A5] px-2.5 py-2 text-xs bg-white focus:outline-none focus:border-[#3A1F0D]"
                  >
                    {CITIES.filter((c) => c !== 'All Cities').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address / Landmark *"
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-xs focus:outline-none focus:border-[#3A1F0D]"
                />

                <div className="grid grid-cols-3 gap-1.5">
                  {(['Cash on Delivery', 'EasyPaisa', 'JazzCash'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-[#F5B727] border-[#C98A09] text-[#2B1609]'
                          : 'bg-white border-[#D8C5A5] text-[#5C432D]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-[#3A1F0D] hover:bg-[#2B1609] text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Confirm Order · Rs. {total.toLocaleString('en-PK')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
