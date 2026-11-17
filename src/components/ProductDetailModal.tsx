import React, { useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { Product } from '../types/marketplace';
import { SmartImage } from './SmartImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  if (!product) return null;

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    setInquirySent(true);
    setInquiryText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-5 py-3.5 border-b border-[#F0E3CC] flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#70553E]">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C98A09]" />
              {product.city}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#FFF5DC] flex items-center justify-center text-[#3A1F0D] cursor-pointer"
            aria-label="Close product details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Image */}
          <div className="rounded-xl bg-[#FBF9F5] border border-[#EFE3CE] aspect-[4/3] overflow-hidden flex items-center justify-center">
            <SmartImage
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain p-4"
              fallbackLabel={product.title}
            />
          </div>

          {/* Right Purchase Module */}
          <div className="flex flex-col">
            <h2 className="font-display text-2xl font-extrabold text-[#2B1609]">
              {product.title}
            </h2>

            <div className="mt-1.5 flex items-center gap-2 text-xs text-[#5C432D]">
              <span className="inline-flex items-center gap-1 font-bold text-[#2B1609] tabular-nums">
                <Star className="w-4 h-4 fill-[#F5B727] text-[#F5B727]" />
                {product.rating.toFixed(1)}
              </span>
              <span className="tabular-nums">({product.reviewCount} reviews)</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#1D8348] font-semibold">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-[#B8320A] tabular-nums">
                Rs. {product.price.toLocaleString('en-PK')}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-[#9C846C] line-through tabular-nums">
                  Rs. {product.originalPrice.toLocaleString('en-PK')}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-[#4A3523] leading-relaxed">{product.description}</p>

            {/* Key Specs */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {product.specs.map((spec) => (
                <div
                  key={spec}
                  className="bg-[#FFF8EA] border border-[#EFE3CE] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#3A1F0D]"
                >
                  {spec}
                </div>
              ))}
            </div>

            {/* Seller & Delivery Info */}
            <div className="mt-4 pt-3 border-t border-[#F0E3CC] space-y-1.5 text-xs text-[#5C432D]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1D8348]" />
                <span>
                  Seller: <strong className="text-[#2B1609]">{product.sellerName}</strong>
                  {product.sellerVerified && ' (Verified)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#C98A09]" />
                <span>{product.deliveryEstimate}</span>
              </div>
            </div>

            {/* Quantity & Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <div className="flex items-center border border-[#D8C5A5] rounded-lg bg-[#FFFDF9]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-10 flex items-center justify-center text-[#3A1F0D] hover:bg-[#FFF5DC] rounded-l-lg cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-9 text-center text-sm font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-9 h-10 flex items-center justify-center text-[#3A1F0D] hover:bg-[#FFF5DC] rounded-r-lg cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 h-10 px-4 rounded-lg bg-[#F5B727] hover:bg-[#E5A617] text-[#2B1609] text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => onBuyNow(product, quantity)}
                className="h-10 px-4 rounded-lg bg-[#3A1F0D] hover:bg-[#2B1609] text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Message Seller */}
        <div className="px-5 sm:px-6 pb-6 pt-2">
          <div className="rounded-xl bg-[#FFF8EA] border border-[#EADBC2] p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3A1F0D] mb-2">
              <MessageSquare className="w-4 h-4 text-[#C98A09]" />
              <span>Ask {product.sellerName} a quick question</span>
            </div>
            {inquirySent ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1D8348]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Message sent! The seller typically replies within 15 minutes.</span>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="Is local pickup available today? Any warranty details?"
                  className="flex-1 rounded-lg border border-[#D8C5A5] bg-white px-3 py-2 text-xs text-[#2B1609] focus:outline-none focus:border-[#3A1F0D]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3A1F0D] hover:bg-[#2B1609] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
