import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Package, Wrench } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ServiceCard } from '../components/ServiceCard';
import { Product, ServiceItem } from '../types/marketplace';

interface FavoritesPageProps {
  products: Product[];
  services: ServiceItem[];
  favoriteProductIds: string[];
  favoriteServiceIds: string[];
  onToggleFavoriteProduct: (id: string) => void;
  onToggleFavoriteService: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onContactService: (service: ServiceItem) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  products,
  services,
  favoriteProductIds,
  favoriteServiceIds,
  onToggleFavoriteProduct,
  onToggleFavoriteService,
  onAddToCart,
  onContactService,
}) => {
  const [tab, setTab] = useState<'all' | 'products' | 'services'>('all');

  const savedProducts = products.filter((p) => favoriteProductIds.includes(p.id));
  const savedServices = services.filter((s) => favoriteServiceIds.includes(s.id));
  const totalSaved = savedProducts.length + savedServices.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-[#D92D20] text-[#D92D20]" />
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
              Saved Favorites ({totalSaved})
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6F5643] mt-1">
            Quickly revisit products and local service providers you saved in this browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-[#FFF9ED] border border-[#EADBC2]">
            {(
              [
                { id: 'all', label: `All (${totalSaved})` },
                { id: 'products', label: `Products (${savedProducts.length})` },
                { id: 'services', label: `Providers (${savedServices.length})` },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  tab === item.id ? 'bg-[#F5B82E] text-[#382619]' : 'text-[#593B2A]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Link
            to="/"
            className="px-3.5 py-2 rounded-xl border border-[#D8C5A5] text-xs font-semibold text-[#593B2A] inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </section>

      {totalSaved === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D8C5A5] p-12 text-center">
          <Heart className="w-12 h-12 text-[#D2BA94] mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold text-[#382619]">
            No saved favorites yet
          </h2>
          <p className="text-xs sm:text-sm text-[#6F5643] mt-1 max-w-md mx-auto">
            Tap the heart icon on any product or service provider card to bookmark it here for
            easy comparison.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/buy-sell"
              className="px-5 py-2.5 rounded-xl bg-[#593B2A] text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-[#F5B82E]" />
              <span>Browse Products</span>
            </Link>
            <Link
              to="/services"
              className="px-5 py-2.5 rounded-xl bg-[#F5B82E] text-[#382619] text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" />
              <span>Browse Services</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {(tab === 'all' || tab === 'products') && savedProducts.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold text-[#382619] mb-4">
                Saved Products ({savedProducts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {savedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavoriteProduct}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </section>
          )}

          {(tab === 'all' || tab === 'services') && savedServices.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold text-[#382619] mb-4">
                Saved Service Providers ({savedServices.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavoriteService}
                    onContactService={onContactService}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
