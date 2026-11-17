import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Headphones,
  PackageCheck,
  Store,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { getProvinceForCity } from '../data/locations';
import { CITIES, CITY_NEIGHBORHOODS } from '../data/marketplaceData';
import {
  CategoryFilterId,
  CityName,
  OrderRecord,
  Product,
  ProductCategoryName,
  ServiceBooking,
  ServiceCategoryLabel,
  ServiceGroupName,
  ServiceItem,
  UserAccount,
} from '../types/marketplace';

/* ------------------------------------------------------------------ */
/* 1. Seller Listing Modal (Adds a real product to Featured Products) */
/* ------------------------------------------------------------------ */
interface SellerListingModalProps {
  open: boolean;
  onClose: () => void;
  defaultCity: CityName;
  onCreateProduct: (product: Product) => void;
}

const PRODUCT_IMAGE_BY_CAT: Record<ProductCategoryName, string> = {
  Mobiles: '/src/assets/images/product_smartphone_pro_1794892673559.jpg',
  Laptops: '/src/assets/images/product_dell_laptop_1794892673214.jpg',
  Furniture: '/src/assets/images/product_office_chair_1794892674328.jpg',
  Electronics: '/src/assets/images/product_wireless_headphones_1794892674408.jpg',
  Vehicles: '/src/assets/images/service_car_mechanic_1794892675044.jpg',
  Fashion: '/src/assets/images/service_tailor_1794892676094.jpg',
  'Home Appliances': '/src/assets/images/product_office_chair_1794892674328.jpg',
  Property: '/src/assets/images/hero_peshawar_marketplace_1794892673024.jpg',
};

