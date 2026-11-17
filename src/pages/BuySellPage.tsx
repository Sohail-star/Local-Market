import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ChevronDown,
  ChevronUp,
  Package,
  PlusCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { LocationSelector } from '../components/LocationSelector';
import { ProductCard } from '../components/ProductCard';
import { PRODUCT_CATEGORY_GROUP } from '../data/categories';
import { ProvinceName, getProvinceForCity } from '../data/locations';
import { CityName, Product, ProductCategoryName } from '../types/marketplace';

interface BuySellPageProps {
  products: Product[];
  selectedCity: CityName;
  onSelectCity: (city: CityName) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenSellerModal: () => void;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';
type PricePreset = 'all' | 'under-25k' | '25k-100k' | '100k-250k' | 'over-250k';

const PAGE_SIZE = 8;

export const BuySellPage: React.FC<BuySellPageProps> = ({
  products,
  selectedCity,
  onSelectCity,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  onOpenSellerModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryName | 'All'>('All');
  const [province, setProvince] = useState<ProvinceName>(() =>
    getProvinceForCity(selectedCity)
  );
  const [area, setArea] = useState('All Areas');
  const [condition, setCondition] = useState<'All' | 'New' | 'Used'>('All');
  const [pricePreset, setPricePreset] = useState<PricePreset>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const triggerFilterPulse = () => {
    setIsUpdating(true);
    window.setTimeout(() => setIsUpdating(false), 160);
  };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matched = products.filter((p) => {
      const catOk = selectedCategory === 'All' || p.category === selectedCategory;
      const provOk = province === 'All Provinces' || p.province === province;
      const cityOk = selectedCity === 'All Cities' || p.city === selectedCity;
      const areaOk = area === 'All Areas' || p.area === area;
      const condOk = condition === 'All' || p.condition === condition;

      let priceOk = true;
      if (pricePreset === 'under-25k') priceOk = p.price < 25000;
      else if (pricePreset === '25k-100k') priceOk = p.price >= 25000 && p.price <= 100000;
      else if (pricePreset === '100k-250k') priceOk = p.price > 100000 && p.price <= 250000;
      else if (pricePreset === 'over-250k') priceOk = p.price > 250000;

      if (minPrice && p.price < Number(minPrice)) priceOk = false;
      if (maxPrice && p.price > Number(maxPrice)) priceOk = false;

      const qOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sellerName.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);

      return catOk && provOk && cityOk && areaOk && condOk && priceOk && qOk;
    });

    if (sortBy === 'price-asc') return [...matched].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...matched].sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') return [...matched].sort((a, b) => b.rating - a.rating);
    return matched;
  }, [
    products,
    query,
    selectedCategory,
    province,
    selectedCity,
    area,
    condition,
    pricePreset,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedCity !== 'All Cities' ? 1 : 0) +
    (area !== 'All Areas' ? 1 : 0) +
    (condition !== 'All' ? 1 : 0) +
    (pricePreset !== 'all' || minPrice || maxPrice ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const handleResetAll = () => {
    setQuery('');
    setSelectedCategory('All');
    setProvince('All Provinces');
    onSelectCity('All Cities');
    setArea('All Areas');
    setCondition('All');
    setPricePreset('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
    setVisibleCount(PAGE_SIZE);
    triggerFilterPulse();
  };

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const FilterPanel = (
    <div className="space-y-5">
      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#593B2A] mb-2">
          Product Category
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              triggerFilterPulse();
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#F5B82E] text-[#382619]'
                : 'text-[#382619] hover:bg-[#FFF9ED]'
            }`}
          >
            All Categories
          </button>
          {PRODUCT_CATEGORY_GROUP.items.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.name as ProductCategoryName);
                triggerFilterPulse();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                selectedCategory === cat.name
                  ? 'bg-[#F5B82E] text-[#382619] font-bold'
                  : 'text-[#382619] hover:bg-[#FFF9ED]'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location Selector */}
      <div className="pt-4 border-t border-[#F0E3CC]">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#593B2A] mb-2">
          Location (Pakistan)
        </h3>
        <LocationSelector
          province={province}
          onProvinceChange={(p) => {
            setProvince(p);
            triggerFilterPulse();
          }}
          city={selectedCity}
          onCityChange={(c) => {
            onSelectCity(c as CityName);
            triggerFilterPulse();
          }}
          area={area}
          onAreaChange={(a) => {
            setArea(a);
            triggerFilterPulse();
          }}
        />
      </div>

      {/* Condition Filter */}
      <div className="pt-4 border-t border-[#F0E3CC]">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#593B2A] mb-2">
          Condition
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {(['All', 'New', 'Used'] as const).map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => {
                setCondition(cond);
                triggerFilterPulse();
              }}
              className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                condition === cond
                  ? 'bg-[#593B2A] border-[#593B2A] text-white'
                  : 'bg-[#FFF9ED] border-[#EADBC2] text-[#382619]'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-[#F0E3CC] space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#593B2A]">
          Price Range (PKR)
        </h3>
        <div className="space-y-1">
          {(
            [
              { id: 'all', label: 'Any Price' },
              { id: 'under-25k', label: 'Under Rs. 25,000' },
              { id: '25k-100k', label: 'Rs. 25,000 – 100,000' },
              { id: '100k-250k', label: 'Rs. 100,000 – 250,000' },
              { id: 'over-250k', label: 'Above Rs. 250,000' },
            ] as { id: PricePreset; label: string }[]
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setPricePreset(preset.id);
                setMinPrice('');
                setMaxPrice('');
                triggerFilterPulse();
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs cursor-pointer ${
                pricePreset === preset.id
                  ? 'bg-[#FFF4D6] font-bold text-[#382619]'
                  : 'text-[#5C432D] hover:bg-[#FFF9ED]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPricePreset('all');
            }}
            placeholder="Min Rs."
            aria-label="Minimum price in PKR"
            className="w-full rounded-lg border border-[#D8C5A5] px-2.5 py-1.5 text-xs tabular-nums focus:outline-none"
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPricePreset('all');
            }}
            placeholder="Max Rs."
            aria-label="Maximum price in PKR"
            className="w-full rounded-lg border border-[#D8C5A5] px-2.5 py-1.5 text-xs tabular-nums focus:outline-none"
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={handleResetAll}
          className="w-full py-2.5 rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-xs font-bold text-[#593B2A] inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Page Header + Search Bar */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
              Buy &amp; Sell Products
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5643] mt-1">
              Browse new and used local listings across Peshawar, Khyber Pakhtunkhwa &amp;
              Pakistan.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSellerModal}
            className="px-4 py-2.5 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-[#F5B82E]" />
            <span>Post a Product</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#593B2A] absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mobiles, laptops, furniture, vehicles, seller shops..."
              aria-label="Search products"
              className="w-full rounded-xl border border-[#D8C5A5] bg-[#FFF9ED] pl-10 pr-4 py-2.5 text-sm text-[#382619] focus:outline-none focus:border-[#593B2A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((o) => !o)}
              className="lg:hidden flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#D8C5A5] bg-white text-xs font-bold text-[#382619] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#593B2A]" />
              <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              {mobileFiltersOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <div className="relative flex-1 sm:flex-none">
              <ArrowDownUp className="w-3.5 h-3.5 text-[#593B2A] absolute left-3 top-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="w-full sm:w-48 appearance-none rounded-xl border border-[#D8C5A5] bg-white pl-8 pr-8 py-2.5 text-xs font-bold text-[#382619] cursor-pointer focus:outline-none"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#593B2A] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Expandable Mobile Filters */}
        {mobileFiltersOpen && (
          <div className="lg:hidden pt-4 border-t border-[#EADBC2]">{FilterPanel}</div>
        )}
      </section>

      {/* Main Content: Desktop Filter Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
          {FilterPanel}
        </aside>

        <div className="lg:col-span-9 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#6F5643]">
            <span className="tabular-nums font-semibold text-[#382619]">
              Showing {displayedProducts.length} of {filteredProducts.length} products
              {selectedCity !== 'All Cities' ? ` in ${selectedCity}` : ' across Pakistan'}
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs font-bold text-[#593B2A] hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>

          {isUpdating ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-xl bg-white border border-[#EADBC2] animate-pulse"
                />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#D8C5A5] p-10 text-center">
              <Package className="w-10 h-10 text-[#B89B78] mx-auto mb-2.5" />
              <h2 className="font-display text-lg font-bold text-[#382619]">
                No products match your filters
              </h2>
              <p className="text-xs text-[#6F5643] mt-1 max-w-md mx-auto">
                Try widening your price range, switching condition to All, or selecting All Cities.
              </p>
              <button
                type="button"
                onClick={handleResetAll}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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

              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-6 py-3 rounded-xl bg-white hover:bg-[#FFF9ED] border border-[#D8C5A5] text-sm font-bold text-[#593B2A] cursor-pointer shadow-xs"
                  >
                    Load More Products ({filteredProducts.length - displayedProducts.length}{' '}
                    remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
