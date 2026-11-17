/**
 * Admin-ready frontend domain contracts for future server-authorized administration.
 *
 * SECURITY BOUNDARY:
 * Do NOT enforce admin permissions or render privileged admin controls using
 * client-side role checks alone. All admin modules below must be backed by
 * verified server-side authentication, RBAC policies, and audit logs.
 */

export type AdminModuleKey =
  | 'users'
  | 'products'
  | 'services'
  | 'categories'
  | 'locations'
  | 'reports'
  | 'listings'
  | 'settings';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  activeCapabilities: ('buy' | 'sell' | 'offerServices' | 'hireProviders')[];
  accountState: 'Active' | 'Suspended' | 'PendingVerification';
  joinedAt: string;
}

export interface AdminListingModerationItem {
  id: string;
  kind: 'product' | 'service';
  title: string;
  ownerName: string;
  city: string;
  status: 'Approved' | 'UnderReview' | 'Flagged' | 'Removed';
  submittedAt: string;
}

export interface AdminReportRecord {
  id: string;
  targetType: 'product' | 'service' | 'user';
  targetId: string;
  reason: string;
  reportedBy: string;
  state: 'Open' | 'Investigating' | 'Resolved' | 'Dismissed';
  createdAt: string;
}

export interface AdminLocationEntry {
  province: string;
  city: string;
  areas: string[];
  enabled: boolean;
}

export interface AdminPlatformSettings {
  siteTitle: string;
  defaultCity: string;
  currencyCode: 'PKR';
  requirePhoneVerification: boolean;
  moderationMode: 'manual' | 'auto-publish';
}

export interface AdminModuleDescriptor {
  key: AdminModuleKey;
  label: string;
  description: string;
  plannedEndpoint: string;
  requiresBackendAuth: true;
}

export const ADMIN_READY_MODULES: AdminModuleDescriptor[] = [
  {
    key: 'users',
    label: 'Users & Capabilities',
    description: 'Manage registered accounts, phone/email verification, and capability flags.',
    plannedEndpoint: '/api/admin/users',
    requiresBackendAuth: true,
  },
  {
    key: 'products',
    label: 'Products Catalog',
    description: 'Audit product listings, pricing compliance, and merchant verification.',
    plannedEndpoint: '/api/admin/products',
    requiresBackendAuth: true,
  },
  {
    key: 'services',
    label: 'Services Directory',
    description: 'Review technician profiles, experience credentials, and coverage areas.',
    plannedEndpoint: '/api/admin/services',
    requiresBackendAuth: true,
  },
  {
    key: 'categories',
    label: 'Categories Taxonomy',
    description: 'Create, reorder, or archive product and service categories.',
    plannedEndpoint: '/api/admin/categories',
    requiresBackendAuth: true,
  },
  {
    key: 'locations',
    label: 'Pakistan Locations',
    description: 'Manage supported provinces, cities, and neighborhood areas.',
    plannedEndpoint: '/api/admin/locations',
    requiresBackendAuth: true,
  },
  {
    key: 'reports',
    label: 'Abuse & Trust Reports',
    description: 'Investigate user-submitted flags on listings or profiles.',
    plannedEndpoint: '/api/admin/reports',
    requiresBackendAuth: true,
  },
  {
    key: 'listings',
    label: 'Unified Listings Queue',
    description: 'Approve, pause, or delist marketplace items across all sellers.',
    plannedEndpoint: '/api/admin/listings',
    requiresBackendAuth: true,
  },
  {
    key: 'settings',
    label: 'Platform Settings',
    description: 'Configure currency, default region, and moderation workflows.',
    plannedEndpoint: '/api/admin/settings',
    requiresBackendAuth: true,
  },
];
