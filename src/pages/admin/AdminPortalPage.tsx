import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
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

const INITIAL_SUPER_ADMIN_EMAIL = 'sohailsk7882261@gmail.com';

type AdminTab = 'accounts' | 'users' | 'reports' | 'audit';

async function adminApiFetch<T>(url: string, options?: RequestInit): Promise<T> {
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
  const [reports, setReports] = useState<AbuseReportItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);

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
    if (
      !admin.roles.includes('SUPER_ADMIN') &&
      !admin.roles.includes('ADMIN')
    ) {
      setActiveTab(admin.roles.includes('SUPPORT') ? 'users' : 'reports');
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

  const isSuperAdmin = Boolean(admin?.roles.includes('SUPER_ADMIN'));
  const canViewAdminAccounts = Boolean(
    admin?.roles.includes('SUPER_ADMIN') || admin?.roles.includes('ADMIN')
  );
  const canViewUsers = Boolean(
    admin?.roles.includes('SUPER_ADMIN') ||
      admin?.roles.includes('ADMIN') ||
      admin?.roles.includes('SUPPORT')
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

      {feedback && (
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
