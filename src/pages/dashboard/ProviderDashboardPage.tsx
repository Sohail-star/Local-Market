import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Camera,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { LocationSelector } from '../../components/LocationSelector';
import { SmartImage } from '../../components/SmartImage';
import { StatusBadge } from '../../components/StatusBadge';
import { ProvinceName, getProvinceForCity } from '../../data/locations';
import { ALL_SERVICE_CATEGORIES, CITY_NEIGHBORHOODS } from '../../data/marketplaceData';
import {
  BookingStatus,
  CategoryFilterId,
  CityName,
  MarketplaceEnquiry,
  ServiceAvailability,
  ServiceBooking,
  ServiceCategoryLabel,
  ServiceGroupName,
  ServiceItem,
  UserAccount,
} from '../../types/marketplace';

interface ProviderDashboardPageProps {
  user: UserAccount;
  onActivateProviderCapability: () => void;
  services: ServiceItem[];
  onCreateService: (service: ServiceItem) => void;
  onUpdateService: (service: ServiceItem) => void;
  onDeleteService: (serviceId: string) => void;
  bookings: ServiceBooking[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  enquiries: MarketplaceEnquiry[];
  onReplyEnquiry: (enquiryId: string, replyNote: string) => void;
}

function groupForCategory(cat: ServiceCategoryLabel): {
  group: ServiceGroupName;
  key: CategoryFilterId;
} {
  if (cat === 'Mechanic') return { group: 'Vehicle Services', key: 'mechanic' };
  if (cat === 'Electrician') return { group: 'Home Services', key: 'electrician' };
  if (cat === 'Plumber') return { group: 'Home Services', key: 'plumber' };
  if (cat === 'Carpenter') return { group: 'Home Services', key: 'carpenter' };
  if (
    cat === 'Tailor' ||
    cat === 'Embroidery' ||
    cat === 'Barber' ||
    cat === 'Beautician' ||
    cat === 'Shoe Repair' ||
    cat === 'Laundry'
  ) {
    return { group: 'Clothing & Personal', key: 'tailor' };
  }
  if (cat === 'AC Technician') return { group: 'Technical Services', key: 'ac-technician' };
  if (
    cat === 'Web Developer' ||
    cat === 'Graphic Designer' ||
    cat === 'Photographer' ||
    cat === 'Video Editor'
  ) {
    return { group: 'Professional Services', key: 'tech-services' };
  }
  if (
    cat === 'Mobile Repair' ||
    cat === 'Computer Repair' ||
    cat === 'TV Repair' ||
    cat === 'Refrigerator Repair' ||
    cat === 'Washing Machine Repair' ||
    cat === 'Solar Technician'
  ) {
    return { group: 'Technical Services', key: 'tech-services' };
  }
  return { group: 'Home Services', key: 'home-services' };
}

export const ProviderDashboardPage: React.FC<ProviderDashboardPageProps> = ({
  user,
  onActivateProviderCapability,
  services,
  onCreateService,
  onUpdateService,
  onDeleteService,
  bookings,
  onUpdateBookingStatus,
  enquiries,
  onReplyEnquiry,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'requests' | 'enquiries'>('services');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Service Form State
  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState<ServiceCategoryLabel>('Electrician');
  const [startingPrice, setStartingPrice] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [availability, setAvailability] = useState<ServiceAvailability>('Available Today');
  const [province, setProvince] = useState<ProvinceName>(() => getProvinceForCity(user.city));
  const [city, setCity] = useState<CityName>(user.city);
  const [area, setArea] = useState<string>(user.area);
  const [serviceAreasText, setServiceAreasText] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  if (!user.capabilities.offerServices) {
    return (
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-6 sm:p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF4D6] text-[#593B2A] flex items-center justify-center mx-auto">
          <Wrench className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-[#382619]">
          Service Provider Capability Is Currently Off
        </h1>
        <p className="text-xs sm:text-sm text-[#6F5643] max-w-md mx-auto">
          Activate offering services on your existing <strong>{user.name}</strong> account to list
          your skill, set coverage areas and working hours, and accept or reject customer bookings.
        </p>
        <button
          type="button"
          onClick={onActivateProviderCapability}
          className="px-6 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs sm:text-sm font-extrabold cursor-pointer"
        >
          Activate Service Provider Capability
        </button>
      </section>
    );
  }

  const myServices = services.filter(
    (s) => s.ownerId === user.id || s.providerName.toLowerCase().includes(user.name.toLowerCase())
  );
  const myServiceIds = new Set(myServices.map((s) => s.id));
  const incomingBookings = bookings.filter(
    (b) => b.providerOwnerId === user.id || myServiceIds.has(b.serviceId)
  );
  const customerEnquiries = enquiries.filter(
    (e) =>
      e.kind === 'service' &&
      (e.ownerId === user.id || e.recipientName.toLowerCase().includes(user.name.toLowerCase()))
  );

  const openCreateForm = () => {
    setEditingId(null);
    setTitle('');
    setCategoryName('Electrician');
    setStartingPrice('');
    setWorkingHours('');
    setAvailability('Available Today');
    setProvince(getProvinceForCity(user.city));
    setCity(user.city);
    setArea(user.area);
    setServiceAreasText('');
    setDescription('');
    setImages([]);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (srv: ServiceItem) => {
    setEditingId(srv.id);
    setTitle(srv.title);
    setCategoryName(srv.categoryName);
    setStartingPrice(String(srv.startingPrice));
    setWorkingHours(srv.workingHours);
    setAvailability(srv.availability);
    setProvince((srv.province as ProvinceName) || getProvinceForCity(srv.city));
    setCity(srv.city);
    setArea(srv.area);
    setServiceAreasText(srv.serviceAreas.join(', '));
    setDescription(srv.description);
    setImages(
      srv.galleryImages && srv.galleryImages.length > 0
        ? srv.galleryImages
        : srv.image
          ? [srv.image]
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

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(startingPrice);
    if (!title.trim()) {
      setFormError('Service title is required.');
      return;
    }
    if (!startingPrice.trim() || !Number.isFinite(numericPrice) || numericPrice < 100) {
      setFormError('Starting price must be at least Rs. 100.');
      return;
    }
    if (images.length === 0) {
      setFormError('Please upload at least one service photo before publishing.');
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
    const parsedAreas = serviceAreasText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalAreas = parsedAreas.length > 0 ? parsedAreas : [resolvedArea];
    const groupMeta = groupForCategory(categoryName);
    const primaryImage = images[0];

    if (editingId) {
      const existing = myServices.find((s) => s.id === editingId);
      if (existing) {
        onUpdateService({
          ...existing,
          title: title.trim(),
          categoryName,
          serviceGroup: groupMeta.group,
          categoryKey: groupMeta.key,
          startingPrice: numericPrice,
          workingHours: workingHours.trim() || existing.workingHours,
          availability,
          province: resolvedProvince,
          city: resolvedCity,
          area: resolvedArea,
          serviceAreas: finalAreas,
          description: description.trim() || existing.description,
          image: primaryImage,
          galleryImages: images,
        });
      }
    } else {
      const created: ServiceItem = {
        id: `srv-${Date.now()}`,
        title: title.trim(),
        categoryName,
        serviceGroup: groupMeta.group,
        categoryKey: groupMeta.key,
        startingPrice: numericPrice,
        rating: 5.0,
        reviewCount: 1,
        province: resolvedProvince,
        city: resolvedCity,
        area: resolvedArea,
        serviceAreas: finalAreas,
        workingHours: workingHours.trim() || 'By appointment',
        availability,
        providerName: user.name,
        providerVerified: true,
        experienceYears: 1,
        phone: user.phone,
        responseTime: 'Responds promptly',
        description:
          description.trim() ||
          `Professional ${categoryName} services in ${resolvedCity}.`,
        includedTasks: ['Onsite Inspection', 'Clear Estimate', 'Quality Service'],
        sampleReviews: [],
        image: primaryImage,
        galleryImages: images,
        ownerId: user.id,
        status: 'Active',
      };
      onCreateService(created);
    }

    setFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      {/* Provider Overview */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#382619] flex items-center gap-2">
              <Wrench className="w-6 h-6 text-[#C98A09]" />
              <span>Service Provider Dashboard</span>
            </h1>
            <p className="text-xs text-[#6F5643] mt-0.5">
              Manage your skilled services, working hours, service areas, booking requests, and
              customer enquiries.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">My Services</p>
            <p className="font-display text-xl font-extrabold text-[#382619] tabular-nums mt-0.5">
              {myServices.length}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">Pending Requests</p>
            <p className="font-display text-xl font-extrabold text-amber-700 tabular-nums mt-0.5">
              {incomingBookings.filter((b) => b.status === 'Pending').length}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">Accepted Jobs</p>
            <p className="font-display text-xl font-extrabold text-[#1D8348] tabular-nums mt-0.5">
              {incomingBookings.filter((b) => b.status === 'Accepted').length}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3">
            <p className="text-[11px] font-semibold text-[#6F5643]">Customer Enquiries</p>
            <p className="font-display text-xl font-extrabold text-[#593B2A] tabular-nums mt-0.5">
              {customerEnquiries.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0E3CC]">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'services'
                ? 'bg-[#593B2A] text-[#F5B82E]'
                : 'bg-[#FFF9ED] text-[#593B2A]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>My Services ({myServices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#593B2A] text-[#F5B82E]'
                : 'bg-[#FFF9ED] text-[#593B2A]'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Booking Requests ({incomingBookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'enquiries'
                ? 'bg-[#593B2A] text-[#F5B82E]'
                : 'bg-[#FFF9ED] text-[#593B2A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customer Enquiries ({customerEnquiries.length})</span>
          </button>
        </div>
      </section>

      {/* Add / Edit Service Form */}
      {formOpen && (
        <section className="bg-white rounded-2xl border border-[#593B2A] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0E3CC] pb-3">
            <h2 className="font-display text-lg font-bold text-[#382619]">
              {editingId ? 'Edit Service Listing' : 'Add New Service'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-[#FFF9ED] flex items-center justify-center cursor-pointer"
              aria-label="Close service form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-[#B42318]">
              {formError}
            </p>
          )}

          <form onSubmit={handleSaveService} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
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
                  placeholder="e.g. Home Solar & Inverter Setup"
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#593B2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">
                  Service Category
                </label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value as ServiceCategoryLabel)}
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
                >
                  {ALL_SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">
                  Starting Price (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={startingPrice}
                  onChange={(e) => {
                    setStartingPrice(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm tabular-nums focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">
                  Working Hours
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="e.g. Mon–Sat · 9:00 AM – 8:00 PM"
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">Availability</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as ServiceAvailability)}
                  className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm bg-white focus:outline-none"
                >
                  <option value="Available Today">Available Today</option>
                  <option value="Same-Day Visit">Same-Day Visit</option>
                  <option value="Weekend Available">Weekend Available</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3.5 space-y-2.5">
              <p className="text-xs font-bold text-[#382619]">Primary Location &amp; Service Areas</p>
              <LocationSelector
                compact={true}
                province={province}
                onProvinceChange={setProvince}
                city={city}
                onCityChange={(c) => setCity(c as CityName)}
                area={area}
                onAreaChange={setArea}
              />
              <div>
                <label className="block text-[11px] font-bold text-[#593B2A] mb-1">
                  Service Areas Covered (comma-separated)
                </label>
                <input
                  type="text"
                  value={serviceAreasText}
                  onChange={(e) => setServiceAreasText(e.target.value)}
                  placeholder="e.g. University Road, Hayatabad Phase 3, Saddar Bazaar"
                  className="w-full rounded-lg border border-[#D8C5A5] bg-white px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Service Photos Upload */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D8C5A5] bg-[#FFF9ED] px-4 py-6 text-center cursor-pointer hover:bg-[#FFF2D6] transition-colors">
                  <Camera className="w-6 h-6 text-[#593B2A]" />
                  <span className="text-xs font-bold text-[#382619]">
                    Click &ldquo;Upload Photo&rdquo; to add your service portfolio photos
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
                      className="relative w-24 h-16 rounded-lg overflow-hidden border border-[#EADBC2] bg-[#FFF9ED]"
                    >
                      <SmartImage
                        src={img}
                        alt="Service preview"
                        className="w-full h-full object-cover"
                      />
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
                Service Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tools, expertise, warranty, and visit details..."
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
                className="px-5 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-extrabold cursor-pointer"
              >
                {editingId ? 'Save Changes' : 'Publish Service'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* My Services Tab */}
      {activeTab === 'services' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#382619]">My Services</h2>
          {myServices.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Wrench className="w-10 h-10 text-[#B89B78] mx-auto" />
              <p className="font-display text-base font-bold text-[#382619]">
                No service listings published yet
              </p>
              <p className="text-xs text-[#6F5643]">
                Add your service title, starting rate, and coverage areas to receive booking
                requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myServices.map((srv) => {
                const confirmingDelete = deleteConfirmId === srv.id;
                return (
                  <article
                    key={srv.id}
                    className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-20 h-16 rounded-lg overflow-hidden border border-[#EADBC2] bg-white shrink-0">
                        <SmartImage
                          src={srv.image}
                          alt={srv.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-bold text-sm text-[#382619] truncate">{srv.title}</h3>
                        <p className="text-xs font-extrabold text-[#B8320A] tabular-nums">
                          From Rs. {srv.startingPrice.toLocaleString('en-PK')} ·{' '}
                          <span className="font-semibold text-[#593B2A]">{srv.categoryName}</span>
                        </p>
                        <p className="text-[11px] text-[#6F5643]">
                          {srv.workingHours} · Areas: {srv.serviceAreas.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        to={`/services/${srv.id}`}
                        className="p-2 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF2D6] text-[#593B2A]"
                        title="View public profile"
                        aria-label={`View ${srv.title}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditForm(srv)}
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
                              onDeleteService(srv.id);
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
                          onClick={() => setDeleteConfirmId(srv.id)}
                          className="p-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-[#B42318] cursor-pointer"
                          aria-label={`Delete ${srv.title}`}
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

      {/* Booking Requests Tab */}
      {activeTab === 'requests' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Booking Requests Queue
          </h2>
          {incomingBookings.length === 0 ? (
            <p className="text-xs text-[#6F5643] py-6 text-center">
              No incoming booking requests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {incomingBookings.map((bk) => (
                <div
                  key={bk.id}
                  className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-[#382619]">
                        {bk.serviceTitle} ({bk.id})
                      </p>
                      <StatusBadge status={bk.status} />
                    </div>
                    <p className="text-[#4A3523]">
                      Customer: <strong>{bk.customerName}</strong> ({bk.phone}) · {bk.neighborhood},{' '}
                      {bk.city}
                    </p>
                    <p className="text-[11px] text-[#6F5643] tabular-nums">
                      {bk.date} · {bk.timeSlot}
                    </p>
                    {bk.notes && <p className="text-[#5C432D] italic">&ldquo;{bk.notes}&rdquo;</p>}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {bk.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdateBookingStatus(bk.id, 'Accepted')}
                          className="px-3.5 py-2 rounded-lg bg-[#1D8348] hover:bg-[#166838] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateBookingStatus(bk.id, 'Rejected')}
                          className="px-3.5 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-[#B42318] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    {bk.status === 'Accepted' && (
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(bk.id, 'Completed')}
                        className="px-3.5 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#F5B82E]" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Customer Enquiries Tab */}
      {activeTab === 'enquiries' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#382619]">Customer Enquiries</h2>
          {customerEnquiries.length === 0 ? (
            <p className="text-xs text-[#6F5643] py-6 text-center">
              No customer enquiries received yet.
            </p>
          ) : (
            <div className="space-y-3">
              {customerEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-[#382619]">
                      {enq.senderName} ({enq.senderPhone}) ·{' '}
                      <span className="text-[#593B2A]">{enq.targetTitle}</span>
                    </p>
                    <StatusBadge status={enq.status} />
                  </div>
                  <p className="text-[#4A3523] bg-white border border-[#EADBC2] rounded-lg p-3">
                    {enq.message}
                  </p>
                  {enq.replyNote ? (
                    <p className="text-[#1D8348] font-semibold">Replied: {enq.replyNote}</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={replyDrafts[enq.id] ?? ''}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [enq.id]: e.target.value }))
                        }
                        placeholder="Send visit quote or timing reply..."
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
