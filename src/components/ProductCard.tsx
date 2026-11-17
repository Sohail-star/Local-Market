import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, Plus, ShoppingCart, Star, Store } from 'lucide-react';
import { Product } from '../types/marketplace';
import { SmartImage } from './SmartImage';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
}) => {
  const badgeStyle = (badge?: Product['badge']) => {
    switch (badge) {
      case 'Hot':
        return 'bg-[#F5B82E] text-[#382619]';
      case 'Best Deal':
        return 'bg-[#1D8348] text-white';
      case '20% OFF':
        return 'bg-[#D92D20] text-white';
      case 'New':
        return 'bg-[#593B2A] text-[#F5B82E]';
      default:
        return '';
    }
  };

  return (
    <article className="group rounded-xl border border-[#EFE3CE] bg-white hover:border-[#DEC69E] hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-[#FFF9ED]/60 border-b border-[#F3E9D7] overflow-hidden">
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <SmartImage
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-200"
            fallbackLabel={product.title}
          />
        </Link>

        <button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          aria-label={
            isFavorite
              ? `Remove ${product.title} from favorites`
              : `Save ${product.title} to favorites`
          }
          className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors cursor-pointer ${
            isFavorite
              ? 'bg-[#D92D20] text-white'
              : 'bg-white/95 text-[#593B2A] hover:text-[#D92D20]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {product.badge && (
          <span
            className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${badgeStyle(
              product.badge
            )}`}
          >
            {product.badge}
          </span>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#6F5643] mb-1">
          <span className="font-semibold">
            {product.category} ·{' '}
            <span
              className={
                product.condition === 'New'
                  ? 'text-[#1D8348] font-bold'
                  : 'text-[#593B2A] font-bold'
              }
            >
              {product.condition}
            </span>
          </span>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="text-[15px] font-bold text-[#382619] leading-snug line-clamp-1 group-hover:text-[#9A5D0A] transition-colors"
        >
          {product.title}
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-[#B8320A] tabular-nums">
            Rs. {product.price.toLocaleString('en-PK')}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-[#9C846C] line-through tabular-nums">
              Rs. {product.originalPrice.toLocaleString('en-PK')}
            </span>
          )}
        </div>

        <div className="mt-1.5 space-y-0.5 text-[11px] text-[#5C432D]">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-[#C98A09] shrink-0" />
            <span className="truncate">
              {product.area}, {product.city}
            </span>
          </div>
          <div className="flex items-center gap-1 truncate">
            <Store className="w-3 h-3 text-[#593B2A] shrink-0" />
            <span className="truncate font-medium">{product.sellerName}</span>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-xs text-[#5C432D] tabular-nums">
          <Star className="w-3.5 h-3.5 fill-[#F5B82E] text-[#F5B82E]" />
          <span className="font-bold text-[#382619]">{product.rating.toFixed(1)}</span>
          <span className="text-[#8A7158]">({product.reviewCount} · Sample)</span>
        </div>

        <div className="mt-auto pt-3 flex items-center gap-1.5">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="w-9 h-8 rounded-lg bg-[#FFF4D6] hover:bg-[#F5B82E] text-[#382619] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label={`Add ${product.title} to cart`}
            title="Add to Cart"
          >
            <Plus className="w-3.5 h-3.5 -mr-0.5" />
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
