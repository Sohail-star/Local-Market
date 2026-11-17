import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Facebook,
  Instagram,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Store,
  Twitter,
  Users,
  Youtube,
} from 'lucide-react';
import { BLOG_ARTICLES } from '../data/marketplaceData';
import { CityName } from '../types/marketplace';

interface AboutSectionProps {
  onOpenSeller: () => void;
  onOpenProvider: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onOpenSeller,
  onOpenProvider,
}) => {
  return (
    <section className="bg-white rounded-2xl border border-[#EADBC2] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
            About LocalMarket Pakistan
          </h1>
          <p className="text-sm text-[#5C432D] mt-1">
            Connecting neighborhoods in Peshawar, Lahore, Karachi, Islamabad &amp; beyond.
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg border border-[#D8C5A5] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED] inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
          <ShieldCheck className="w-6 h-6 text-[#1D8348] mb-2" />
          <h3 className="font-bold text-sm text-[#382619]">Trusted Profiles</h3>
          <p className="text-xs text-[#5C432D] mt-1 leading-relaxed">
            Every shop and technician profile is structured for clear identity, service area, and
            transparent pricing.
          </p>
        </div>
        <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
          <Users className="w-6 h-6 text-[#C98A09] mb-2" />
          <h3 className="font-bold text-sm text-[#382619]">Built for Local Communities</h3>
          <p className="text-xs text-[#5C432D] mt-1 leading-relaxed">
            Search listings by city and neighborhood area to reach nearby electronics shops or
            trusted technicians.
          </p>
        </div>
        <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
          <Store className="w-6 h-6 text-[#593B2A] mb-2" />
          <h3 className="font-bold text-sm text-[#382619]">Support Local Businesses</h3>
          <p className="text-xs text-[#5C432D] mt-1 leading-relaxed">
            Small businesses and skilled ustads can publish products or accept bookings easily.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onOpenSeller}
          className="px-5 py-2.5 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-sm font-bold cursor-pointer"
        >
          Start Selling Products
        </button>
        <button
          type="button"
          onClick={onOpenProvider}
          className="px-5 py-2.5 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-sm font-bold cursor-pointer"
        >
          Join as Service Provider
        </button>
      </div>
    </section>
  );
};

export const BlogSection: React.FC = () => {
  const [activeArticleId, setActiveArticleId] = React.useState<string | null>(null);

  return (
    <section className="bg-white rounded-2xl border border-[#EADBC2] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
            LocalMarket Journal &amp; Guides
          </h1>
          <p className="text-sm text-[#5C432D] mt-1">
            Practical buying tips, home maintenance checklists, and local business stories.
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg border border-[#D8C5A5] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED] inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BLOG_ARTICLES.map((article) => {
          const isExpanded = activeArticleId === article.id;
          return (
            <article
              key={article.id}
              className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-5 flex flex-col"
            >
              <div className="flex items-center gap-2 text-xs text-[#6F5643] mb-2">
                <span className="font-semibold text-[#9A5D0A]">{article.category}</span>
                <span aria-hidden="true">·</span>
                <span>{article.date}</span>
                <span aria-hidden="true">·</span>
                <span>{article.readTime}</span>
              </div>
              <h3 className="font-display text-base font-bold text-[#382619] leading-snug">
                {article.title}
              </h3>
              <p className="mt-2 text-xs text-[#5C432D] leading-relaxed flex-1">
                {article.excerpt}
              </p>
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#EADBC2] text-xs text-[#382619] space-y-1.5">
                  <p className="flex items-center gap-1.5 font-semibold text-[#1D8348]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Always verify seller details and request an itemized receipt.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setActiveArticleId(isExpanded ? null : article.id)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#593B2A] hover:text-[#B57506] cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isExpanded ? 'Hide Summary' : 'Read Guide'}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

interface FooterProps {
  onSelectCity: (city: CityName) => void;
  onOpenSupport: (mode: 'help' | 'contact') => void;
  onSocialClick: (network: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCity,
  onOpenSupport,
  onSocialClick,
}) => {
  return (
    <footer className="bg-[#382619] text-[#E9D8BA] mt-10 border-t border-[#593B2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#F5B82E] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#382619]" />
            </div>
            <span className="font-display text-xl font-extrabold text-white">
              Local<span className="text-[#F5B82E]">Market</span>
            </span>
          </Link>
          <p className="mt-3 text-xs text-[#CDB896] leading-relaxed">
            Your local marketplace in Pakistan for buying products, discovering skilled technicians,
            and growing neighborhood businesses.
          </p>
          {/* Social Media Links */}
          <div className="mt-4 flex items-center gap-2">
            {[
              { name: 'Facebook', icon: <Facebook className="w-4 h-4" /> },
              { name: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
              { name: 'X / Twitter', icon: <Twitter className="w-4 h-4" /> },
              { name: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
            ].map((social) => (
              <button
                key={social.name}
                type="button"
                onClick={() => onSocialClick(social.name)}
                aria-label={`LocalMarket on ${social.name}`}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#F5B82E] text-[#F5B82E] hover:text-[#382619] flex items-center justify-center transition-colors cursor-pointer"
              >
                {social.icon}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-white mb-3">Explore</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/buy-sell" className="hover:text-[#F5B82E]">
                Buy &amp; Sell Products
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-[#F5B82E]">
                Local Services Directory
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-[#F5B82E]">
                All Categories
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="hover:text-[#F5B82E]">
                Saved Favorites
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-[#F5B82E]">
                Guides &amp; Blog
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-white mb-3">Cities in Pakistan</h4>
          <ul className="space-y-2 text-xs">
            {(['Peshawar', 'Lahore', 'Karachi', 'Islamabad'] as CityName[]).map((city) => (
              <li key={city}>
                <Link
                  to="/"
                  onClick={() => {
                    onSelectCity(city);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#F5B82E] inline-flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 text-[#F5B82E]" />
                  <span>{city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-white mb-3">Support &amp; Legal</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/about" className="hover:text-[#F5B82E]">
                About Us
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenSupport('contact')}
                className="hover:text-[#F5B82E] cursor-pointer"
              >
                Contact
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenSupport('help')}
                className="hover:text-[#F5B82E] cursor-pointer"
              >
                Help Center
              </button>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-[#F5B82E]">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-[#F5B82E]">
                Terms &amp; Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#593B2A] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#C8B290]">
          <p>© {new Date().getFullYear()} LocalMarket Pakistan. Shop Local, Support Local.</p>
          <p>Demo Listings &amp; Sample Metrics · Frontend Preview</p>
        </div>
      </div>
    </footer>
  );
};
