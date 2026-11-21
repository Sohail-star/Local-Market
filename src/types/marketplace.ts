export type CityName =
  | 'All Cities'
  | 'Peshawar'
  | 'Lahore'
  | 'Karachi'
  | 'Islamabad'
  | 'Rawalpindi'
  | 'Multan'
  | 'Mardan'
  | 'Abbottabad'
  | 'Quetta';

export type ProductBadge = 'Hot' | 'Best Deal' | '20% OFF' | 'New';

export type ProductCategoryName =
  | 'Electronics'
  | 'Mobiles'
  | 'Laptops'
  | 'Vehicles'
  | 'Furniture'
  | 'Fashion'
  | 'Home Appliances'
  | 'Property';

export type ServiceGroupName =
  | 'Home Services'
  | 'Vehicle Services'
  | 'Technical Services'
  | 'Clothing & Personal'
  | 'Professional Services';

export type ServiceCategoryLabel =
  | 'Mechanic'
  | 'Electrician'
  | 'Plumber'
  | 'Carpenter'
  | 'Painter'
  | 'AC Technician'
  | 'TV Repair'
  | 'Refrigerator Repair'
  | 'Washing Machine Repair'
  | 'Mobile Repair'
  | 'Computer Repair'
  | 'Solar Technician'
  | 'Tailor'
  | 'Embroidery'
  | 'Shoe Repair'
  | 'Laundry'
  | 'Cleaning'
  | 'Construction'
  | 'Barber'
  | 'Beautician'
  | 'Web Developer'
  | 'Graphic Designer'
  | 'Photographer'
  | 'Video Editor'
  | 'Other Services';

export type ServiceAvailability =
  | 'Available Today'
  | 'Same-Day Visit'
  | 'Weekend Available';

export type CategoryFilterId =
  | 'all'
  | 'products'
  | 'mechanic'
  | 'electrician'
  | 'plumber'
  | 'tailor'
  | 'carpenter'
  | 'ac-technician'
  | 'home-services'
  | 'tech-services';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  type: 'product' | 'service';
  group: string;
  description: string;
  sampleCount: number;
}

export interface CategoryGroup {
  id: string;
  title: string;
  type: 'product' | 'service';
  subtitle: string;
  items: CategoryItem[];
}

export interface SampleReview {
  id: string;
  author: string;
  area: string;
  rating: number;
  date: string;
  comment: string;
}

export type ListingStatus = 'Active' | 'Paused' | 'Sold';

export interface Product {
  id: string;
  title: string;
  category: ProductCategoryName;
  condition: 'New' | 'Used';
  price: number;
  originalPrice?: number;
  badge?: ProductBadge;
  rating: number;
  reviewCount: number;
  province: string;
  city: Exclude<CityName, 'All Cities'>;
  area: string;
  sellerName: string;
  sellerMemberSince: string;
  sellerVerified: boolean;
  sellerPhone: string;
  description: string;
  specs: string[];
  image: string;
  galleryImages?: string[];
  stock: number;
  deliveryEstimate: string;
  ownerId?: string;
  status?: ListingStatus;
}

export interface ServiceItem {
  id: string;
  title: string;
  categoryName: ServiceCategoryLabel;
  serviceGroup: ServiceGroupName;
  categoryKey: CategoryFilterId;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  province: string;
  city: Exclude<CityName, 'All Cities'>;
  area: string;
  serviceAreas: string[];
  workingHours: string;
  availability: ServiceAvailability;
  providerName: string;
  providerVerified: boolean;
  experienceYears: number;
  phone: string;
  responseTime: string;
  description: string;
  includedTasks: string[];
  sampleReviews: SampleReview[];
  image: string;
  galleryImages?: string[];
  ownerId?: string;
  status?: 'Active' | 'Paused';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type BookingStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

export interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  startingPrice: number;
  city: string;
  neighborhood: string;
  date: string;
  timeSlot: string;
  customerName: string;
  phone: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
  customerId?: string;
  providerOwnerId?: string;
}

export interface OrderRecord {
  id: string;
  items: { title: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: 'Cash on Delivery' | 'EasyPaisa' | 'JazzCash';
  city: string;
  address: string;
  customerName: string;
  phone: string;
  status: 'Confirmed — Preparing Dispatch' | 'Delivered';
  createdAt: string;
}

export type EnquiryKind = 'product' | 'service';
export type EnquiryStatus = 'Open' | 'Replied' | 'Resolved';

export interface MarketplaceEnquiry {
  id: string;
  kind: EnquiryKind;
  targetId: string;
  targetTitle: string;
  recipientName: string;
  senderName: string;
  senderPhone: string;
  channel: 'seller' | 'whatsapp' | 'call';
  locationLabel: string;
  message: string;
  replyNote?: string;
  status: EnquiryStatus;
  createdAt: string;
  senderUserId?: string;
  ownerId?: string;
}

export type NotificationCategory =
  | 'product_enquiry'
  | 'service_request'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'listing_update'
  | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: NotificationCategory;
  linkTo?: string;
}

export interface UserCapabilities {
  buy: boolean;
  sell: boolean;
  offerServices: boolean;
  hireProviders: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  province: string;
  city: Exclude<CityName, 'All Cities'>;
  area: string;
  avatarUrl?: string;
  capabilities: UserCapabilities;
  role: 'Buyer' | 'Seller' | 'Service Provider';
  memberSince: string;
}

export type ActivePageTab = 'home' | 'products' | 'services' | 'categories' | 'about' | 'blog';
