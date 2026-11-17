import React from 'react';
import { ArrowRight, Package, RotateCcw, Star } from 'lucide-react';
import { Product } from '../types/marketplace';
import { ProductCard } from './ProductCard';

interface FeaturedProductsProps {
  products: Product[];
  totalCount: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  totalCount,
  showAll,
  onToggleShowAll,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  hasActiveFilters,
  onResetFilters,
}) => {
  const displayedProducts = showAll ? products : products.slice(0, 4);

  return (
    <section
      id="featured-products"
      className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF4D6] flex items-center justify-center">
            <Star className="w-4 h-4 fill-[#F5B82E] text-[#F5B82E]" />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#382619]">
            Featured Products
          </h2>
          <span className="text-xs font-medium text-[#6F5643] tabular-nums">
            ({products.length} {products.length === 1 ? 'listing' : 'listings'})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-[#593B2A] hover:text-[#382619] flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
          {totalCount > 4 && (
            <button
              type="button"
              onClick={onToggleShowAll}
              className="text-sm font-semibold text-[#382619] hover:text-[#B57506] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{showAll ? 'Show Less' : 'View All'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {displayedProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DFC9A6] bg-[#FFF9ED] py-10 px-4 text-center">
          <Package className="w-9 h-9 text-[#B89B78] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#382619]">No matching products found</p>
          <p className="text-xs text-[#6F5643] mt-1">
            Try switching to All Cities or All Areas, or clearing your search query.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-semibold hover:bg-[#3B2518] transition-colors cursor-pointer"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
};
