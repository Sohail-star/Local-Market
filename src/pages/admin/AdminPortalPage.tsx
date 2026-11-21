import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  KeyRound,
  Lock,
  LogOut,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';

type AdminRoleCode =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'SUPPORT'
  | 'SUPPORT_ADMIN'
  | 'CATALOG_ADMIN';

interface AdminSetupStatus {
  databaseConnected: boolean;
  superAdminExists: boolean;
  oneTimeSetupAvailable: boolean;
  adminAuthConfigured: boolean;
}

interface AdminAccountProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  province: string;
  city: string;
  area: string;
  accountStatus: string;
  activeRole: AdminRoleCode;
  roles: AdminRoleCode[];
  permissions: string[];
  ordinaryCapabilities: {
    buy: boolean;
    sell: boolean;
    offerServices: boolean;
    hireProviders: boolean;
  };
  lastLoginAt: string | null;
}

interface AdminAccountSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string;
  accountStatus: string;
  activeSessionCount: number;
  roles: Array<{
    code: string;
    name: string;
    isActive: boolean;
    grantedAt: string;
    revokedAt: string | null;
  }>;
}

interface MarketplaceUserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string;
  accountStatus: string;
  sellerVerified: boolean;
  providerVerified: boolean;
  isPhoneVerified: boolean;
  capabilities: Array<{ capability: string; isEnabled: boolean }>;
  adminRoles: string[];
}

interface AbuseReportItem {
  id: string;
  reportNumber: string;
  targetType: string;
  reason: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolutionNote: string | null;
  createdAt: string;
  reporter?: { fullName: string; email: string };
}

interface AdminAuditLogItem {
  id: string;
  actorRoleCode: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  actor?: { fullName: string; email: string };
}

interface AdminProductRecord {
  id: string;
  slug: string;
  title: string;
  condition: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  badge: string | null;
  isFeatured: boolean;
  stock: number;
  province: string;
  city: string;
  area: string;
  status: 'ACTIVE' | 'PAUSED' | 'SOLD' | 'REMOVED';
  moderationStatus: 'APPROVED' | 'UNDER_REVIEW' | 'FLAGGED' | 'REMOVED';
  primaryImageUrl: string | null;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    sellerVerified: boolean;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface AdminServiceRecord {
  id: string;
  slug: string;
  title: string;
  serviceGroup: string;
  startingPrice: number;
  currency: string;
  availability: string;
  workingHours: string | null;
  contactPhone: string;
  province: string;
  city: string;
  primaryArea: string;
  status: 'ACTIVE' | 'PAUSED' | 'REMOVED';
  moderationStatus: 'APPROVED' | 'UNDER_REVIEW' | 'FLAGGED' | 'REMOVED';
  isFeatured: boolean;
  provider: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    providerVerified: boolean;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface AdminCategoryRecord {
  id: string;
  name: string;
  slug: string;
  type: 'PRODUCT' | 'SERVICE';
  groupName: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    products: number;
    services: number;
  };
}

interface AdminLocationRecord {
  id: string;
  province: string;
  city: string;
  areaName: string;
  isEnabled: boolean;
  sortOrder: number;
}

const INITIAL_SUPER_ADMIN_EMAIL = 'sohailsk7882261@gmail.com';

type AdminTab =
  | 'accounts'
  | 'users'
  | 'products'
  | 'services'
  | 'catalog'
  | 'reports'
  | 'audit';

let inFlightAdminRefresh: Promise<boolean> | null = null;

async function refreshAdminAccessCookie(): Promise<boolean> {
  if (!inFlightAdminRefresh) {
    inFlightAdminRefresh = fetch('/api/admin/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        inFlightAdminRefresh = null;
      });
  }
  return inFlightAdminRefresh;
}

async function adminApiFetch<T>(
  url: string,
  options?: RequestInit,
  allowRefreshRetry = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...options,
    headers,
  });

  if (
    response.status === 401 &&
    allowRefreshRetry &&
    !url.startsWith('/api/admin/auth/login') &&
    !url.startsWith('/api/admin/auth/setup') &&
    !url.startsWith('/api/admin/auth/refresh') &&
    !url.startsWith('/api/admin/auth/logout')
  ) {
    const refreshed = await refreshAdminAccessCookie();
    if (refreshed) {
      return adminApiFetch<T>(url, options, false);
    }
  }

  const payload = await response.json().catch(() => ({
    success: false,
    message: 'Unexpected response from server.',
  }));

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload.data as T;
}

