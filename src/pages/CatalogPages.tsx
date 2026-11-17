import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Layers, RotateCcw, Search, Users } from 'lucide-react';
import { LocationSelector } from '../components/LocationSelector';
import { ProductCard } from '../components/ProductCard';
import { ServiceCard } from '../components/ServiceCard';
import { ALL_CATEGORY_GROUPS, PRODUCT_CATEGORY_GROUP } from '../data/categories';
import { ProvinceName } from '../data/locations';
import { ALL_SERVICE_CATEGORIES } from '../data/marketplaceData';
import { CityName, Product, ServiceAvailability, ServiceItem } from '../types/marketplace';

interface SearchResultsPageProps {
  products: Product[];
  services: ServiceItem[];
  favoriteIds: string[];
  favoriteServiceIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleFavoriteService: (id: string) => void;
  onAddToCart: (p: Product) => void;
  onContactService: (s: ServiceItem) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  products,
  services,
  favoriteIds,
  favoriteServiceIds,
  onToggleFavorite,
  onToggleFavoriteService,
  onAddToCart,
  onContactService,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const city = (searchParams.get('city') as CityName) || 'All Cities';
  const area = searchParams.get('area') || 'All Areas';
  const type = (searchParams.get('type') as 'all' | 'products' | 'services') || 'all';

  const [province, setProvince] = useState<ProvinceName>('All Provinces');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [availability, setAvailability] = useState<ServiceAvailability | 'All'>('All');

  const allCategoryNames = useMemo(() => {
    const prodCats = PRODUCT_CATEGORY_GROUP.items.map((i) => i.name);
    return Array.from(new Set([...prodCats, ...ALL_SERVICE_CATEGORIES]));
  }, []);

