import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Flag,
  FolderTree,
  Lock,
  MapPin,
  Package,
  Server,
  Settings,
  ShieldAlert,
  Users,
  Wrench,
} from 'lucide-react';
import { PRODUCT_CATEGORY_GROUP, SERVICE_CATEGORY_GROUPS } from '../../data/categories';
import { PAKISTAN_LOCATIONS } from '../../data/locations';
import { ALL_SERVICE_CATEGORIES } from '../../data/marketplaceData';
import {
  ADMIN_READY_MODULES,
  AdminLocationEntry,
  AdminModuleKey,
  AdminPlatformSettings,
  AdminReportRecord,
  AdminUserSummary,
} from '../../types/admin';

type BlueprintTab = Exclude<AdminModuleKey, 'listings'>;

const SAMPLE_BLUEPRINT_USERS: AdminUserSummary[] = [
  {
    id: 'usr-demo-hamza',
    name: 'Hamza Afridi',
    email: 'hamza.afridi@example.pk',
    phone: '0300-9123456',
    city: 'Peshawar',
    activeCapabilities: ['buy', 'sell', 'offerServices', 'hireProviders'],
    accountState: 'Active',
    joinedAt: 'Nov 2026',
  },
  {
    id: 'usr-blueprint-sana',
    name: 'Sanaullah Khan',
    email: 'sana.khan@example.pk',
    phone: '0313-9004411',
    city: 'Lahore',
    activeCapabilities: ['buy', 'offerServices'],
    accountState: 'PendingVerification',
    joinedAt: 'Nov 2026',
  },
  {
    id: 'usr-blueprint-bilal',
    name: 'Bilal Traders',
    email: 'bilal.traders@example.pk',
    phone: '0321-4455667',
    city: 'Islamabad',
    activeCapabilities: ['buy', 'sell'],
    accountState: 'Active',
    joinedAt: 'Oct 2026',
  },
];

const SAMPLE_BLUEPRINT_REPORTS: AdminReportRecord[] = [
  {
    id: 'REP-101',
    targetType: 'product',
    targetId: 'prod-1',
    reason: 'Requested seller warranty verification receipt',
    reportedBy: 'Community Member (Peshawar)',
    state: 'Investigating',
    createdAt: '2 hours ago',
  },
  {
    id: 'REP-102',
    targetType: 'service',
    targetId: 'srv-2',
    reason: 'Service hours update requested by customer',
    reportedBy: 'Community Member (Hayatabad)',
    state: 'Resolved',
    createdAt: '1 day ago',
  },
];

const PLANNED_SETTINGS: AdminPlatformSettings = {
  siteTitle: 'LocalMarket Pakistan',
  defaultCity: 'Peshawar',
  currencyCode: 'PKR',
  requirePhoneVerification: true,
  moderationMode: 'manual',
};

interface AdminDashboardBlueprintPageProps {
  totalProducts: number;
  totalServices: number;
}

