import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  Cog,
  Droplets,
  Home,
  Laptop,
  LayoutGrid,
  Scissors,
  ShoppingCart,
  Store,
  Wrench,
  Zap,
} from 'lucide-react';
import { CategoryFilterId } from '../types/marketplace';

interface CategoryQuickStripProps {
  activeCategory: CategoryFilterId;
  onSelectCategory: (cat: CategoryFilterId) => void;
  onOpenSellerModal: () => void;
  onOpenProviderModal: () => void;
}

interface CategoryTile {
  id: CategoryFilterId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const CATEGORY_TILES: CategoryTile[] = [
  {
    id: 'products',
    title: 'Buy & Sell',
    subtitle: 'Products',
    icon: <ShoppingCart className="w-6 h-6 text-[#593B2A]" />,
  },
  {
    id: 'mechanic',
    title: 'Mechanic',
    subtitle: 'Services',
    icon: <Cog className="w-6 h-6 text-[#593B2A]" />,
  },
  {
    id: 'electrician',
    title: 'Electrician',
    subtitle: 'Services',
    icon: <Zap className="w-6 h-6 text-[#D98207]" />,
  },
  {
    id: 'plumber',
    title: 'Plumber',
    subtitle: 'Services',
    icon: <Droplets className="w-6 h-6 text-[#593B2A]" />,
  },
  {
    id: 'tailor',
    title: 'Tailor',
    subtitle: 'Services',
    icon: <Scissors className="w-6 h-6 text-[#593B2A]" />,
  },
  {
    id: 'home-services',
    title: 'Home Services',
    subtitle: 'Maintenance',
    icon: <Home className="w-6 h-6 text-[#593B2A]" />,
  },
  {
    id: 'tech-services',
    title: 'Tech Services',
    subtitle: 'Repairs',
    icon: <Laptop className="w-6 h-6 text-[#593B2A]" />,
  },
];

export const CategoryQuickStrip: React.FC<CategoryQuickStripProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenSellerModal,
  onOpenProviderModal,
}) => {
  return (
    <section
      aria-label="Marketplace categories and seller onboarding"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
    >
      {/* 7 Quick Category Tiles + All Categories Page Link */}
      <div className="lg:col-span-9 bg-[#F7E8C9]/70 border border-[#EADBC2] rounded-2xl p-2.5 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        {CATEGORY_TILES.map((tile) => {
          const isActive = activeCategory === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => onSelectCategory(tile.id)}
              className={`group rounded-xl px-2.5 py-3 flex flex-col items-center justify-center text-center transition-all duration-150 cursor-pointer border ${
                isActive
                  ? 'bg-white border-[#F5B82E] shadow-sm ring-2 ring-[#F5B82E]/40 -translate-y-0.5'
                  : 'bg-[#FFFDF8] border-transparent hover:border-[#EADBC2] hover:bg-white hover:-translate-y-0.5'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                  isActive ? 'bg-[#FFF4D6]' : 'bg-[#FFF9ED] group-hover:bg-[#FFF4D6]'
                }`}
              >
                {tile.icon}
              </div>
              <span className="text-xs font-bold text-[#382619] leading-tight whitespace-nowrap">
                {tile.title}
              </span>
              <span className="text-[11px] font-medium text-[#6F5643] mt-0.5 whitespace-nowrap">
                {tile.subtitle}
              </span>
            </button>
          );
        })}

        {/* Direct Link to All Categories Page */}
        <Link
          to="/categories"
          className="group rounded-xl px-2.5 py-3 flex flex-col items-center justify-center text-center transition-all duration-150 border bg-[#FFFDF8] border-transparent hover:border-[#F5B82E] hover:bg-white hover:-translate-y-0.5"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FFF4D6] flex items-center justify-center mb-2">
            <LayoutGrid className="w-6 h-6 text-[#D98207]" />
          </div>
          <span className="text-xs font-bold text-[#382619] leading-tight whitespace-nowrap">
            All Categories
          </span>
          <span className="text-[11px] font-medium text-[#6F5643] mt-0.5 whitespace-nowrap">
            Explore All
          </span>
        </Link>
      </div>

      {/* Right Stacked Onboarding CTAs */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        <button
          type="button"
          onClick={onOpenSellerModal}
          className="w-full bg-[#593B2A] hover:bg-[#3B2518] text-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-[#F5B82E]" />
            </div>
            <div className="text-left min-w-0">
              <span className="block text-sm font-bold leading-tight whitespace-nowrap">
                Become a Seller
              </span>
              <span className="block text-[11px] text-[#E6D0AC] truncate">
                List products locally
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#F5B82E] shrink-0" />
        </button>

        <button
          type="button"
          onClick={onOpenProviderModal}
          className="w-full bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#593B2A]/12 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-[#382619]" />
            </div>
            <div className="text-left min-w-0">
              <span className="block text-sm font-bold leading-tight whitespace-nowrap">
                Become a Service Provider
              </span>
              <span className="block text-[11px] text-[#593B2A] truncate">
                Get daily local bookings
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#382619] shrink-0" />
        </button>
      </div>
    </section>
  );
};
