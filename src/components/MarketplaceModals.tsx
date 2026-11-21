import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
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
import { apiLoginUser, apiRegisterUser } from '../services/authApi';
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
  const [stock, setStock] = useState('');
  const [city, setCity] = useState<Exclude<CityName, 'All Cities'>>(
    defaultCity === 'All Cities' ? 'Peshawar' : defaultCity
  );
  const [area, setArea] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  const areas = CITY_NEIGHBORHOODS[city] || ['City Center'];
  const selectedArea = area || areas[0];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
        setFormError('Images must be valid image files under 2 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const src = reader.result;
          setImages((prev) => [...prev, src]);
          setFormError(null);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!title.trim()) {
      setFormError('Product title is required.');
      return;
    }
    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 50) {
      setFormError('Enter a valid PKR price of at least Rs. 50.');
      return;
    }
    if (!stock.trim() || !Number.isFinite(numericStock) || numericStock < 1) {
      setFormError('Enter a valid stock quantity of at least 1.');
      return;
    }
    if (!sellerName.trim()) {
      setFormError('Shop / Seller name is required.');
      return;
    }
    if (images.length === 0) {
      setFormError('Please upload at least one product image before publishing.');
      return;
    }

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
      sellerName: sellerName.trim(),
      sellerMemberSince: '2026',
      sellerVerified: true,
      sellerPhone: '+92 300 0000000',
      description:
        description.trim() ||
        'Fresh local listing posted on LocalMarket with Cash on Delivery and local pickup.',
      specs: [`Condition: ${condition}`, `Area: ${selectedArea}`, `City: ${city}`, 'COD Eligible'],
      image: images[0],
      galleryImages: images,
      stock: Math.max(1, Math.floor(numericStock)),
      deliveryEstimate: `Same-day local pickup in ${city}`,
    };
    onCreateProduct(newProduct);
    setTitle('');
    setPrice('');
    setStock('');
    setSellerName('');
    setDescription('');
    setImages([]);
    setFormError(null);
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
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC2]"
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

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-3.5">
          {formError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-[#B42318]">
              {formError}
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. HP EliteBook 840 G9 or Wooden Study Desk"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#593B2A]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                min={50}
                required
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 25000"
                className="w-full rounded-lg border border-[#D8C5A5] px-2.5 py-2 text-xs tabular-nums focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Stock Qty *</label>
              <input
                type="number"
                min={1}
                required
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 1"
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
              onChange={(e) => {
                setSellerName(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Saddar Electronics"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#382619]">Product Images *</label>
              <label className="px-3 py-1.5 rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-xs font-bold text-[#593B2A] inline-flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {images.length === 0 ? (
              <label className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#D8C5A5] bg-[#FFF9ED] px-4 py-5 text-center cursor-pointer hover:bg-[#FFF2D6] transition-colors">
                <Camera className="w-5 h-5 text-[#593B2A]" />
                <span className="text-xs font-bold text-[#382619]">
                  Click &ldquo;Upload Image&rdquo; to add real product photos
                </span>
                <span className="text-[11px] text-[#6F5643]">
                  PNG, JPG, or WebP up to 2 MB each
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div
                    key={`${idx}-${img.slice(0, 24)}`}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#EADBC2] bg-[#FFF9ED]"
                  >
                    <img src={img} alt="Product upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center cursor-pointer"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
  const [startingPrice, setStartingPrice] = useState('');
  const [city, setCity] = useState<Exclude<CityName, 'All Cities'>>(
    defaultCity === 'All Cities' ? 'Peshawar' : defaultCity
  );
  const [area, setArea] = useState('');
  const [providerName, setProviderName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  const areas = CITY_NEIGHBORHOODS[city] || ['City Center'];
  const selectedArea = area || areas[0];
  const meta = GROUP_FOR_KEY[categoryKey] || GROUP_FOR_KEY.mechanic;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
        setFormError('Service photos must be valid images under 2 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const src = reader.result;
          setImages((prev) => [...prev, src]);
          setFormError(null);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(startingPrice);
    if (!title.trim()) {
      setFormError('Service title is required.');
      return;
    }
    if (!startingPrice.trim() || !Number.isFinite(numericPrice) || numericPrice < 100) {
      setFormError('Starting rate must be at least Rs. 100.');
      return;
    }
    if (!providerName.trim()) {
      setFormError('Business / Ustad name is required.');
      return;
    }
    if (images.length === 0) {
      setFormError('Please upload at least one service photo before publishing.');
      return;
    }

    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: title.trim(),
      categoryName: meta.label,
      serviceGroup: meta.group,
      categoryKey,
      startingPrice: numericPrice,
      rating: 5.0,
      reviewCount: 1,
      province: getProvinceForCity(city),
      city,
      area: selectedArea,
      serviceAreas: [selectedArea],
      workingHours: 'By appointment',
      availability: 'Available Today',
      providerName: providerName.trim(),
      providerVerified: true,
      experienceYears: 1,
      phone: '+92 300 0000000',
      responseTime: 'Responds promptly',
      description:
        description.trim() || 'Experienced, background-verified local technician ready to serve.',
      includedTasks: ['Onsite Inspection', 'Transparent Estimate', 'Quality Guarantee'],
      sampleReviews: [],
      image: images[0],
      galleryImages: images,
    };
    onCreateService(newService);
    setTitle('');
    setStartingPrice('');
    setProviderName('');
    setDescription('');
    setImages([]);
    setFormError(null);
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
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC2]"
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

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-3.5">
          {formError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-[#B42318]">
              {formError}
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-[#382619] mb-1">
              Service Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
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
                onChange={(e) => {
                  setStartingPrice(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 500"
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
              onChange={(e) => {
                setProviderName(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Bilal Cooling & Repair"
              className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#382619]">Service Photos *</label>
              <label className="px-3 py-1.5 rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-xs font-bold text-[#593B2A] inline-flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {images.length === 0 ? (
              <label className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#D8C5A5] bg-[#FFF9ED] px-4 py-5 text-center cursor-pointer hover:bg-[#FFF2D6] transition-colors">
                <Camera className="w-5 h-5 text-[#593B2A]" />
                <span className="text-xs font-bold text-[#382619]">
                  Click &ldquo;Upload Photo&rdquo; to add service portfolio photos
                </span>
                <span className="text-[11px] text-[#6F5643]">
                  PNG, JPG, or WebP up to 2 MB each
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div
                    key={`${idx}-${img.slice(0, 24)}`}
                    className="relative w-20 h-16 rounded-lg overflow-hidden border border-[#EADBC2] bg-[#FFF9ED]"
                  >
                    <img src={img} alt="Service upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center cursor-pointer"
                      aria-label="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
  const [password, setPassword] = useState('');
  const [city, setCity] = useState<Exclude<CityName, 'All Cities'>>('Peshawar');
  const [role, setRole] = useState<UserAccount['role']>('Buyer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!mode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const areas = CITY_NEIGHBORHOODS[city] || ['City Center'];
      const account =
        mode === 'login'
          ? await apiLoginUser(email.trim(), password)
          : await apiRegisterUser({
              fullName: name.trim(),
              email: email.trim(),
              password,
              province: getProvinceForCity(city),
              city,
              area: areas[0],
              capabilities: {
                buy: true,
                sell: role === 'Seller',
                offerServices: role === 'Service Provider',
                hireProviders: true,
              },
            });
      onAuthenticate(account);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
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
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-[#B42318]">
              {error}
            </div>
          )}

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
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
