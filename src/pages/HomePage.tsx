import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryQuickStrip } from '../components/CategoryQuickStrip';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { HeroBanner } from '../components/HeroBanner';
import { PopularServices } from '../components/PopularServices';
import { PromoBanners } from '../components/PromoBanners';
import { SidebarTrustPanel } from '../components/SidebarTrustPanel';
import { TrustStatsBar } from '../components/TrustStatsBar';
import { CategoryFilterId, CityName, Product, ServiceItem } from '../types/marketplace';

interface HomePageProps {
  products: Product[];
  services: ServiceItem[];
  selectedCity: CityName;
  onSelectCity: (city: CityName) => void;
  selectedArea: string;
  onSelectArea: (area: string) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  favoriteIds: string[];
  favoriteServiceIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleFavoriteService: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onContactService: (service: ServiceItem) => void;
  onOpenSellerModal: () => void;
  onOpenProviderModal: () => void;
  onOpenContactSupport: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  services,
  selectedCity,
  onSelectCity,
  selectedArea,
  onSelectArea,
  searchQuery,
  onSearchQueryChange,
  favoriteIds,
  favoriteServiceIds,
  onToggleFavorite,
  onToggleFavoriteService,
  onAddToCart,
  onContactService,
  onOpenSellerModal,
  onOpenProviderModal,
  onOpenContactSupport,
  searchInputRef,
}) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryFilterId>('all');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const contentAnchorRef = useRef<HTMLDivElement | null>(null);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isServiceOnly =
      activeCategory !== 'all' && activeCategory !== 'products';
    if (isServiceOnly) return [];

    return products.filter((item) => {
      const cityMatch = selectedCity === 'All Cities' || item.city === selectedCity;
      const areaMatch = selectedArea === 'All Areas' || item.area === selectedArea;
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.sellerName.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return cityMatch && areaMatch && queryMatch;
    });
  }, [products, selectedCity, selectedArea, searchQuery, activeCategory]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (activeCategory === 'products') return [];

    return services.filter((srv) => {
      const cityMatch = selectedCity === 'All Cities' || srv.city === selectedCity;
      const areaMatch = selectedArea === 'All Areas' || srv.area === selectedArea;
      const catMatch =
        activeCategory === 'all' || srv.categoryKey === activeCategory;
      const queryMatch =
        !q ||
        srv.title.toLowerCase().includes(q) ||
        srv.categoryName.toLowerCase().includes(q) ||
        srv.providerName.toLowerCase().includes(q) ||
        srv.area.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q);
      return cityMatch && areaMatch && catMatch && queryMatch;
    });
  }, [services, selectedCity, selectedArea, searchQuery, activeCategory]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    activeCategory !== 'all' ||
    selectedCity !== 'Peshawar' ||
    selectedArea !== 'All Areas';

  const handleResetFilters = () => {
    onSearchQueryChange('');
    setActiveCategory('all');
    onSelectCity('All Cities');
    onSelectArea('All Areas');
    setShowAllProducts(false);
    setShowAllServices(false);
  };

  const handleSelectCategory = (cat: CategoryFilterId) => {
    setActiveCategory(cat);
    if (cat === 'products') {
      setShowAllProducts(true);
    } else if (cat !== 'all') {
      setShowAllServices(true);
    }
    contentAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCity !== 'All Cities') params.set('city', selectedCity);
    if (selectedArea !== 'All Areas') params.set('area', selectedArea);
    navigate(`/search?${params.toString()}`);
  };

  const handleSelectPopularTag = (tag: string) => {
    onSearchQueryChange(tag);
    onSelectCity('All Cities');
    onSelectArea('All Areas');
    setActiveCategory('all');
    setShowAllProducts(true);
    setShowAllServices(true);
    contentAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <HeroBanner
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
        selectedArea={selectedArea}
        onSelectArea={onSelectArea}
        onSubmitSearch={handleSubmitSearch}
        onSelectPopularTag={handleSelectPopularTag}
        searchInputRef={searchInputRef}
      />

      <CategoryQuickStrip
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onOpenSellerModal={onOpenSellerModal}
        onOpenProviderModal={onOpenProviderModal}
      />

      <div
        ref={contentAnchorRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch scroll-mt-20"
      >
        <div className="lg:col-span-9 space-y-5">
          {(activeCategory === 'all' || activeCategory === 'products') && (
            <FeaturedProducts
              products={filteredProducts}
              totalCount={filteredProducts.length}
              showAll={showAllProducts}
              onToggleShowAll={() => setShowAllProducts((s) => !s)}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onAddToCart={onAddToCart}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
            />
          )}

          {activeCategory !== 'products' && (
            <PopularServices
              services={filteredServices}
              totalCount={filteredServices.length}
              showAll={showAllServices}
              onToggleShowAll={() => setShowAllServices((s) => !s)}
              favoriteServiceIds={favoriteServiceIds}
              onToggleFavoriteService={onToggleFavoriteService}
              onContactService={onContactService}
              onResetFilters={handleResetFilters}
            />
          )}
        </div>

        <div className="lg:col-span-3">
          <SidebarTrustPanel onOpenContact={onOpenContactSupport} />
        </div>
      </div>

      {/* Seller & Service Provider Promotional Sections */}
      <PromoBanners
        onOpenSellerModal={onOpenSellerModal}
        onOpenProviderModal={onOpenProviderModal}
      />

      {/* Demo Statistics Section */}
      <TrustStatsBar dynamicListingCount={products.length + services.length} />
    </>
  );
};