export const SellerListingModal: React.FC<SellerListingModalProps> = ({
  open,
  onClose,
  defaultCity,
  onCreateProduct,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategoryName>('Mobiles');
  const [condition, setCondition] = useState<'New' | 'Used'>('New');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState<Exclude<CityName, 'All Cities'>>(
    defaultCity === 'All Cities' ? 'Peshawar' : defaultCity
  );
  const [area, setArea] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  const areas = CITY_NEIGHBORHOODS[city] || ['City Center'];
  const selectedArea = area || areas[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Math.max(100, Number(price) || 5000);
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      title: title.trim(),
      category,
      condition,
      price: numericPrice,
      badge: 'New',
      rating: 5.0,
      reviewCount: 1,
      province: getProvinceForCity(city),
      city,
      area: selectedArea,
      sellerName: sellerName.trim() || 'Local Verified Merchant',
      sellerMemberSince: '2026',
      sellerVerified: true,
      sellerPhone: '+92 300 0000000',
      description:
        description.trim() ||
        'Fresh local listing posted on LocalMarket with Cash on Delivery and local pickup.',
      specs: [`Condition: ${condition}`, `Area: ${selectedArea}`, `City: ${city}`, 'COD Eligible'],
      image: PRODUCT_IMAGE_BY_CAT[category],
      galleryImages: [PRODUCT_IMAGE_BY_CAT[category]],
      stock: 10,
      deliveryEstimate: `Same-day local pickup in ${city}`,
    };
    onCreateProduct(newProduct);
    setTitle('');
    setPrice('');
    setDescription('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Become a Seller — Post a Product"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#EADBC2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-[#593B2A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#F5B82E]" />
            <h2 className="font-display text-lg font-bold">Become a Seller — List Product</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HP EliteBook 840 G9 or Wooden Study Desk"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#593B2A]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategoryName)}
                className="w-full rounded-lg border border-[#D8C5A5] px-2.5 py-2 text-xs bg-white focus:outline-none"
              >
                <option value="Electronics">Electronics</option>
                <option value="Mobiles">Mobiles</option>
                <option value="Laptops">Laptops</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Furniture">Furniture</option>
                <option value="Fashion">Fashion</option>
                <option value="Home Appliances">Home Appliances</option>
                <option value="Property">Property</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'New' | 'Used')}
                className="w-full rounded-lg border border-[#D8C5A5] px-2.5 py-2 text-xs bg-white focus:outline-none"
              >
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Price (PKR) *</label>
              <input
                type="number"
                min={100}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45000"
                className="w-full rounded-lg border border-[#D8C5A5] px-2.5 py-2 text-xs tabular-nums focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">City</label>
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value as Exclude<CityName, 'All Cities'>);
                  setArea('');
                }}
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
              >
                {CITIES.filter((c) => c !== 'All Cities').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Area</label>
              <select
                value={selectedArea}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
              >
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">
              Shop / Seller Name *
            </label>
            <input
              type="text"
              required
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="e.g. Saddar Electronics"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition, warranty, and pickup/delivery options..."
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D8C5A5] text-sm font-semibold text-[#593B2A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-sm font-bold cursor-pointer"
            >
              Publish Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 2. Service Provider Registration Modal                             */
/* ------------------------------------------------------------------ */
interface ProviderListingModalProps {
  open: boolean;
  onClose: () => void;
  defaultCity: CityName;
  onCreateService: (service: ServiceItem) => void;
}

const SERVICE_IMAGE_BY_KEY: Record<string, string> = {
  mechanic: '/src/assets/images/service_car_mechanic_1794892675044.jpg',
  electrician: '/src/assets/images/service_electrician_1794892674934.jpg',
  plumber: '/src/assets/images/service_plumber_1794892675350.jpg',
  tailor: '/src/assets/images/service_tailor_1794892676094.jpg',
  carpenter: '/src/assets/images/service_tailor_1794892676094.jpg',
  'ac-technician': '/src/assets/images/service_electrician_1794892674934.jpg',
  'home-services': '/src/assets/images/service_electrician_1794892674934.jpg',
  'tech-services': '/src/assets/images/service_electrician_1794892674934.jpg',
};

const GROUP_FOR_KEY: Record<string, { label: ServiceCategoryLabel; group: ServiceGroupName }> = {
  mechanic: { label: 'Mechanic', group: 'Vehicle Services' },
  electrician: { label: 'Electrician', group: 'Home Services' },
  plumber: { label: 'Plumber', group: 'Home Services' },
  tailor: { label: 'Tailor', group: 'Clothing & Personal' },
  carpenter: { label: 'Carpenter', group: 'Home Services' },
  'ac-technician': { label: 'AC Technician', group: 'Technical Services' },
  'home-services': { label: 'Other Services', group: 'Home Services' },
  'tech-services': { label: 'Computer Repair', group: 'Technical Services' },
};

export const ProviderListingModal: React.FC<ProviderListingModalProps> = ({
  open,
  onClose,
  defaultCity,
  onCreateService,
}) => {
  const [title, setTitle] = useState('');
  const [categoryKey, setCategoryKey] = useState<CategoryFilterId>('mechanic');
  const [startingPrice, setStartingPrice] = useState('500');
  const [city, setCity] = useState<Exclude<CityName, 'All Cities'>>(
    defaultCity === 'All Cities' ? 'Peshawar' : defaultCity
  );
  const [area, setArea] = useState('');
  const [providerName, setProviderName] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  const areas = CITY_NEIGHBORHOODS[city] || ['City Center'];
  const selectedArea = area || areas[0];
  const meta = GROUP_FOR_KEY[categoryKey] || GROUP_FOR_KEY.mechanic;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: title.trim(),
      categoryName: meta.label,
      serviceGroup: meta.group,
      categoryKey,
      startingPrice: Math.max(100, Number(startingPrice) || 500),
      rating: 5.0,
      reviewCount: 1,
      province: getProvinceForCity(city),
      city,
      area: selectedArea,
      serviceAreas: [selectedArea, ...areas.slice(0, 2)].filter(
        (v, i, arr) => arr.indexOf(v) === i
      ),
      workingHours: 'Mon–Sat · 9:00 AM – 8:00 PM',
      availability: 'Available Today',
      providerName: providerName.trim() || 'Verified Local Pro',
      providerVerified: true,
      experienceYears: 5,
      phone: '+92 300 0000000',
      responseTime: 'Arrives in 30 mins',
      description:
        description.trim() || 'Experienced, background-verified local technician ready to serve.',
      includedTasks: ['Onsite Inspection', 'Transparent Estimate', 'Quality Guarantee'],
      sampleReviews: [],
      image: SERVICE_IMAGE_BY_KEY[categoryKey] || SERVICE_IMAGE_BY_KEY.mechanic,
    };
    onCreateService(newService);
    setTitle('');
    setProviderName('');
    setDescription('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Become a Service Provider"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#EADBC2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-[#F5B82E] text-[#382619] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            <h2 className="font-display text-lg font-extrabold">Become a Service Provider</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">
              Service Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC & Inverter Technician or Car Mechanic"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Category</label>
              <select
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value as CategoryFilterId)}
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
              >
                <option value="mechanic">Car Mechanic</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="tailor">Tailor</option>
                <option value="carpenter">Carpenter</option>
                <option value="ac-technician">AC Technician</option>
                <option value="home-services">Home Services</option>
                <option value="tech-services">Tech Services</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">
                Starting Rate (Rs.) *
              </label>
              <input
                type="number"
                min={100}
                required
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm tabular-nums focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Service City</label>
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value as Exclude<CityName, 'All Cities'>);
                  setArea('');
                }}
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
              >
                {CITIES.filter((c) => c !== 'All Cities').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Area</label>
              <select
                value={selectedArea}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
              >
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">
              Business / Ustad Name *
            </label>
            <input
              type="text"
              required
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="e.g. Bilal Cooling & Repair"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">
              Services Included
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your expertise, tools, and neighborhood coverage..."
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D8C5A5] text-sm font-semibold text-[#593B2A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-sm font-bold cursor-pointer"
            >
              Join as Provider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 3. Auth Modal (Login / Sign Up)                                    */
/* ------------------------------------------------------------------ */
interface AuthModalProps {
  mode: 'login' | 'signup' | null;
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onAuthenticate: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  mode,
  onClose,
  onSwitchMode,
  onAuthenticate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState<Exclude<CityName, 'All Cities'>>('Peshawar');
  const [role, setRole] = useState<UserAccount['role']>('Buyer');

  if (!mode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const areas = CITY_NEIGHBORHOODS[city] || ['City Center'];
    onAuthenticate({
      id: `usr-${Date.now()}`,
      name: mode === 'signup' ? name.trim() : email.split('@')[0] || 'Local User',
      email: email.trim(),
      phone: '0300-0000000',
      province: getProvinceForCity(city),
      city,
      area: areas[0],
      capabilities: {
        buy: true,
        sell: role === 'Seller',
        offerServices: role === 'Service Provider',
        hireProviders: true,
      },
      role,
      memberSince: 'Nov 2026',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Login to LocalMarket' : 'Create LocalMarket Account'}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#EADBC2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-[#FFF9ED] border-b border-[#EADBC2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#593B2A]" />
            <h2 className="font-display text-lg font-bold text-[#382619]">
              {mode === 'login' ? 'Welcome Back to LocalMarket' : 'Create Your Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hamza Afridi"
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as Exclude<CityName, 'All Cities'>)}
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
                >
                  {CITIES.filter((c) => c !== 'All Cities').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserAccount['role'])}
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                  <option value="Service Provider">Service Provider</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-sm font-bold cursor-pointer"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-[#6F5643] pt-1">
            {mode === 'login' ? (
              <>
                New to LocalMarket?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('signup')}
                  className="font-bold text-[#593B2A] underline cursor-pointer"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('login')}
                  className="font-bold text-[#593B2A] underline cursor-pointer"
                >
                  Login here
                </button>
              </>
            )}
          </p>
          <div className="pt-2 border-t border-[#F3E9D7] text-center">
            <Link
              to={mode === 'login' ? '/login' : '/signup'}
              onClick={onClose}
              className="text-xs font-semibold text-[#593B2A] hover:underline"
            >
              Open full {mode === 'login' ? 'Login' : 'Sign Up'} page →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 4. Support & Help Modal                                            */
/* ------------------------------------------------------------------ */
interface SupportModalProps {
  mode: 'help' | 'contact' | null;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ mode, onClose }) => {
  const [submitted, setSubmitted] = useState(false);

  if (!mode) return null;

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="LocalMarket Support"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#EADBC2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-[#593B2A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-[#F5B82E]" />
            <h2 className="font-display text-lg font-bold">
              {mode === 'help' ? 'Help Center & FAQs' : 'Contact LocalMarket Support'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {mode === 'help' ? (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-[#FFF9ED] border border-[#EADBC2]">
                <p className="font-bold text-[#382619]">How does buying locally work?</p>
                <p className="text-xs text-[#5C432D] mt-1">
                  Search by city and neighborhood area, inspect product details, and contact
                  verified local shops or order with Cash on Delivery.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF9ED] border border-[#EADBC2]">
                <p className="font-bold text-[#382619]">How do I contact a service provider?</p>
                <p className="text-xs text-[#5C432D] mt-1">
                  Open any service profile or click the Contact button to schedule a technician at
                  your preferred time slot.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF9ED] border border-[#EADBC2]">
                <p className="font-bold text-[#382619]">Can I list my own shop or skill?</p>
                <p className="text-xs text-[#5C432D] mt-1">
                  Yes! Use “Become a Seller” or “Become a Service Provider” to publish your demo
                  listing immediately.
                </p>
              </div>
            </div>
          ) : submitted ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#1D8348] mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-[#382619]">
                Support Message Sent (Demo)
              </h3>
              <p className="text-xs text-[#5C432D] mt-1">
                Thank you for reaching out. In Phase 1, this demonstrates our support ticket UI.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 px-5 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                placeholder="Your Name *"
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="tel"
                required
                placeholder="Phone or Email *"
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
              />
              <textarea
                rows={3}
                required
                placeholder="How can our team assist you today?"
                className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-sm font-bold cursor-pointer"
              >
                Send Message to Support
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 5. My Orders & Service Bookings Modal                              */
/* ------------------------------------------------------------------ */
interface ActivityModalProps {
  open: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  bookings: ServiceBooking[];
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  open,
  onClose,
  orders,
  bookings,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="My Orders and Service Bookings"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-[#EADBC2]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-[#FFF9ED] border-b border-[#EADBC2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#593B2A]" />
            <h2 className="font-display text-lg font-bold text-[#382619]">
              My Orders &amp; Service Bookings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#6F5643] mb-2">
              Product Orders ({orders.length})
            </h3>
            {orders.length === 0 ? (
              <p className="text-xs text-[#8A7158] bg-[#FFF9ED] border border-[#F0E3CC] rounded-xl p-3">
                No product orders yet. Add items to your cart to place an order.
              </p>
            ) : (
              <div className="space-y-2.5">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-3 text-xs"
                  >
                    <div className="flex justify-between font-bold text-[#382619]">
                      <span>Order #{order.id}</span>
                      <span className="text-[#B8320A] tabular-nums">
                        Rs. {order.total.toLocaleString('en-PK')}
                      </span>
                    </div>
                    <p className="text-[#1D8348] font-semibold mt-0.5">{order.status}</p>
                    <p className="text-[#5C432D] mt-1">
                      {order.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')} ·{' '}
                      {order.city}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#6F5643] mb-2">
              Service Bookings ({bookings.length})
            </h3>
            {bookings.length === 0 ? (
              <p className="text-xs text-[#8A7158] bg-[#FFF9ED] border border-[#F0E3CC] rounded-xl p-3">
                No service bookings yet. Click Contact on any service provider card.
              </p>
            ) : (
              <div className="space-y-2.5">
                {bookings.map((bk) => (
                  <div
                    key={bk.id}
                    className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-3 text-xs"
                  >
                    <div className="flex justify-between font-bold text-[#382619]">
                      <span>
                        {bk.serviceTitle} ({bk.id})
                      </span>
                      <span className="text-[#1D8348]">{bk.status}</span>
                    </div>
                    <p className="text-[#5C432D] mt-0.5">
                      {bk.providerName} · {bk.neighborhood}, {bk.city}
                    </p>
                    <p className="text-[#6F5643] mt-0.5 tabular-nums">
                      {bk.date} · {bk.timeSlot}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