export const AdminPortalPage: React.FC = () => {
  const [setupStatus, setSetupStatus] = useState<AdminSetupStatus | null>(null);
  const [admin, setAdmin] = useState<AdminAccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // One-time setup state
  const [setupToken, setSetupToken] = useState('');
  const [showSetupToken, setShowSetupToken] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState(INITIAL_SUPER_ADMIN_EMAIL);
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [submittingSetup, setSubmittingSetup] = useState(false);

  // Admin management data
  const [adminAccounts, setAdminAccounts] = useState<AdminAccountSummary[]>([]);
  const [marketplaceUsers, setMarketplaceUsers] = useState<MarketplaceUserRecord[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProductRecord[]>([]);
  const [adminServices, setAdminServices] = useState<AdminServiceRecord[]>([]);
  const [adminCategories, setAdminCategories] = useState<AdminCategoryRecord[]>([]);
  const [adminLocations, setAdminLocations] = useState<AdminLocationRecord[]>([]);
  const [reports, setReports] = useState<AbuseReportItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);

  // Marketplace governance filters & forms
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<string>('ALL');
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>('ALL');
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);

  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [newCategoryGroup, setNewCategoryGroup] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);

  const [locationSearch, setLocationSearch] = useState('');
  const [newLocationProvince, setNewLocationProvince] = useState('Punjab');
  const [newLocationCity, setNewLocationCity] = useState('');
  const [newLocationArea, setNewLocationArea] = useState('');
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [updatingLocationId, setUpdatingLocationId] = useState<string | null>(null);

  // Create/assign admin account form (SUPER_ADMIN only)
  const [newAdminMode, setNewAdminMode] = useState<'create' | 'promote'>('create');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRoleCode>('MODERATOR');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const loadBootstrapState = useCallback(async () => {
    setLoading(true);
    try {
      const status = await adminApiFetch<AdminSetupStatus>('/api/admin/auth/setup-status');
      setSetupStatus(status);

      if (!status.superAdminExists) {
        setAdmin(null);
        return;
      }

      try {
        const me = await adminApiFetch<{ admin: AdminAccountProfile }>('/api/admin/auth/me');
        setAdmin(me.admin);
        setFeedback((prev) => (prev?.type === 'error' ? null : prev));
      } catch {
        setAdmin(null);
      }
    } catch (err) {
      setSetupStatus(null);
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to reach admin auth service.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuthorizedData = useCallback(async (currentAdmin: AdminAccountProfile) => {
    const roles = currentAdmin.roles;
    const tasks: Promise<void>[] = [];

    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) {
      tasks.push(
        adminApiFetch<{ accounts: AdminAccountSummary[] }>('/api/admin/accounts')
          .then((d) => setAdminAccounts(d.accounts))
          .catch(() => {})
      );
      tasks.push(
        adminApiFetch<{ logs: AdminAuditLogItem[] }>('/api/admin/audit-logs')
          .then((d) => setAuditLogs(d.logs))
          .catch(() => {})
      );
    }

    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') || roles.includes('SUPPORT')) {
      tasks.push(
        adminApiFetch<{ users: MarketplaceUserRecord[] }>('/api/admin/users')
          .then((d) => setMarketplaceUsers(d.users))
          .catch(() => {})
      );
    }

    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') || roles.includes('MODERATOR')) {
      tasks.push(
        adminApiFetch<{ products: AdminProductRecord[] }>('/api/admin/marketplace/products')
          .then((d) => setAdminProducts(d.products))
          .catch(() => {})
      );
      tasks.push(
        adminApiFetch<{ services: AdminServiceRecord[] }>('/api/admin/marketplace/services')
          .then((d) => setAdminServices(d.services))
          .catch(() => {})
      );
      tasks.push(
        adminApiFetch<{ categories: AdminCategoryRecord[] }>('/api/admin/marketplace/categories')
          .then((d) => setAdminCategories(d.categories))
          .catch(() => {})
      );
      tasks.push(
        adminApiFetch<{ locations: AdminLocationRecord[] }>('/api/admin/marketplace/locations')
          .then((d) => setAdminLocations(d.locations))
          .catch(() => {})
      );
    }

    if (
      roles.includes('SUPER_ADMIN') ||
      roles.includes('ADMIN') ||
      roles.includes('MODERATOR') ||
      roles.includes('SUPPORT')
    ) {
      tasks.push(
        adminApiFetch<{ reports: AbuseReportItem[] }>('/api/admin/reports')
          .then((d) => setReports(d.reports))
          .catch(() => {})
      );
    }

    await Promise.all(tasks);
  }, []);

  useEffect(() => {
    void loadBootstrapState();
  }, [loadBootstrapState]);

  useEffect(() => {
    if (!admin) return;
    // Ensure any stale unauthenticated/session error banner is cleared immediately once authenticated
    setFeedback((prev) =>
      prev &&
      prev.type === 'error' &&
      /authentication required|session has expired|unauthorized/i.test(prev.text)
        ? null
        : prev
    );
    if (!admin.roles.includes('SUPER_ADMIN') && !admin.roles.includes('ADMIN')) {
      setActiveTab(
        admin.roles.includes('MODERATOR')
          ? 'products'
          : admin.roles.includes('SUPPORT')
            ? 'users'
            : 'reports'
      );
    }
    void loadAuthorizedData(admin);
  }, [admin, loadAuthorizedData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmittingLogin(true);
    try {
      const data = await adminApiFetch<{ admin: AdminAccountProfile }>('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      setAdmin(data.admin);
      setLoginPassword('');
      setFeedback({ type: 'success', text: `Signed in as ${data.admin.activeRole}.` });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Administrator sign-in failed.',
      });
    } finally {
      setSubmittingLogin(false);
    }
  };

  const handleOneTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmittingSetup(true);
    try {
      const data = await adminApiFetch<{ admin: AdminAccountProfile }>('/api/admin/auth/setup', {
        method: 'POST',
        body: JSON.stringify({
          setupToken,
          fullName: setupName,
          email: setupEmail,
          ...(setupPhone.trim() ? { phone: setupPhone.trim() } : {}),
          password: setupPassword,
        }),
      });
      setSetupToken('');
      setSetupPassword('');
      setLoginEmail(data.admin.email);
      setAdmin(data.admin);
      setFeedback({
        type: 'success',
        text: 'Initial SUPER_ADMIN created and signed in securely. One-time setup is now permanently locked.',
      });
      adminApiFetch<AdminSetupStatus>('/api/admin/auth/setup-status')
        .then(setSetupStatus)
        .catch(() => {});
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Super Admin setup failed.',
      });
    } finally {
      setSubmittingSetup(false);
    }
  };

  const handleLogout = async () => {
    setFeedback(null);
    try {
      await adminApiFetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      setAdmin(null);
      setAdminAccounts([]);
      setMarketplaceUsers([]);
      setAdminProducts([]);
      setAdminServices([]);
      setAdminCategories([]);
      setAdminLocations([]);
      setReports([]);
      setAuditLogs([]);
      setFeedback({ type: 'success', text: 'Signed out of administrator session.' });
    }
  };

  const handleCreateOrPromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setFeedback(null);
    setCreatingAdmin(true);
    try {
      await adminApiFetch('/api/admin/accounts', {
        method: 'POST',
        body: JSON.stringify({
          mode: newAdminMode,
          email: newAdminEmail,
          roleCode: newAdminRole,
          ...(newAdminMode === 'create'
            ? {
                fullName: newAdminName,
                phone: newAdminPhone,
                password: newAdminPassword,
              }
            : {}),
        }),
      });
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPhone('');
      setNewAdminPassword('');
      setFeedback({
        type: 'success',
        text: `Role ${newAdminRole} assigned and recorded in AdminAuditLog.`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to assign admin role.',
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleToggleRole = async (
    userId: string,
    roleCode: AdminRoleCode,
    action: 'assign' | 'revoke'
  ) => {
    if (!admin) return;
    setFeedback(null);
    try {
      await adminApiFetch(`/api/admin/accounts/${userId}/roles`, {
        method: 'PATCH',
        body: JSON.stringify({ roleCode, action }),
      });
      setFeedback({
        type: 'success',
        text: `Role ${roleCode} ${action === 'assign' ? 'assigned' : 'revoked'} and audited.`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Role update failed.',
      });
    }
  };

  const handleToggleSellerVerify = async (u: MarketplaceUserRecord) => {
    if (!admin) return;
    try {
      await adminApiFetch(`/api/admin/users/${u.id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ sellerVerified: !u.sellerVerified }),
      });
      setFeedback({ type: 'success', text: `Updated seller verification for ${u.fullName}.` });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update verification.',
      });
    }
  };

  const handleProductAction = async (
    product: AdminProductRecord,
    action: 'APPROVE' | 'FEATURE' | 'UNFEATURE' | 'SUSPEND' | 'REMOVE'
  ) => {
    if (!admin) return;
    setFeedback(null);
    setUpdatingProductId(product.id);
    try {
      const data = await adminApiFetch<{ product: AdminProductRecord }>(
        `/api/admin/marketplace/products/${product.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        }
      );
      setAdminProducts((prev) =>
        prev.map((item) => (item.id === product.id ? data.product : item))
      );
      setFeedback({
        type: 'success',
        text: `Updated product "${product.title}" (${action}).`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update product status.',
      });
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleServiceAction = async (
    service: AdminServiceRecord,
    action: 'VERIFY' | 'UNVERIFY' | 'FEATURE' | 'UNFEATURE' | 'SUSPEND' | 'ACTIVATE' | 'REMOVE'
  ) => {
    if (!admin) return;
    setFeedback(null);
    setUpdatingServiceId(service.id);
    try {
      const data = await adminApiFetch<{ service: AdminServiceRecord }>(
        `/api/admin/marketplace/services/${service.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        }
      );
      setAdminServices((prev) =>
        prev.map((item) => (item.id === service.id ? data.service : item))
      );
      setFeedback({
        type: 'success',
        text: `Updated service "${service.title}" (${action}).`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update service status.',
      });
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setFeedback(null);
    setCreatingCategory(true);
    try {
      const data = await adminApiFetch<{ category: AdminCategoryRecord }>(
        '/api/admin/marketplace/categories',
        {
          method: 'POST',
          body: JSON.stringify({
            name: newCategoryName.trim(),
            type: newCategoryType,
            groupName: newCategoryGroup.trim(),
            ...(newCategoryDescription.trim() ? { description: newCategoryDescription.trim() } : {}),
          }),
        }
      );
      setAdminCategories((prev) => [...prev, data.category]);
      setNewCategoryName('');
      setNewCategoryGroup('');
      setNewCategoryDescription('');
      setFeedback({
        type: 'success',
        text: `Added ${data.category.type} category "${data.category.name}".`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create category.',
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleToggleCategoryActive = async (category: AdminCategoryRecord) => {
    if (!admin) return;
    setFeedback(null);
    setUpdatingCategoryId(category.id);
    try {
      const data = await adminApiFetch<{ category: AdminCategoryRecord }>(
        `/api/admin/marketplace/categories/${category.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !category.isActive }),
        }
      );
      setAdminCategories((prev) =>
        prev.map((item) => (item.id === category.id ? data.category : item))
      );
      setFeedback({
        type: 'success',
        text: `Category "${category.name}" is now ${data.category.isActive ? 'active' : 'inactive'}.`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update category.',
      });
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setFeedback(null);
    setCreatingLocation(true);
    try {
      const data = await adminApiFetch<{ location: AdminLocationRecord }>(
        '/api/admin/marketplace/locations',
        {
          method: 'POST',
          body: JSON.stringify({
            province: newLocationProvince.trim(),
            city: newLocationCity.trim(),
            areaName: newLocationArea.trim(),
          }),
        }
      );
      setAdminLocations((prev) => [...prev, data.location]);
      setNewLocationCity('');
      setNewLocationArea('');
      setFeedback({
        type: 'success',
        text: `Added location "${data.location.areaName}, ${data.location.city}".`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to add supported location.',
      });
    } finally {
      setCreatingLocation(false);
    }
  };

  const handleToggleLocationEnabled = async (location: AdminLocationRecord) => {
    if (!admin) return;
    setFeedback(null);
    setUpdatingLocationId(location.id);
    try {
      const data = await adminApiFetch<{ location: AdminLocationRecord }>(
        `/api/admin/marketplace/locations/${location.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isEnabled: !location.isEnabled }),
        }
      );
      setAdminLocations((prev) =>
        prev.map((item) => (item.id === location.id ? data.location : item))
      );
      setFeedback({
        type: 'success',
        text: `Location "${location.areaName}, ${location.city}" ${
          data.location.isEnabled ? 'enabled' : 'disabled'
        }.`,
      });
      await loadAuthorizedData(admin);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update location.',
      });
    } finally {
      setUpdatingLocationId(null);
    }
  };

  const isSuperAdmin = Boolean(admin?.roles.includes('SUPER_ADMIN'));
  const canViewAdminAccounts = Boolean(
    admin?.roles.includes('SUPER_ADMIN') || admin?.roles.includes('ADMIN')
  );
  const canViewUsers = Boolean(
    admin?.roles.includes('SUPER_ADMIN') ||
      admin?.roles.includes('ADMIN') ||
      admin?.roles.includes('SUPPORT')
  );
  const canModerateCatalog = Boolean(
    admin?.roles.includes('SUPER_ADMIN') ||
      admin?.roles.includes('ADMIN') ||
      admin?.roles.includes('MODERATOR')
  );
  const canEditCatalogTaxonomy = Boolean(
    admin?.roles.includes('SUPER_ADMIN') || admin?.roles.includes('ADMIN')
  );

  const filteredProducts = adminProducts.filter((p) => {
    const matchesStatus = productStatusFilter === 'ALL' || p.status === productStatusFilter;
    const q = productSearch.trim().toLowerCase();
    if (!q) return matchesStatus;
    return (
      matchesStatus &&
      (p.title.toLowerCase().includes(q) ||
        p.owner.fullName.toLowerCase().includes(q) ||
        p.owner.email.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q))
    );
  });

  const filteredServices = adminServices.filter((s) => {
    const matchesStatus = serviceStatusFilter === 'ALL' || s.status === serviceStatusFilter;
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return matchesStatus;
    return (
      matchesStatus &&
      (s.title.toLowerCase().includes(q) ||
        s.serviceGroup.toLowerCase().includes(q) ||
        s.provider.fullName.toLowerCase().includes(q) ||
        s.provider.email.toLowerCase().includes(q) ||
        s.category.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.primaryArea.toLowerCase().includes(q))
    );
  });

  const filteredCategories = adminCategories.filter((cat) => {
    const matchesType = categoryTypeFilter === 'ALL' || cat.type === categoryTypeFilter;
    const q = categorySearch.trim().toLowerCase();
    if (!q) return matchesType;
    return (
      matchesType &&
      (cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        cat.groupName.toLowerCase().includes(q))
    );
  });

  const filteredLocations = adminLocations.filter((loc) => {
    const q = locationSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      loc.province.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.areaName.toLowerCase().includes(q)
    );
  });

  const showFeedbackBanner =
    Boolean(feedback) &&
    !(
      admin &&
      feedback?.type === 'error' &&
      /authentication required|session has expired|unauthorized/i.test(feedback.text)
    );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="px-3.5 py-2 rounded-lg bg-white border border-[#EADBC2] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED] inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#593B2A] bg-white border border-[#EADBC2] px-3 py-1.5 rounded-lg">
          <Lock className="w-3.5 h-3.5 text-[#C98A09]" />
          <span>Isolated Admin Auth · HTTP-Only Session Cookies · PostgreSQL RBAC</span>
        </span>
      </div>

      <section className="bg-[#593B2A] text-white rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5B82E]">
              <ShieldCheck className="w-4 h-4" />
              <span>LocalMarket Administration Portal</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Server-Verified Admin Authentication & RBAC
            </h1>
            <p className="text-xs sm:text-sm text-[#E9D8BA] max-w-2xl">
              Admin roles (SUPER_ADMIN, ADMIN, MODERATOR, SUPPORT) are enforced strictly on the
              server from PostgreSQL UserAdminRole records and kept separate from ordinary user
              marketplace capabilities.
            </p>
          </div>

          {admin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadBootstrapState()}
                className="px-3 py-2 rounded-lg bg-[#6D4B38] text-xs font-semibold text-white hover:bg-[#7D5843] inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-lg bg-[#F5B82E] text-xs font-bold text-[#593B2A] hover:bg-[#e5a820] inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {admin && (
          <div
            data-testid="admin-header-identity"
            className="pt-3 border-t border-[#76523E] flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span>
                <span className="text-[#E9D8BA]">Signed in as:</span>{' '}
                <strong className="text-white">{admin.fullName}</strong>
              </span>
              <span className="text-[#E9D8BA]">{admin.email}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#6D4B38] border border-[#8A624B] text-white font-semibold">
                Active Role: <strong className="text-[#F5B82E]">{admin.activeRole}</strong>
              </span>
              {isSuperAdmin && (
                <span
                  data-testid="header-super-admin-badge"
                  className="px-2.5 py-1 rounded-lg bg-[#F5B82E] text-[#2B170A] font-extrabold inline-flex items-center gap-1 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SUPER_ADMIN</span>
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {showFeedbackBanner && feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-semibold border ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EADBC2] p-8 text-center text-sm text-[#6E5644]">
          Checking server admin session...
        </div>
      ) : !admin ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {!setupStatus ? (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EADBC2] p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[#593B2A]">
                <ShieldAlert className="w-5 h-5 text-[#C98A09]" />
                <h2 className="font-display text-lg font-bold">
                  Unable to Load Admin Setup Status
                </h2>
              </div>
              <p className="text-xs text-[#6E5644] leading-relaxed">
                Could not verify whether an initial <code>SUPER_ADMIN</code> exists on the server.
                Please retry checking <code>GET /api/admin/auth/setup-status</code>.
              </p>
              <button
                type="button"
                onClick={() => void loadBootstrapState()}
                className="px-4 py-2.5 rounded-xl bg-[#593B2A] hover:bg-[#462E20] text-white text-xs font-bold inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Setup Status Check</span>
              </button>
            </div>
          ) : !setupStatus.superAdminExists ? (
            <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#F5B82E] p-6 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#593B2A]">
                  <ShieldCheck className="w-5 h-5 text-[#C98A09]" />
                  <h2 className="font-display text-lg font-bold">
                    One-Time Initial Super Admin Setup
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#FFF9ED] border border-[#F5B82E] text-[11px] font-bold text-[#593B2A]">
                  No SUPER_ADMIN Provisioned Yet
                </span>
              </div>

              <p className="text-xs text-[#6E5644] leading-relaxed">
                Create the initial <strong>SUPER_ADMIN</strong> account in PostgreSQL using the
                server&apos;s protected <code>ADMIN_SETUP_TOKEN</code>. Once created, this setup
                endpoint locks permanently and signs you in automatically using HTTP-only cookies.
              </p>

              {!setupStatus.databaseConnected ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900">
                  PostgreSQL database is currently disconnected. Confirm database connectivity
                  before creating the initial Super Admin account.
                </div>
              ) : !setupStatus.oneTimeSetupAvailable ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                  One-time setup is currently unavailable because <code>ADMIN_SETUP_TOKEN</code>{' '}
                  is not configured on the server.
                </div>
              ) : (
                <form onSubmit={handleOneTimeSetup} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="setup-full-name"
                        className="block text-xs font-bold text-[#593B2A]"
                      >
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="setup-full-name"
                        type="text"
                        required
                        value={setupName}
                        onChange={(e) => setSetupName(e.target.value)}
                        placeholder="Sohail Khan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-sm text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="setup-email"
                        className="block text-xs font-bold text-[#593B2A]"
                      >
                        Super Admin Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="setup-email"
                        type="email"
                        required
                        value={setupEmail}
                        onChange={(e) => setSetupEmail(e.target.value)}
                        placeholder={INITIAL_SUPER_ADMIN_EMAIL}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-sm text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-phone"
                      className="block text-xs font-bold text-[#593B2A]"
                    >
                      Pakistani Mobile Number{' '}
                      <span className="font-normal text-[#6E5644]">(Optional)</span>
                    </label>
                    <input
                      id="setup-phone"
                      type="text"
                      value={setupPhone}
                      onChange={(e) => setSetupPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-sm text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-password"
                      className="block text-xs font-bold text-[#593B2A]"
                    >
                      Strong Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="setup-password"
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        minLength={12}
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        placeholder="Minimum 12 characters (A-Z, a-z, 0-9, symbol)"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-sm text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5644]"
                        aria-label="Toggle setup password visibility"
                      >
                        {showSetupPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#6E5644]">
                      Must be at least 12 characters and include uppercase, lowercase, a digit, and
                      a special character. Hashed securely with bcryptjs.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="setup-token"
                      className="block text-xs font-bold text-[#593B2A]"
                    >
                      Server <code>ADMIN_SETUP_TOKEN</code> <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="setup-token"
                        type={showSetupToken ? 'text' : 'password'}
                        required
                        value={setupToken}
                        onChange={(e) => setSetupToken(e.target.value)}
                        placeholder="Paste ADMIN_SETUP_TOKEN from server secrets"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-sm text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupToken((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5644]"
                        aria-label="Toggle setup token visibility"
                      >
                        {showSetupToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSetup || !setupStatus.adminAuthConfigured}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#593B2A] hover:bg-[#462E20] text-white font-bold text-sm transition disabled:opacity-60"
                  >
                    {submittingSetup
                      ? 'Creating SUPER_ADMIN & Signing In...'
                      : 'Create Initial SUPER_ADMIN & Sign In'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleLogin}
              className="lg:col-span-7 bg-white rounded-2xl border border-[#EADBC2] p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-2 text-[#593B2A]">
                <KeyRound className="w-5 h-5 text-[#C98A09]" />
                <h2 className="font-display text-lg font-bold">Administrator Sign In</h2>
              </div>

              {setupStatus && !setupStatus.adminAuthConfigured && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                  Server admin JWT secrets (<code>ADMIN_JWT_ACCESS_SECRET</code> /{' '}
                  <code>ADMIN_JWT_REFRESH_SECRET</code> or <code>JWT_ACCESS_SECRET</code> /{' '}
                  <code>JWT_REFRESH_SECRET</code>, 32+ chars) must be configured in environment
                  secrets before admin login can issue sessions.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#593B2A]">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@yourdomain.pk"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-sm text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#593B2A]">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your administrator password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-sm text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5644]"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#e5a820] text-[#593B2A] font-bold text-sm transition disabled:opacity-60"
              >
                {submittingLogin ? 'Verifying Credentials...' : 'Sign In to Admin Portal'}
              </button>
            </form>
          )}

          <div className="lg:col-span-5 space-y-5">
            {setupStatus && !setupStatus.superAdminExists && (
              <form
                onSubmit={handleLogin}
                className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-center gap-2 text-[#593B2A]">
                  <KeyRound className="w-4 h-4 text-[#C98A09]" />
                  <h2 className="font-display text-base font-bold">Existing Admin Sign In</h2>
                </div>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@yourdomain.pk"
                  className="w-full px-3 py-2 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-xs text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                />
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Administrator password"
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-xs text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E5644]"
                    aria-label="Toggle login password visibility"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={submittingLogin}
                  className="w-full py-2 px-3 rounded-xl bg-[#F5B82E] hover:bg-[#e5a820] text-[#593B2A] font-bold text-xs transition disabled:opacity-60"
                >
                  {submittingLogin ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}

            <div className="bg-white rounded-2xl border border-[#EADBC2] p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[#593B2A]">
                <ShieldAlert className="w-5 h-5 text-[#C98A09]" />
                <h2 className="font-display text-base font-bold">Security Boundaries</h2>
              </div>

              <ul className="space-y-2 text-xs text-[#6E5644] leading-relaxed list-disc pl-4">
                <li>Admin accounts can never be created via public signup.</li>
                <li>No default admin credentials exist in code or seed data.</li>
                <li>
                  Only an authenticated <strong>SUPER_ADMIN</strong> can create or assign{' '}
                  <code>ADMIN</code>, <code>MODERATOR</code>, or <code>SUPPORT</code> roles.
                </li>
                <li>
                  All privileged mutations are recorded in PostgreSQL{' '}
                  <code>AdminAuditLog</code>.
                </li>
              </ul>

              {setupStatus && (
                <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3 text-xs space-y-1 text-[#593B2A]">
                  <div>
                    <strong>Database Connected:</strong>{' '}
                    {setupStatus.databaseConnected ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Super Admin Provisioned:</strong>{' '}
                    {setupStatus.superAdminExists ? 'Yes (One-time setup locked)' : 'No'}
                  </div>
                  <div>
                    <strong>One-Time Setup Available:</strong>{' '}
                    {setupStatus.oneTimeSetupAvailable ? 'Yes (Token configured)' : 'No'}
                  </div>
                  <div>
                    <strong>Admin Auth Secrets:</strong>{' '}
                    {setupStatus.adminAuthConfigured ? 'Configured' : 'Missing'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Authenticated Admin Profile Section */}
          <section
            data-testid="admin-profile-section"
            className="bg-white rounded-2xl border border-[#EADBC2] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#6E5644]">
                  Authenticated Administrator Profile
                </span>
                {isSuperAdmin && (
                  <span
                    data-testid="profile-super-admin-badge"
                    className="px-2.5 py-0.5 rounded-md bg-[#F5B82E] text-[#2B170A] text-[11px] font-extrabold inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>SUPER_ADMIN</span>
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-[#593B2A]">{admin.fullName}</div>
              <div className="text-xs text-[#6E5644] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-[#593B2A]">{admin.email}</span>
                <span>·</span>
                <span>
                  {admin.city}, {admin.province}
                </span>
                <span>·</span>
                <span>Status: {admin.accountStatus}</span>
                {admin.lastLoginAt && (
                  <>
                    <span>·</span>
                    <span>Last login: {new Date(admin.lastLoginAt).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <div className="text-xs font-semibold text-[#593B2A]">
                Active Role:{' '}
                <span
                  data-testid="profile-active-role"
                  className="px-2.5 py-1 rounded-lg bg-[#593B2A] text-[#F5B82E] font-bold ml-1"
                >
                  {admin.activeRole}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[#6E5644] font-semibold mr-1">
                  Assigned Roles:
                </span>
                {admin.roles.map((role) => (
                  <span
                    key={role}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1 ${
                      role === 'SUPER_ADMIN'
                        ? 'bg-[#FFF3CC] border-[#C98A09] text-[#2B170A]'
                        : 'bg-[#FFF9ED] border-[#F5B82E] text-[#593B2A]'
                    }`}
                  >
                    {role === 'SUPER_ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-[#C98A09]" />}
                    <span>{role}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {canViewAdminAccounts && (
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                  activeTab === 'accounts'
                    ? 'bg-[#593B2A] text-white border-[#593B2A]'
                    : 'bg-white text-[#593B2A] border-[#EADBC2]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Accounts & Roles ({adminAccounts.length})</span>
              </button>
            )}
            {canViewUsers && (
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                  activeTab === 'users'
                    ? 'bg-[#593B2A] text-white border-[#593B2A]'
                    : 'bg-white text-[#593B2A] border-[#EADBC2]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Marketplace Users ({marketplaceUsers.length})</span>
              </button>
            )}
            {canModerateCatalog && (
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                  activeTab === 'products'
                    ? 'bg-[#593B2A] text-white border-[#593B2A]'
                    : 'bg-white text-[#593B2A] border-[#EADBC2]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Products & Listings ({adminProducts.length})</span>
              </button>
            )}
            {canModerateCatalog && (
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                  activeTab === 'services'
                    ? 'bg-[#593B2A] text-white border-[#593B2A]'
                    : 'bg-white text-[#593B2A] border-[#EADBC2]'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Services ({adminServices.length})</span>
              </button>
            )}
            {canModerateCatalog && (
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                  activeTab === 'catalog'
                    ? 'bg-[#593B2A] text-white border-[#593B2A]'
                    : 'bg-white text-[#593B2A] border-[#EADBC2]'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>
                  Categories & Locations ({adminCategories.length + adminLocations.length})
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                activeTab === 'reports'
                  ? 'bg-[#593B2A] text-white border-[#593B2A]'
                  : 'bg-white text-[#593B2A] border-[#EADBC2]'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Reports ({reports.length})</span>
            </button>
            {canViewAdminAccounts && (
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${
                  activeTab === 'audit'
                    ? 'bg-[#593B2A] text-white border-[#593B2A]'
                    : 'bg-white text-[#593B2A] border-[#EADBC2]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AdminAuditLog ({auditLogs.length})</span>
              </button>
            )}
          </div>

          {activeTab === 'accounts' && canViewAdminAccounts && (
            <div className="space-y-5">
              {isSuperAdmin && (
                <form
                  onSubmit={handleCreateOrPromoteAdmin}
                  className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-base font-bold text-[#593B2A] inline-flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#C98A09]" />
                      <span>Create or Assign Admin Account (SUPER_ADMIN Only)</span>
                    </h2>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewAdminMode('create')}
                        className={`px-2.5 py-1 rounded-lg font-semibold border ${
                          newAdminMode === 'create'
                            ? 'bg-[#FFF9ED] border-[#F5B82E] text-[#593B2A]'
                            : 'border-[#EADBC2] text-[#6E5644]'
                        }`}
                      >
                        New Admin Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAdminMode('promote')}
                        className={`px-2.5 py-1 rounded-lg font-semibold border ${
                          newAdminMode === 'promote'
                            ? 'bg-[#FFF9ED] border-[#F5B82E] text-[#593B2A]'
                            : 'border-[#EADBC2] text-[#6E5644]'
                        }`}
                      >
                        Promote Existing User
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="Email Address"
                      className="px-3 py-2 rounded-xl border border-[#EADBC2] text-xs"
                    />
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as AdminRoleCode)}
                      className="px-3 py-2 rounded-xl border border-[#EADBC2] text-xs bg-white"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                    {newAdminMode === 'create' && (
                      <>
                        <input
                          type="text"
                          required
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="Full Name"
                          className="px-3 py-2 rounded-xl border border-[#EADBC2] text-xs"
                        />
                        <input
                          type="text"
                          required
                          value={newAdminPhone}
                          onChange={(e) => setNewAdminPhone(e.target.value)}
                          placeholder="0300-1234567"
                          className="px-3 py-2 rounded-xl border border-[#EADBC2] text-xs"
                        />
                        <input
                          type="password"
                          required
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Password (12+ chars, Aa1!)"
                          className="px-3 py-2 rounded-xl border border-[#EADBC2] text-xs"
                        />
                      </>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={creatingAdmin}
                    className="px-4 py-2 rounded-xl bg-[#F5B82E] text-[#593B2A] text-xs font-bold hover:bg-[#e5a820]"
                  >
                    {creatingAdmin
                      ? 'Saving...'
                      : newAdminMode === 'create'
                        ? 'Create Admin Account'
                        : 'Assign Role to User'}
                  </button>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-[#EADBC2] overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF9ED] border-b border-[#EADBC2] text-[#593B2A]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Admin</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Assigned Roles</th>
                      <th className="px-4 py-3 font-bold">Active Sessions</th>
                      {isSuperAdmin && <th className="px-4 py-3 font-bold">Manage</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBC2]">
                    {adminAccounts.map((acc) => (
                      <tr key={acc.id}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#593B2A]">{acc.fullName}</div>
                          <div className="text-[#6E5644]">{acc.email}</div>
                        </td>
                        <td className="px-4 py-3">{acc.accountStatus}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {acc.roles.map((r) => (
                              <span
                                key={`${acc.id}-${r.code}`}
                                className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                                  r.isActive
                                    ? 'bg-[#FFF9ED] border-[#F5B82E] text-[#593B2A]'
                                    : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                                }`}
                              >
                                {r.code}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">{acc.activeSessionCount}</td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {acc.roles
                                .filter((r) => r.isActive)
                                .map((r) => (
                                  <button
                                    key={`revoke-${acc.id}-${r.code}`}
                                    type="button"
                                    onClick={() =>
                                      void handleToggleRole(
                                        acc.id,
                                        r.code as AdminRoleCode,
                                        'revoke'
                                      )
                                    }
                                    className="px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-semibold"
                                  >
                                    Revoke {r.code}
                                  </button>
                                ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && canViewUsers && (
            <div className="bg-white rounded-2xl border border-[#EADBC2] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF9ED] border-b border-[#EADBC2] text-[#593B2A]">
                  <tr>
                    <th className="px-4 py-3 font-bold">User</th>
                    <th className="px-4 py-3 font-bold">City</th>
                    <th className="px-4 py-3 font-bold">Ordinary Capabilities</th>
                    <th className="px-4 py-3 font-bold">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBC2]">
                  {marketplaceUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[#6E5644]">
                        No marketplace users recorded in PostgreSQL yet.
                      </td>
                    </tr>
                  ) : (
                    marketplaceUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#593B2A]">{u.fullName}</div>
                          <div className="text-[#6E5644]">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">{u.city}</td>
                        <td className="px-4 py-3">
                          {u.capabilities.filter((c) => c.isEnabled).length === 0
                            ? 'None (Admin-only account)'
                            : u.capabilities
                                .filter((c) => c.isEnabled)
                                .map((c) => c.capability)
                                .join(', ')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleToggleSellerVerify(u)}
                            className="px-2.5 py-1 rounded border border-[#EADBC2] hover:bg-[#FFF9ED] font-semibold text-[#593B2A]"
                          >
                            {u.sellerVerified ? 'Seller Verified ✓' : 'Verify Seller'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'products' && canModerateCatalog && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#EADBC2] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[#6E5644] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by title, seller, category, city, or area..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-xs text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#EADBC2] bg-white text-xs font-semibold text-[#593B2A]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="SOLD">SOLD</option>
                    <option value="REMOVED">REMOVED</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadAuthorizedData(admin)}
                    className="px-3 py-2 rounded-xl bg-[#FFF9ED] border border-[#EADBC2] text-xs font-bold text-[#593B2A] hover:bg-[#F5B82E]/20 inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EADBC2] overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF9ED] border-b border-[#EADBC2] text-[#593B2A]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Product</th>
                      <th className="px-4 py-3 font-bold">Seller</th>
                      <th className="px-4 py-3 font-bold">Category</th>
                      <th className="px-4 py-3 font-bold">Price</th>
                      <th className="px-4 py-3 font-bold">Location</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBC2]">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[#6E5644]">
                          No marketplace product listings match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const busy = updatingProductId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-[#FFF9ED]/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {p.primaryImageUrl ? (
                                  <img
                                    src={p.primaryImageUrl}
                                    alt={p.title}
                                    className="w-10 h-10 rounded-lg object-cover border border-[#EADBC2] shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-[#FFF9ED] border border-[#EADBC2] flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-[#C98A09]" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-[#593B2A]">{p.title}</div>
                                  <div className="text-[11px] text-[#6E5644]">
                                    Condition: {p.condition}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[#593B2A]">{p.owner.fullName}</div>
                              <div className="text-[11px] text-[#6E5644]">{p.owner.email}</div>
                            </td>
                            <td className="px-4 py-3 text-[#593B2A] font-medium">
                              {p.category.name}
                            </td>
                            <td className="px-4 py-3 font-bold text-[#593B2A] whitespace-nowrap">
                              Rs. {p.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-[#6E5644]">
                              {p.area}, {p.city}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                    p.status === 'ACTIVE'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : p.status === 'PAUSED'
                                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                                        : 'bg-red-50 border-red-200 text-red-700'
                                  }`}
                                >
                                  {p.status}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#FFF9ED] border border-[#EADBC2] text-[10px] font-semibold text-[#593B2A]">
                                  {p.moderationStatus}
                                </span>
                                {p.isFeatured && (
                                  <span className="px-2 py-0.5 rounded bg-[#F5B82E] text-[#2B170A] text-[10px] font-extrabold inline-flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>FEATURED</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleProductAction(p, 'APPROVE')}
                                  className="px-2 py-1 rounded border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void handleProductAction(
                                      p,
                                      p.isFeatured ? 'UNFEATURE' : 'FEATURE'
                                    )
                                  }
                                  className="px-2 py-1 rounded border border-[#F5B82E] bg-[#FFF9ED] text-[#593B2A] hover:bg-[#F5B82E]/30 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>{p.isFeatured ? 'Unfeature' : 'Feature'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleProductAction(p, 'SUSPEND')}
                                  className="px-2 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-50 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Suspend</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy || p.status === 'REMOVED'}
                                  onClick={() => void handleProductAction(p, 'REMOVE')}
                                  className="px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'services' && canModerateCatalog && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#EADBC2] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[#6E5644] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services by title, provider, category, city, or area..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-xs text-[#593B2A] focus:outline-none focus:ring-2 focus:ring-[#F5B82E]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={serviceStatusFilter}
                    onChange={(e) => setServiceStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#EADBC2] bg-white text-xs font-semibold text-[#593B2A]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="REMOVED">REMOVED</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadAuthorizedData(admin)}
                    className="px-3 py-2 rounded-xl bg-[#FFF9ED] border border-[#EADBC2] text-xs font-bold text-[#593B2A] hover:bg-[#F5B82E]/20 inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EADBC2] overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF9ED] border-b border-[#EADBC2] text-[#593B2A]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Service</th>
                      <th className="px-4 py-3 font-bold">Provider</th>
                      <th className="px-4 py-3 font-bold">Category</th>
                      <th className="px-4 py-3 font-bold">Rate &amp; City</th>
                      <th className="px-4 py-3 font-bold">Status &amp; Verification</th>
                      <th className="px-4 py-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADBC2]">
                    {filteredServices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#6E5644]">
                          No marketplace service listings match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredServices.map((s) => {
                        const busy = updatingServiceId === s.id;
                        return (
                          <tr key={s.id} className="hover:bg-[#FFF9ED]/50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-[#593B2A]">{s.title}</div>
                              <div className="text-[11px] text-[#6E5644]">{s.serviceGroup}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[#593B2A]">
                                {s.provider.fullName}
                              </div>
                              <div className="text-[11px] text-[#6E5644]">{s.provider.email}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-[#593B2A]">
                              {s.category.name}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-[#593B2A]">
                                Rs. {s.startingPrice.toLocaleString()}
                              </div>
                              <div className="text-[11px] text-[#6E5644]">
                                {s.primaryArea}, {s.city}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                    s.status === 'ACTIVE'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : s.status === 'PAUSED'
                                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                                        : 'bg-red-50 border-red-200 text-red-700'
                                  }`}
                                >
                                  {s.status}
                                </span>
                                {s.provider.providerVerified && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>VERIFIED</span>
                                  </span>
                                )}
                                {s.isFeatured && (
                                  <span className="px-2 py-0.5 rounded bg-[#F5B82E] text-[#2B170A] text-[10px] font-extrabold inline-flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span>FEATURED</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void handleServiceAction(
                                      s,
                                      s.provider.providerVerified ? 'UNVERIFY' : 'VERIFY'
                                    )
                                  }
                                  className="px-2 py-1 rounded border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>
                                    {s.provider.providerVerified ? 'Unverify' : 'Verify'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void handleServiceAction(
                                      s,
                                      s.isFeatured ? 'UNFEATURE' : 'FEATURE'
                                    )
                                  }
                                  className="px-2 py-1 rounded border border-[#F5B82E] bg-[#FFF9ED] text-[#593B2A] hover:bg-[#F5B82E]/30 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>{s.isFeatured ? 'Unfeature' : 'Feature'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void handleServiceAction(
                                      s,
                                      s.status === 'PAUSED' ? 'ACTIVATE' : 'SUSPEND'
                                    )
                                  }
                                  className="px-2 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-50 text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>{s.status === 'PAUSED' ? 'Activate' : 'Suspend'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && canModerateCatalog && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Marketplace Categories Panel */}
              <div className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-[#593B2A] inline-flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#C98A09]" />
                    <span>Marketplace Categories ({adminCategories.length})</span>
                  </h2>
                  <select
                    value={categoryTypeFilter}
                    onChange={(e) =>
                      setCategoryTypeFilter(e.target.value as 'ALL' | 'PRODUCT' | 'SERVICE')
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-[#EADBC2] text-xs font-semibold text-[#593B2A] bg-[#FFF9ED]"
                  >
                    <option value="ALL">All Types</option>
                    <option value="PRODUCT">PRODUCT</option>
                    <option value="SERVICE">SERVICE</option>
                  </select>
                </div>

                {canEditCatalogTaxonomy && (
                  <form
                    onSubmit={handleCreateCategory}
                    className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3.5 space-y-2.5"
                  >
                    <div className="text-xs font-bold text-[#593B2A] inline-flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#C98A09]" />
                      <span>Add Category</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category Name"
                        className="px-3 py-2 rounded-lg border border-[#EADBC2] bg-white text-xs text-[#593B2A]"
                      />
                      <select
                        value={newCategoryType}
                        onChange={(e) =>
                          setNewCategoryType(e.target.value as 'PRODUCT' | 'SERVICE')
                        }
                        className="px-3 py-2 rounded-lg border border-[#EADBC2] bg-white text-xs text-[#593B2A]"
                      >
                        <option value="PRODUCT">PRODUCT</option>
                        <option value="SERVICE">SERVICE</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={newCategoryGroup}
                        onChange={(e) => setNewCategoryGroup(e.target.value)}
                        placeholder="Group (e.g., Electronics)"
                        className="px-3 py-2 rounded-lg border border-[#EADBC2] bg-white text-xs text-[#593B2A]"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Optional short description"
                        className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-[#EADBC2] bg-white text-xs text-[#593B2A]"
                      />
                      <button
                        type="submit"
                        disabled={creatingCategory}
                        className="px-3.5 py-2 rounded-lg bg-[#593B2A] hover:bg-[#462E20] text-white text-xs font-bold disabled:opacity-60"
                      >
                        {creatingCategory ? 'Adding...' : 'Add Category'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6E5644] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Filter categories by name, slug, or group..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-xs text-[#593B2A]"
                  />
                </div>

                <div className="max-h-[420px] overflow-y-auto border border-[#EADBC2] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF9ED] border-b border-[#EADBC2] text-[#593B2A] sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">Category</th>
                        <th className="px-3 py-2.5 font-bold">Type &amp; Group</th>
                        <th className="px-3 py-2.5 font-bold">Status</th>
                        {canEditCatalogTaxonomy && (
                          <th className="px-3 py-2.5 font-bold">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADBC2]">
                      {filteredCategories.map((cat) => (
                        <tr key={cat.id}>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-[#593B2A]">{cat.name}</div>
                            <div className="text-[10px] text-[#6E5644] font-mono">{cat.slug}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#FFF9ED] border border-[#EADBC2] text-[10px] font-bold text-[#593B2A]">
                              {cat.type}
                            </span>
                            <div className="text-[11px] text-[#6E5644] mt-0.5">
                              {cat.groupName} ·{' '}
                              {(cat._count?.products ?? 0) + (cat._count?.services ?? 0)} listings
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                cat.isActive
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-gray-100 border-gray-300 text-gray-600'
                              }`}
                            >
                              {cat.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {canEditCatalogTaxonomy && (
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                disabled={updatingCategoryId === cat.id}
                                onClick={() => void handleToggleCategoryActive(cat)}
                                className="px-2.5 py-1 rounded border border-[#EADBC2] hover:bg-[#FFF9ED] text-[11px] font-bold text-[#593B2A] disabled:opacity-50"
                              >
                                {cat.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supported Locations Panel */}
              <div className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-[#593B2A] inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C98A09]" />
                    <span>Supported Locations ({adminLocations.length})</span>
                  </h2>
                </div>

                {canEditCatalogTaxonomy && (
                  <form
                    onSubmit={handleCreateLocation}
                    className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3.5 space-y-2.5"
                  >
                    <div className="text-xs font-bold text-[#593B2A] inline-flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#C98A09]" />
                      <span>Add Supported City / Neighborhood</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={newLocationProvince}
                        onChange={(e) => setNewLocationProvince(e.target.value)}
                        placeholder="Province (e.g., Punjab)"
                        className="px-3 py-2 rounded-lg border border-[#EADBC2] bg-white text-xs text-[#593B2A]"
                      />
                      <input
                        type="text"
                        required
                        value={newLocationCity}
                        onChange={(e) => setNewLocationCity(e.target.value)}
                        placeholder="City (e.g., Lahore)"
                        className="px-3 py-2 rounded-lg border border-[#EADBC2] bg-white text-xs text-[#593B2A]"
                      />
                      <input
                        type="text"
                        required
                        value={newLocationArea}
                        onChange={(e) => setNewLocationArea(e.target.value)}
                        placeholder="Area / Neighborhood"
                        className="px-3 py-2 rounded-lg border border-[#EADBC2] bg-white text-xs text-[#593B2A]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={creatingLocation}
                        className="px-3.5 py-2 rounded-lg bg-[#F5B82E] hover:bg-[#e5a820] text-[#593B2A] text-xs font-bold disabled:opacity-60"
                      >
                        {creatingLocation ? 'Adding...' : 'Add Location'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6E5644] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Filter locations by province, city, or area..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] text-xs text-[#593B2A]"
                  />
                </div>

                <div className="max-h-[420px] overflow-y-auto border border-[#EADBC2] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF9ED] border-b border-[#EADBC2] text-[#593B2A] sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">Area / Neighborhood</th>
                        <th className="px-3 py-2.5 font-bold">City &amp; Province</th>
                        <th className="px-3 py-2.5 font-bold">Status</th>
                        {canEditCatalogTaxonomy && (
                          <th className="px-3 py-2.5 font-bold">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADBC2]">
                      {filteredLocations.map((loc) => (
                        <tr key={loc.id}>
                          <td className="px-3 py-2.5 font-bold text-[#593B2A]">{loc.areaName}</td>
                          <td className="px-3 py-2.5 text-[#6E5644]">
                            {loc.city}, {loc.province}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                loc.isEnabled
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-gray-100 border-gray-300 text-gray-600'
                              }`}
                            >
                              {loc.isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          {canEditCatalogTaxonomy && (
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                disabled={updatingLocationId === loc.id}
                                onClick={() => void handleToggleLocationEnabled(loc)}
                                className="px-2.5 py-1 rounded border border-[#EADBC2] hover:bg-[#FFF9ED] text-[11px] font-bold text-[#593B2A] disabled:opacity-50"
                              >
                                {loc.isEnabled ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-[#EADBC2] p-5 text-xs text-[#6E5644]">
              {reports.length === 0
                ? 'No abuse reports submitted yet.'
                : reports.map((r) => (
                    <div key={r.id} className="py-2 border-b border-[#EADBC2] last:border-0">
                      <strong className="text-[#593B2A]">{r.reportNumber}</strong> · {r.targetType} ·{' '}
                      {r.status} — {r.reason}
                    </div>
                  ))}
            </div>
          )}

          {activeTab === 'audit' && canViewAdminAccounts && (
            <div className="bg-white rounded-2xl border border-[#EADBC2] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF9ED] border-b border-[#EADBC2] text-[#593B2A]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Timestamp</th>
                    <th className="px-4 py-3 font-bold">Actor & Role</th>
                    <th className="px-4 py-3 font-bold">Action</th>
                    <th className="px-4 py-3 font-bold">Target</th>
                    <th className="px-4 py-3 font-bold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADBC2]">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#593B2A]">
                          {log.actor?.email ?? 'System'}
                        </div>
                        <div className="text-[#6E5644]">{log.actorRoleCode}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#593B2A]">{log.action}</td>
                      <td className="px-4 py-3">
                        {log.targetType} ({log.targetId.slice(0, 12)})
                      </td>
                      <td className="px-4 py-3">{log.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
