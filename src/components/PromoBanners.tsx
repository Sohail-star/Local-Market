import React from 'react';
import { ArrowRight, Store, Wrench } from 'lucide-react';

interface PromoBannersProps {
  onOpenSellerModal: () => void;
  onOpenProviderModal: () => void;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({
  onOpenSellerModal,
  onOpenProviderModal,
}) => {
  return (
    <section
      aria-label="Seller and service provider promotions"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Seller Promotion */}
      <div className="rounded-2xl bg-[#593B2A] text-white p-6 border border-[#472D1F] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5B82E]">
            <Store className="w-4 h-4" />
            <span>For Shopkeepers &amp; Individuals</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">
            Start Selling on LocalMarket
          </h2>
          <p className="text-xs sm:text-sm text-[#EADBC2] max-w-md">
            List mobiles, laptops, furniture, fashion, or appliances and connect directly with
            nearby buyers in your city.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSellerModal}
          className="bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] font-bold text-sm px-5 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <span>Become a Seller</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Service Provider Promotion */}
      <div className="rounded-2xl bg-white text-[#382619] p-6 border border-[#EADBC2] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#593B2A]">
            <Wrench className="w-4 h-4 text-[#F5B82E]" />
            <span>For Technicians &amp; Skilled Pros</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">
            Grow Your Business With LocalMarket
          </h2>
          <p className="text-xs sm:text-sm text-[#6F5643] max-w-md">
            Create your verified local profile for mechanic, electrical, plumbing, tailoring, AC
            repair, or digital services.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenProviderModal}
          className="bg-[#593B2A] hover:bg-[#3B2518] text-white font-bold text-sm px-5 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <span>Become a Service Provider</span>
          <ArrowRight className="w-4 h-4 text-[#F5B82E]" />
        </button>
      </div>
    </section>
  );
};
