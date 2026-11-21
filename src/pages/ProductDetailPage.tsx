import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Heart,
  MapPin,
  MessageCircle,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { EnquiryModal, EnquiryTarget, SubmittedEnquiryPayload } from '../components/EnquiryModals';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { startOrFindConversation } from '../services/chatApi';
import { Product, UserAccount } from '../types/marketplace';

interface ProductDetailPageProps {
  products: Product[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenCart: () => void;
  onRecordEnquiry?: (payload: SubmittedEnquiryPayload) => void;
  user?: UserAccount | null;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  products,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  onOpenCart,
  onRecordEnquiry,
  user,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [enquiryTarget, setEnquiryTarget] = useState<EnquiryTarget | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
  }, [id]);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="bg-white rounded-2xl border border-[#EADBC2] p-8 text-center">
        <h1 className="font-display text-xl font-bold text-[#382619]">Product Not Found</h1>
        <p className="text-sm text-[#6F5643] mt-1">
          The product listing you opened is no longer available.
        </p>
        <Link
          to="/buy-sell"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Buy &amp; Sell</span>
        </Link>
      </div>
    );
  }

  const gallery =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.image];
  const activeImage = gallery[selectedImageIdx] || product.image;
  const isFav = favoriteIds.includes(product.id);

  const relatedProducts = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category === product.category || p.city === product.city)
    )
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3.5 py-2 rounded-lg bg-white border border-[#EADBC2] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-xs text-[#6F5643]">
          <Link to="/" className="hover:underline">
            Home
          </Link>{' '}
          /{' '}
          <Link to="/buy-sell" className="hover:underline">
            Buy &amp; Sell
          </Link>{' '}
          / <span className="font-semibold text-[#382619]">{product.title}</span>
        </div>
      </div>

      {/* Main Product Detail Grid */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="rounded-2xl bg-[#FFF9ED]/70 border border-[#EFE3CE] aspect-[4/3] overflow-hidden flex items-center justify-center relative">
            <SmartImage
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-contain p-6"
              fallbackLabel={product.title}
            />
            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors ${
                isFav ? 'bg-[#D92D20] text-white' : 'bg-white text-[#593B2A] hover:text-[#D92D20]'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>

          {gallery.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-16 rounded-xl border overflow-hidden bg-[#FFF9ED] shrink-0 cursor-pointer transition-all ${
                    selectedImageIdx === idx
                      ? 'border-[#F5B82E] ring-2 ring-[#F5B82E]/50'
                      : 'border-[#EADBC2] opacity-75 hover:opacity-100'
                  }`}
                >
                  <SmartImage
                    src={imgUrl}
                    alt={`${product.title} view ${idx + 1}`}
                    className="w-full h-full object-contain p-1.5"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase & Seller Module */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6F5643]">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                product.condition === 'New'
                  ? 'text-[#1D8348] font-bold'
                  : 'text-[#593B2A] font-bold'
              }
            >
              Condition: {product.condition}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C98A09]" />
              {product.area}, {product.city}, {product.province}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619] mt-2">
            {product.title}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-xs text-[#5C432D] tabular-nums">
            <span className="inline-flex items-center gap-1 font-bold text-[#382619]">
              <Star className="w-4 h-4 fill-[#F5B82E] text-[#F5B82E]" />
              {product.rating.toFixed(1)}
            </span>
            <span>({product.reviewCount} sample reviews)</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1D8348] font-semibold">{product.stock} in stock</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-[#B8320A] tabular-nums">
              Rs. {product.price.toLocaleString('en-PK')}
            </span>
            {product.originalPrice && (
              <span className="text-base text-[#9C846C] line-through tabular-nums">
                Rs. {product.originalPrice.toLocaleString('en-PK')}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm text-[#4A3523] leading-relaxed">{product.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {product.specs.map((spec) => (
              <div
                key={spec}
                className="bg-[#FFF9ED] border border-[#EADBC2] rounded-lg px-3 py-2 text-xs font-medium text-[#382619]"
              >
                {spec}
              </div>
            ))}
          </div>

          {/* Seller Profile Card */}
          <div className="mt-5 p-4 rounded-xl bg-[#FFF9ED] border border-[#EADBC2] space-y-2 text-xs text-[#5C432D]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#593B2A] text-[#F5B82E] flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#382619]">{product.sellerName}</p>
                  <p className="text-[11px] text-[#6F5643] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Member since {product.sellerMemberSince} (Demo Profile)</span>
                  </p>
                </div>
              </div>
              {product.sellerVerified && (
                <span className="inline-flex items-center gap-1 text-[#1D8348] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Seller
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <Truck className="w-3.5 h-3.5 text-[#C98A09]" />
              <span>{product.deliveryEstimate}</span>
            </div>
          </div>

          {/* Primary OLX-Style Real-Time Chat CTA + Contact Actions */}
          <div className="mt-4 space-y-2.5">
            {chatError && (
              <p className="text-xs font-semibold text-[#B42318] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {chatError}
              </p>
            )}
            <button
              type="button"
              disabled={startingChat}
              onClick={async () => {
                setChatError(null);
                if (!user) {
                  navigate(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
                  return;
                }
                setStartingChat(true);
                try {
                  const res = await startOrFindConversation({
                    sellerId: product.ownerId,
                    productId: product.id,
                    listingType: 'PRODUCT',
                    listingRefId: product.id,
                    listingTitle: product.title,
                    listingPriceLabel: `Rs. ${product.price.toLocaleString('en-PK')}`,
                    listingImageUrl: product.image,
                    locationLabel: `${product.area}, ${product.city}`,
                    sellerName: product.sellerName,
                    sellerPhone: product.sellerPhone,
                    sellerCity: product.city,
                    sellerArea: product.area,
                    sellerProvince: product.province,
                  });
                  navigate(`/messages?chatId=${encodeURIComponent(res.conversation.id)}`);
                } catch (err) {
                  const status = (err as Error & { status?: number })?.status;
                  if (status === 401) {
                    navigate(`/login?redirect=${encodeURIComponent(`/products/${product.id}`)}`);
                    return;
                  }
                  setChatError(
                    err instanceof Error ? err.message : 'Unable to start chat with seller.'
                  );
                } finally {
                  setStartingChat(false);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] disabled:opacity-60 text-[#382619] text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{startingChat ? 'Opening Chat...' : 'Chat with Seller'}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setEnquiryTarget({
                    kind: 'seller',
                    targetId: product.id,
                    recipientName: product.sellerName,
                    subjectTitle: product.title,
                    phone: product.sellerPhone,
                    locationLabel: `${product.area}, ${product.city}`,
                  })
                }
                className="py-2.5 px-3 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#F5B82E]" />
                <span>Send Enquiry</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEnquiryTarget({
                    kind: 'whatsapp',
                    targetId: product.id,
                    recipientName: product.sellerName,
                    subjectTitle: product.title,
                    phone: product.sellerPhone,
                    locationLabel: `${product.area}, ${product.city}`,
                  })
                }
                className="py-2.5 px-3 rounded-xl bg-[#1D8348] hover:bg-[#166838] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(product.id)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                  isFav
                    ? 'bg-red-50 border-[#D92D20] text-[#D92D20]'
                    : 'bg-white border-[#D8C5A5] text-[#382619] hover:bg-[#FFF9ED]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                <span>{isFav ? 'Saved' : 'Add to Favorites'}</span>
              </button>
            </div>
          </div>

          {/* Quantity + Add to Cart / Buy Now */}
          <div className="mt-4 pt-4 border-t border-[#F0E3CC] flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-[#D8C5A5] rounded-lg bg-[#FFF9ED]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-11 flex items-center justify-center hover:bg-[#FFF2D6] cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="w-10 h-11 flex items-center justify-center hover:bg-[#FFF2D6] cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onAddToCart(product, quantity)}
              className="flex-1 h-11 px-5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onAddToCart(product, quantity);
                onOpenCart();
              }}
              className="h-11 px-5 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-sm font-bold cursor-pointer"
            >
              Buy Now
            </button>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#382619]">
              Related Products
            </h2>
            <Link
              to="/buy-sell"
              className="text-xs font-bold text-[#593B2A] hover:underline"
            >
              Browse All Products →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                isFavorite={favoriteIds.includes(item.id)}
                onToggleFavorite={onToggleFavorite}
                onAddToCart={(p) => onAddToCart(p, 1)}
              />
            ))}
          </div>
        </section>
      )}

      <EnquiryModal
        target={enquiryTarget}
        onClose={() => setEnquiryTarget(null)}
        onRecordEnquiry={onRecordEnquiry}
      />
    </div>
  );
};