export const AdminDashboardBlueprintPage: React.FC<AdminDashboardBlueprintPageProps> = ({
  totalProducts,
  totalServices,
}) => {
  const [activeTab, setActiveTab] = useState<BlueprintTab>('users');

  const tabs: { key: BlueprintTab; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: 'User Management', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'products', label: 'Product Management', icon: <Package className="w-3.5 h-3.5" /> },
    { key: 'services', label: 'Service Management', icon: <Wrench className="w-3.5 h-3.5" /> },
    { key: 'categories', label: 'Category Management', icon: <FolderTree className="w-3.5 h-3.5" /> },
    { key: 'locations', label: 'Location Management', icon: <MapPin className="w-3.5 h-3.5" /> },
    { key: 'reports', label: 'Reports', icon: <Flag className="w-3.5 h-3.5" /> },
    { key: 'settings', label: 'Platform Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const activeModuleMeta = ADMIN_READY_MODULES.find((m) => m.key === activeTab);

  const locationEntries: AdminLocationEntry[] = PAKISTAN_LOCATIONS.flatMap((entry) =>
    entry.cities.map((cityData) => ({
      province: entry.province,
      city: cityData.city,
      areas: cityData.areas,
      enabled: true,
    }))
  );

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard/profile"
          className="px-3.5 py-2 rounded-lg bg-white border border-[#EADBC2] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED] inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account Settings</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#593B2A] bg-white border border-[#EADBC2] px-3 py-1.5 rounded-lg">
          <Lock className="w-3.5 h-3.5 text-[#C98A09]" />
          <span>Read-Only UI Blueprint · Server RBAC Required</span>
        </span>
      </div>

      {/* Security Boundary Header */}
      <section className="bg-[#593B2A] text-white rounded-2xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5B82E]">
              <ShieldAlert className="w-4 h-4" />
              <span>Admin-Ready Frontend Architecture</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Future Admin Dashboard Structure (Planning Preview)
            </h1>
            <p className="text-xs sm:text-sm text-[#E9D8BA] max-w-3xl leading-relaxed">
              This separate module outlines the UI layouts and API contracts for User, Product,
              Service, Category, Location, Reports, and Platform Settings management. Privileged
              mutations are intentionally disabled on the client—actual admin authorization must be
              verified on the backend server.
            </p>
          </div>
        </div>

        {/* 7 Planned Module Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/15">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#F5B82E] text-[#382619]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Planned Backend Contract Bar */}
      {activeModuleMeta && (
        <div className="bg-white rounded-xl border border-[#EADBC2] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#382619]">
            <Server className="w-4 h-4 text-[#593B2A] shrink-0" />
            <span>
              <strong>{activeModuleMeta.label}:</strong> {activeModuleMeta.description}
            </span>
          </div>
          <code className="px-2.5 py-1 rounded bg-[#FFF9ED] border border-[#EADBC2] font-mono text-[11px] text-[#593B2A]">
            {activeModuleMeta.plannedEndpoint}
          </code>
        </div>
      )}

      {/* 1. User Management */}
      {activeTab === 'users' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#382619]">
                User Management (Planned View)
              </h2>
              <p className="text-xs text-[#6F5643]">
                Inspect unified multi-capability accounts, verification flags, and account state.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#8A7158]">
              Write controls locked until backend RBAC
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EADBC2] text-[#6F5643]">
                  <th className="py-2.5 pr-4 font-bold">Member</th>
                  <th className="py-2.5 pr-4 font-bold">Contact</th>
                  <th className="py-2.5 pr-4 font-bold">City</th>
                  <th className="py-2.5 pr-4 font-bold">Capabilities</th>
                  <th className="py-2.5 pr-4 font-bold">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E3CC]">
                {SAMPLE_BLUEPRINT_USERS.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4 font-bold text-[#382619]">{u.name}</td>
                    <td className="py-3 pr-4 text-[#5C432D] tabular-nums">
                      {u.email} · {u.phone}
                    </td>
                    <td className="py-3 pr-4 text-[#5C432D]">{u.city}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {u.activeCapabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-0.5 rounded bg-[#FFF9ED] border border-[#EADBC2] text-[10px] font-bold text-[#593B2A]"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-[#1D8348]">{u.accountState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 2. Product Management */}
      {activeTab === 'products' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Product Moderation &amp; Catalog Management (Planned View)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643] font-semibold">Current Catalog Products</p>
              <p className="font-display text-2xl font-extrabold text-[#382619] mt-1 tabular-nums">
                {totalProducts}
              </p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643] font-semibold">Planned Actions</p>
              <p className="text-[#382619] font-bold mt-1">Approve · Flag · Pause · Remove</p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643] font-semibold">Audit Requirement</p>
              <p className="text-[#382619] font-bold mt-1">Server Admin JWT + Audit Log</p>
            </div>
          </div>
        </section>
      )}

      {/* 3. Service Management */}
      {activeTab === 'services' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Service Directory &amp; Provider Verification (Planned View)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643] font-semibold">Active Directory Listings</p>
              <p className="font-display text-2xl font-extrabold text-[#382619] mt-1 tabular-nums">
                {totalServices}
              </p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643] font-semibold">Service Categories</p>
              <p className="font-display text-2xl font-extrabold text-[#382619] mt-1 tabular-nums">
                {ALL_SERVICE_CATEGORIES.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643] font-semibold">Planned Verification Flow</p>
              <p className="text-[#382619] font-bold mt-1">CNIC / Trade Badge Server Review</p>
            </div>
          </div>
        </section>
      )}

      {/* 4. Category Management */}
      {activeTab === 'categories' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Category Taxonomy Management (Planned View)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 space-y-2">
              <p className="font-bold text-[#382619]">
                Product Categories ({PRODUCT_CATEGORY_GROUP.items.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_CATEGORY_GROUP.items.map((item) => (
                  <span
                    key={item.id}
                    className="px-2.5 py-1 rounded-md bg-white border border-[#EADBC2] font-semibold text-[#382619]"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 space-y-2">
              <p className="font-bold text-[#382619]">
                Service Groups ({SERVICE_CATEGORY_GROUPS.length}) · {ALL_SERVICE_CATEGORIES.length}{' '}
                Trades
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SERVICE_CATEGORIES.map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 rounded-md bg-white border border-[#EADBC2] font-semibold text-[#593B2A]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Location Management */}
      {activeTab === 'locations' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Pakistan Location Hierarchy Management (Planned View)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {locationEntries.map((entry) => (
              <div
                key={`${entry.province}-${entry.city}`}
                className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#382619]">{entry.city}</p>
                  <span className="text-[10px] font-bold text-[#1D8348] bg-emerald-50 px-2 py-0.5 rounded">
                    Enabled
                  </span>
                </div>
                <p className="text-[11px] text-[#6F5643]">{entry.province}</p>
                <p className="text-[11px] text-[#5C432D]">{entry.areas.join(', ')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Reports */}
      {activeTab === 'reports' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Abuse &amp; Trust Reports Queue (Planned View)
          </h2>
          <div className="space-y-3 text-xs">
            {SAMPLE_BLUEPRINT_REPORTS.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-bold text-[#382619]">
                    {rep.id} · {rep.targetType.toUpperCase()} ({rep.targetId})
                  </p>
                  <p className="text-[#4A3523]">{rep.reason}</p>
                  <p className="text-[11px] text-[#6F5643]">
                    {rep.reportedBy} · {rep.createdAt}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-white border border-[#EADBC2] font-bold text-[#593B2A]">
                  {rep.state}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Platform Settings */}
      {activeTab === 'settings' && (
        <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Platform Settings Schema (Read-Only Specification)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643]">Site Title</p>
              <p className="font-bold text-[#382619] mt-1">{PLANNED_SETTINGS.siteTitle}</p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643]">Default Marketplace City</p>
              <p className="font-bold text-[#382619] mt-1">{PLANNED_SETTINGS.defaultCity}</p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643]">Display Currency</p>
              <p className="font-bold text-[#382619] mt-1">{PLANNED_SETTINGS.currencyCode} (Rs.)</p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643]">Phone Verification Policy</p>
              <p className="font-bold text-[#382619] mt-1">
                {PLANNED_SETTINGS.requirePhoneVerification ? 'Required via Backend OTP' : 'Optional'}
              </p>
            </div>
            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4">
              <p className="text-[#6F5643]">Listing Moderation Mode</p>
              <p className="font-bold text-[#382619] mt-1">{PLANNED_SETTINGS.moderationMode}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
