import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Edit3,
  Eye,
  MessageSquare,
  Package,
  Plus,
  Send,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { LocationSelector } from '../../components/LocationSelector';
import { SmartImage } from '../../components/SmartImage';
import { StatusBadge } from '../../components/StatusBadge';
import { ProvinceName, getProvinceForCity } from '../../data/locations';
import { CITY_NEIGHBORHOODS } from '../../data/marketplaceData';
import {
  CityName,
  ListingStatus,
  MarketplaceEnquiry,
  Product,
  ProductCategoryName,
  UserAccount,
} from '../../types/marketplace';

interface SellerDashboardPageProps {
  user: UserAccount;
  onActivateSellerCapability: () => void;
  products: Product[];
  onCreateProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  enquiries: MarketplaceEnquiry[];
  onReplyEnquiry: (enquiryId: string, replyNote: string) => void;
}

const PRODUCT_CATEGORIES: ProductCategoryName[] = [
  'Electronics',
  'Mobiles',
  'Laptops',
  'Vehicles',
  'Furniture',
  'Fashion',
  'Home Appliances',
  'Property',
];

export const SellerDashboardPage: React.FC<SellerDashboardPageProps> = ({
  user,
  onActivateSellerCapability,
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  enquiries,
  onReplyEnquiry,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'enquiries'>('products');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategoryName>('Mobiles');
  const [condition, setCondition] = useState<'New' | 'Used'>('New');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [listingStatus, setListingStatus] = useState<ListingStatus>('Active');
  const [province, setProvince] = useState<ProvinceName>(() => getProvinceForCity(user.city));
  const [city, setCity] = useState<CityName>(user.city);
  const [area, setArea] = useState<string>(user.area);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  if (!user.capabilities.sell) {
    return (
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-6 sm:p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF4D6] text-[#593B2A] flex items-center justify-center mx-auto">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-[#382619]">
          Seller Capability Is Currently Paused
        </h1>
        <p className="text-xs sm:text-sm text-[#6F5643] max-w-md mx-auto">
          You do not need a separate seller account. Activate selling on{' '}
          <strong>{user.name}</strong> to publish products, upload photos, and reply to buyer
          enquiries.
        </p>
        <button
          type="button"
          onClick={onActivateSellerCapability}
          className="px-6 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs sm:text-sm font-extrabold cursor-pointer"
        >
          Activate Seller Capability
        </button>
      </section>
    );
  }

  const myProducts = products.filter(
    (p) => p.ownerId === user.id || p.sellerName.toLowerCase() === user.name.toLowerCase()
  );
  const buyerEnquiries = enquiries.filter(
    (e) =>
      e.kind === 'product' &&
      (e.ownerId === user.id || e.recipientName.toLowerCase() === user.name.toLowerCase())
  );

  const openCreateForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Mobiles');
    setCondition('New');
    setPrice('');
    setStock('');
    setListingStatus('Active');
    setProvince(getProvinceForCity(user.city));
    setCity(user.city);
    setArea(user.area);
    setDescription('');
    setImages([]);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingId(product.id);
    setTitle(product.title);
    setCategory(product.category);
    setCondition(product.condition);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setListingStatus(product.status ?? 'Active');
    setProvince((product.province as ProvinceName) || getProvinceForCity(product.city));
    setCity(product.city);
    setArea(product.area);
    setDescription(product.description);
    setImages(
      product.galleryImages && product.galleryImages.length > 0
        ? product.galleryImages
        : product.image
          ? [product.image]
          : []
    );
    setFormError(null);
    setFormOpen(true);
  };

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

  const handleSaveProduct = (e: React.FormEvent) => {
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
    if (images.length === 0) {
      setFormError('Please upload at least one product image before publishing.');
      return;
    }

    const resolvedCity: Exclude<CityName, 'All Cities'> =
      city === 'All Cities' ? user.city : city;
    const resolvedArea =
      area === 'All Areas'
        ? (CITY_NEIGHBORHOODS[resolvedCity] || [user.area])[0]
        : area;
    const resolvedProvince =
      province === 'All Provinces' ? getProvinceForCity(resolvedCity) : province;
    const primaryImage = images[0];

    if (editingId) {
      const existing = myProducts.find((p) => p.id === editingId);
      if (existing) {
        onUpdateProduct({
          ...existing,
          title: title.trim(),
          category,
          condition,
          price: numericPrice,
          stock: Math.max(1, Math.floor(numericStock)),
          status: listingStatus,
          province: resolvedProvince,
          city: resolvedCity,
          area: resolvedArea,
          description: description.trim() || existing.description,
          image: primaryImage,
          galleryImages: images,
        });
      }
    } else {
      const created: Product = {
        id: `prod-${Date.now()}`,
        title: title.trim(),
        category,
        condition,
        price: numericPrice,
        badge: 'New',
        rating: 5.0,
        reviewCount: 1,
        province: resolvedProvince,
        city: resolvedCity,
        area: resolvedArea,
        sellerName: user.name,
        sellerMemberSince: user.memberSince,
        sellerVerified: true,
        sellerPhone: user.phone,
        description:
          description.trim() ||
          `Listed by ${user.name} in ${resolvedArea}, ${resolvedCity}.`,
        specs: [`Condition: ${condition}`, `${resolvedArea}, ${resolvedCity}`, 'Local Pickup / COD'],
        image: primaryImage,
        galleryImages: images,
        stock: Math.max(1, Math.floor(numericStock)),
        deliveryEstimate: `Same-day pickup in ${resolvedCity}`,
        ownerId: user.id,
        status: listingStatus,
      };
      onCreateProduct(created);
    }

    setFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      {/* Seller Overview */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#382619] flex items-center gap-2">
              <Store className="w-6 h-6 text-[#C98A09]" />
              <span>Seller Dashboard</span>
            </h1>
            <p className="text-xs text-[#6F5643] mt-0.5">
              Publish products, manage pricing &amp; images, update listing status, and respond to
              buyer enquiries.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2.5 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5B82E]" />
            <span>Add New Product</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">My Products</p>
            <p className="font-display text-xl font-extrabold text-[#382619] tabular-nums mt-0.5">
              {myProducts.length}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">Active Listings</p>
            <p className="font-display text-xl font-extrabold text-[#1D8348] tabular-nums mt-0.5">
              {myProducts.filter((p) => (p.status ?? 'Active') === 'Active').length}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">Paused / Sold</p>
            <p className="font-display text-xl font-extrabold text-[#593B2A] tabular-nums mt-0.5">
              {myProducts.filter((p) => (p.status ?? 'Active') !== 'Active').length}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">Buyer Enquiries</p>
            <p className="font-display text-xl font-extrabold text-[#B8320A] tabular-nums mt-0.5">
              {buyerEnquiries.length}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#F0E3CC]">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#F5B82E] text-[#382619]'
                : 'bg-[#FFF9ED] text-[#593B2A]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Products ({myProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'enquiries'
                ? 'bg-[#F5B82E] text-[#382619]'
                : 'bg-[#FFF9ED] text-[#593B2A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Buyer Enquiries ({buyerEnquiries.length})</span>
          </button>
        </div>
      </section>

      {/* Add / Edit Product Form */}
      {formOpen && (
        <section className="bg-white rounded-2xl border border-[#593B2A] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0E3CC] pb-3">
            <h2 className="font-display text-lg font-bold text-[#382619]">
              {editingId ? 'Edit Product Listing' : 'Add New Product'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-[#FFF9ED] flex items-center justify-center cursor-pointer"
              aria-label="Close product form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-[#B42318]">
              {formError}
            </p>
          )}

          <form onSubmit={handleSaveProduct} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#382619] mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. HP ProBook 450 G9 Core i5"
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#593B2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">
                  Product Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategoryName)}
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#382619] mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as 'New' | 'Used')}
                    className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#382619] mb-1">
                    Listing Status
                  </label>
                  <select
                    value={listingStatus}
                    onChange={(e) => setListingStatus(e.target.value as ListingStatus)}
                    className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">
                  Product Price (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. 25000"
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm tabular-nums focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">Stock Qty *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={stock}
                  onChange={(e) => {
                    setStock(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. 1"
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm tabular-nums focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3.5 space-y-2">
              <p className="text-xs font-bold text-[#382619]">Product Location</p>
              <LocationSelector
                compact={true}
                province={province}
                onProvinceChange={setProvince}
                city={city}
                onCityChange={(c) => setCity(c as CityName)}
                area={area}
                onAreaChange={setArea}
              />
            </div>

            {/* Product Images Upload */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D8C5A5] bg-[#FFF9ED] px-4 py-6 text-center cursor-pointer hover:bg-[#FFF2D6] transition-colors">
                  <Camera className="w-6 h-6 text-[#593B2A]" />
                  <span className="text-xs font-bold text-[#382619]">
                    Click &ldquo;Upload Image&rdquo; to add your product photos
                  </span>
                  <span className="text-[11px] text-[#6F5643]">
                    Upload one or more PNG, JPG, or WebP images (max 2 MB each)
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
                      <SmartImage src={img} alt="Preview" className="w-full h-full object-cover" />
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
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specifications, warranty, and local pickup details..."
                className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#D8C5A5] text-xs font-bold text-[#593B2A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-bold cursor-pointer"
              >
                {editingId ? 'Save Changes' : 'Publish Product'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* My Products Tab */}
      {activeTab === 'products' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#382619]">My Products</h2>
          {myProducts.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Package className="w-10 h-10 text-[#B89B78] mx-auto" />
              <p className="font-display text-base font-bold text-[#382619]">
                No product listings yet
              </p>
              <p className="text-xs text-[#6F5643]">
                Click &ldquo;Add New Product&rdquo; to publish your first item to Buy &amp; Sell.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myProducts.map((product) => {
                const status: ListingStatus = product.status ?? 'Active';
                const confirmingDelete = deleteConfirmId === product.id;
                return (
                  <article
                    key={product.id}
                    className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#EADBC2] bg-white shrink-0">
                        <SmartImage
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-[#382619] truncate">
                            {product.title}
                          </h3>
                          <StatusBadge status={status} />
                        </div>
                        <p className="text-xs font-extrabold text-[#B8320A] tabular-nums">
                          Rs. {product.price.toLocaleString('en-PK')}
                        </p>
                        <p className="text-[11px] text-[#6F5643]">
                          {product.category} · {product.condition} · {product.area}, {product.city}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label={`Change listing status for ${product.title}`}
                        value={status}
                        onChange={(e) =>
                          onUpdateProduct({
                            ...product,
                            status: e.target.value as ListingStatus,
                          })
                        }
                        className="rounded-lg border border-[#D8C5A5] bg-white px-2.5 py-1.5 text-xs font-bold text-[#382619] cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Sold">Sold</option>
                      </select>

                      <Link
                        to={`/products/${product.id}`}
                        className="p-2 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF2D6] text-[#593B2A]"
                        title="View public product page"
                        aria-label={`View ${product.title}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => openEditForm(product)}
                        className="px-3 py-1.5 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF2D6] text-xs font-bold text-[#382619] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {confirmingDelete ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteProduct(product.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#B42318] text-white text-xs font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1.5 rounded-lg border border-[#D8C5A5] bg-white text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="p-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-[#B42318] cursor-pointer"
                          aria-label={`Delete ${product.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Buyer Enquiries Tab */}
      {activeTab === 'enquiries' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#382619]">Buyer Enquiries</h2>
          {buyerEnquiries.length === 0 ? (
            <p className="text-xs text-[#6F5643] py-6 text-center">
              No buyer enquiries received yet.
            </p>
          ) : (
            <div className="space-y-3">
              {buyerEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#382619]">
                        {enq.senderName} ({enq.senderPhone}) ·{' '}
                        <span className="text-[#593B2A]">{enq.targetTitle}</span>
                      </p>
                      <p className="text-[11px] text-[#6F5643]">
                        {enq.locationLabel} · {enq.createdAt}
                      </p>
                    </div>
                    <StatusBadge status={enq.status} />
                  </div>

                  <p className="text-[#4A3523] bg-white border border-[#EADBC2] rounded-lg p-3">
                    {enq.message}
                  </p>

                  {enq.replyNote ? (
                    <div className="flex items-center gap-1.5 text-[#1D8348] font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Replied: {enq.replyNote}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={replyDrafts[enq.id] ?? ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [enq.id]: e.target.value }))
                        }
                        placeholder="Write a quick reply to this buyer..."
                        className="flex-1 rounded-lg border border-[#D8C5A5] bg-white px-3 py-2 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const text = (replyDrafts[enq.id] ?? '').trim();
                          if (!text) return;
                          onReplyEnquiry(enq.id, text);
                          setReplyDrafts((prev) => ({ ...prev, [enq.id]: '' }));
                        }}
                        className="px-4 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-[#F5B82E]" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