  const matchedProducts = useMemo(() => {
    if (type === 'services') return [];
    const term = q.trim().toLowerCase();
    const numericMax = maxPrice ? Number(maxPrice) : null;
    return products.filter((p) => {
      const pOk = province === 'All Provinces' || p.province === province;
      const cOk = city === 'All Cities' || p.city === city;
      const aOk = area === 'All Areas' || p.area === area;
      const catOk = categoryFilter === 'All' || p.category === categoryFilter;
      const priceOk = numericMax === null || !Number.isFinite(numericMax) || p.price <= numericMax;
      const ratingOk = p.rating >= minRating;
      const qOk =
        !term ||
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.sellerName.toLowerCase().includes(term) ||
        p.area.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term);
      return pOk && cOk && aOk && catOk && priceOk && ratingOk && qOk;
    });
  }, [products, q, province, city, area, type, categoryFilter, maxPrice, minRating]);

  const matchedServices = useMemo(() => {
    if (type === 'products') return [];
    const term = q.trim().toLowerCase();
    const numericMax = maxPrice ? Number(maxPrice) : null;
    return services.filter((s) => {
      const pOk = province === 'All Provinces' || s.province === province;
      const cOk = city === 'All Cities' || s.city === city;
      const aOk =
        area === 'All Areas' || s.area === area || s.serviceAreas.includes(area);
      const catOk = categoryFilter === 'All' || s.categoryName === categoryFilter;
      const priceOk =
        numericMax === null || !Number.isFinite(numericMax) || s.startingPrice <= numericMax;
      const ratingOk = s.rating >= minRating;
      const expOk = s.experienceYears >= minExperience;
      const availOk = availability === 'All' || s.availability === availability;
      const qOk =
        !term ||
        s.title.toLowerCase().includes(term) ||
        s.categoryName.toLowerCase().includes(term) ||
        s.serviceGroup.toLowerCase().includes(term) ||
        s.providerName.toLowerCase().includes(term) ||
        s.area.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term);
      return pOk && cOk && aOk && catOk && priceOk && ratingOk && expOk && availOk && qOk;
    });
  }, [
    services,
    q,
    province,
    city,
    area,
    type,
    categoryFilter,
    maxPrice,
    minRating,
    minExperience,
    availability,
  ]);

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (!val || val === 'All Cities' || val === 'All Areas' || val === 'all') {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    if (key === 'city') next.delete('area');
    setSearchParams(next);
  };

  const resetAllSearchFilters = () => {
    setProvince('All Provinces');
    setCategoryFilter('All');
    setMaxPrice('');
    setMinRating(0);
    setMinExperience(0);
    setAvailability('All');
    setSearchParams({});
  };

  const hasAnyFilter =
    Boolean(q) ||
    city !== 'All Cities' ||
    area !== 'All Areas' ||
    province !== 'All Provinces' ||
    categoryFilter !== 'All' ||
    Boolean(maxPrice) ||
    minRating > 0 ||
    minExperience > 0 ||
    availability !== 'All';

  const totalMatches = matchedProducts.length + matchedServices.length;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#382619]">
              Unified Search {q ? `for "${q}"` : 'Across LocalMarket'}
            </h1>
            <p className="text-xs text-[#6F5643] mt-0.5 tabular-nums">
              {totalMatches} matching {totalMatches === 1 ? 'result' : 'results'} across products,
              services, and professionals
            </p>
          </div>
          <Link
            to="/"
            className="px-3.5 py-2 rounded-lg border border-[#D8C5A5] text-xs font-semibold text-[#593B2A] inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-5">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
              Keyword (Product, Service, or Professional)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#593B2A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={q}
                onChange={(e) => updateParam('q', e.target.value)}
                placeholder="Search mobile, mechanic, tailor, Peshawar..."
                className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#593B2A]"
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <LocationSelector
              compact={true}
              province={province}
              onProvinceChange={(p) => {
                setProvince(p);
                updateParam('city', 'All Cities');
              }}
              city={city}
              onCityChange={(c) => updateParam('city', c)}
              area={area}
              onAreaChange={(a) => updateParam('area', a)}
            />
          </div>
        </div>

        {/* Advanced Filters Row: Category, Price, Rating, Experience, Availability */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-[#F0E3CC]">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-2.5 py-2 text-xs font-semibold text-[#382619]"
            >
              <option value="All">All Categories</option>
              {allCategoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
              Max Price (PKR)
            </label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-2.5 py-2 text-xs font-semibold tabular-nums text-[#382619]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
              Min Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-2.5 py-2 text-xs font-semibold text-[#382619]"
            >
              <option value={0}>Any Rating</option>
              <option value={4.5}>4.5★ &amp; above</option>
              <option value={4.8}>4.8★ &amp; above</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
              Experience
            </label>
            <select
              value={minExperience}
              onChange={(e) => setMinExperience(Number(e.target.value))}
              className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-2.5 py-2 text-xs font-semibold text-[#382619]"
            >
              <option value={0}>Any Experience</option>
              <option value={5}>5+ Years</option>
              <option value={10}>10+ Years</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
              Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as ServiceAvailability | 'All')}
              className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-2.5 py-2 text-xs font-semibold text-[#382619]"
            >
              <option value="All">Any Availability</option>
              <option value="Available Today">Available Today</option>
              <option value="Same-Day Visit">Same-Day Visit</option>
              <option value="Weekend Available">Weekend Available</option>
            </select>
          </div>
        </div>

        {/* Scope Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0E3CC]">
          <div className="inline-flex p-1 rounded-xl bg-[#FFF9ED] border border-[#EADBC2]">
            {(
              [
                { id: 'all', label: `All Results (${totalMatches})` },
                { id: 'products', label: `Products (${matchedProducts.length})` },
                {
                  id: 'services',
                  label: `Services & Professionals (${matchedServices.length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateParam('type', tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  type === tab.id ? 'bg-[#F5B82E] text-[#382619]' : 'text-[#593B2A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={resetAllSearchFilters}
              className="text-xs font-bold text-[#593B2A] inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Search</span>
            </button>
          )}
        </div>
      </div>

      {totalMatches === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D8C5A5] p-10 text-center">
          <Users className="w-10 h-10 text-[#B89B78] mx-auto mb-2.5" />
          <h2 className="font-display text-lg font-bold text-[#382619]">
            No search results found
          </h2>
          <p className="text-xs text-[#6F5643] mt-1">
            Try another keyword or clear your location and attribute filters to view all demo
            listings.
          </p>
          <button
            type="button"
            onClick={resetAllSearchFilters}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#F5B82E] text-[#382619] text-xs font-bold cursor-pointer"
          >
            Show All Listings
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {matchedProducts.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold text-[#382619] mb-4">
                Matching Products ({matchedProducts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {matchedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={onToggleFavorite}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </section>
          )}

          {matchedServices.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold text-[#382619] mb-4">
                Matching Services &amp; Professionals ({matchedServices.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isFavorite={favoriteServiceIds.includes(service.id)}
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

interface CategorySlugPageProps {
  products: Product[];
  services: ServiceItem[];
  favoriteIds: string[];
  favoriteServiceIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleFavoriteService: (id: string) => void;
  onAddToCart: (p: Product) => void;
  onContactService: (s: ServiceItem) => void;
}

export const CategorySlugPage: React.FC<CategorySlugPageProps> = ({
  products,
  services,
  favoriteIds,
  favoriteServiceIds,
  onToggleFavorite,
  onToggleFavoriteService,
  onAddToCart,
  onContactService,
}) => {
  const { slug = '' } = useParams<{ slug: string }>();
  const decoded = decodeURIComponent(slug).toLowerCase();

  const categoryMeta = useMemo(() => {
    for (const grp of ALL_CATEGORY_GROUPS) {
      const found = grp.items.find((i) => i.slug.toLowerCase() === decoded);
      if (found) return found;
    }
    return null;
  }, [decoded]);

  const title = categoryMeta ? categoryMeta.name : decodeURIComponent(slug);

  const matchedProducts = products.filter(
    (p) =>
      p.category.toLowerCase() === decoded ||
      p.title.toLowerCase().includes(decoded)
  );
  const matchedServices = services.filter(
    (s) =>
      s.categoryName.toLowerCase() === decoded ||
      s.serviceGroup.toLowerCase() === decoded ||
      s.title.toLowerCase().includes(decoded)
  );

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#593B2A] mb-1">
            <Layers className="w-4 h-4 text-[#F5B82E]" />
            <span>{categoryMeta ? categoryMeta.group : 'Category Directory'}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619] capitalize">
            {title}
          </h1>
          {categoryMeta && (
            <p className="text-xs sm:text-sm text-[#6F5643] mt-1">{categoryMeta.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/categories"
            className="px-4 py-2 rounded-xl border border-[#D8C5A5] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED]"
          >
            All Categories
          </Link>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-[#593B2A] text-white text-xs font-bold"
          >
            Home
          </Link>
        </div>
      </section>

      {matchedProducts.length === 0 && matchedServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D8C5A5] p-10 text-center">
          <p className="font-display text-lg font-bold text-[#382619]">
            No demo listings yet under &ldquo;{title}&rdquo;
          </p>
          <p className="text-xs text-[#6F5643] mt-1">
            Explore our full Buy &amp; Sell catalog or Services Directory to browse available demo
            listings.
          </p>
          <div className="mt-4 flex justify-center gap-2.5">
            <Link
              to="/buy-sell"
              className="px-4 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold"
            >
              Buy &amp; Sell
            </Link>
            <Link
              to="/services"
              className="px-4 py-2 rounded-lg bg-[#F5B82E] text-[#382619] text-xs font-bold"
            >
              Services
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {matchedProducts.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold text-[#382619] mb-4">
                Products in {title} ({matchedProducts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {matchedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={onToggleFavorite}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </section>
          )}

          {matchedServices.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold text-[#382619] mb-4">
                Service Providers in {title} ({matchedServices.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isFavorite={favoriteServiceIds.includes(service.id)}
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

export const PolicyPage: React.FC<{ kind: 'privacy' | 'terms' }> = ({ kind }) => {
  return (
    <section className="bg-white rounded-2xl border border-[#EADBC2] p-6 sm:p-8 shadow-xs space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-[#382619]">
          {kind === 'privacy' ? 'Privacy Policy (Demo)' : 'Terms & Conditions (Demo)'}
        </h1>
        <Link
          to="/"
          className="px-3.5 py-2 rounded-lg border border-[#D8C5A5] text-xs font-semibold text-[#593B2A]"
        >
          Back to Home
        </Link>
      </div>
      <p className="text-sm text-[#4A3523] leading-relaxed">
        {kind === 'privacy'
          ? 'LocalMarket runs in your browser with sample listings and local session state. No personal data is transmitted to external databases in this frontend phase.'
          : 'All product prices, service rates, ratings, and business profiles shown are illustrative sample data designed to demonstrate the LocalMarket user experience.'}
      </p>
    </section>
  );
};
