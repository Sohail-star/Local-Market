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

type AdminRoleCode = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';

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
  phone: string;
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
  phone: string;
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
  phone: string;
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

type AdminTab = 'accounts' | 'users' | 'reports' | 'audit';

async function adminApiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
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
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupToken, setSetupToken] = useState('');
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
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

      try {
        const me = await adminApiFetch<{ admin: AdminAccountProfile }>('/api/admin/auth/me');
        setAdmin(me.admin);
      } catch {
        setAdmin(null);
      }
    } catch (err) {
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
      await adminApiFetch('/api/admin/auth/setup', {
        method: 'POST',
        body: JSON.stringify({
          setupToken,
          fullName: setupName,
          email: setupEmail,
          phone: setupPhone,
          password: setupPassword,
        }),
      });
      setSetupToken('');
      setSetupPassword('');
      setShowSetupForm(false);
      setLoginEmail(setupEmail);
      setFeedback({
        type: 'success',
        text: 'Initial SUPER_ADMIN created. One-time setup is now permanently locked. Please sign in below.',
      });
      await loadBootstrapState();
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

      <section className="bg-[#593B2A] text-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
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
              onClick={() => void loadAuthorizedData(admin)}
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

          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EADBC2] p-6 space-y-4 shadow-xs">
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
                  <strong>Super Admin Provisioned:</strong>{' '}
                  {setupStatus.superAdminExists ? 'Yes (One-time setup locked)' : 'No'}
                </div>
                <div>
                  <strong>One-Time Setup Available:</strong>{' '}
                  {setupStatus.oneTimeSetupAvailable ? 'Yes (Token configured)' : 'No'}
                </div>
              </div>
            )}

            {setupStatus?.oneTimeSetupAvailable && (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSetupForm((prev) => !prev)}
                  className="w-full py-2 px-3 rounded-xl border border-[#593B2A] text-[#593B2A] text-xs font-bold hover:bg-[#FFF9ED]"
                >
                  {showSetupForm
                    ? 'Hide One-Time Super Admin Setup'
                    : 'Run Protected One-Time Super Admin Setup'}
                </button>

                {showSetupForm && (
                  <form onSubmit={handleOneTimeSetup} className="space-y-2.5 pt-2 border-t border-[#EADBC2]">
                    <input
                      type="password"
                      required
                      value={setupToken}
                      onChange={(e) => setSetupToken(e.target.value)}
                      placeholder="Server ADMIN_SETUP_TOKEN"
                      className="w-full px-3 py-2 rounded-lg border border-[#EADBC2] text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 rounded-lg border border-[#EADBC2] text-xs"
                    />
                    <input
                      type="email"
                      required
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      placeholder="Super Admin Email"
                      className="w-full px-3 py-2 rounded-lg border border-[#EADBC2] text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={setupPhone}
                      onChange={(e) => setSetupPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3 py-2 rounded-lg border border-[#EADBC2] text-xs"
                    />
                    <input
                      type="password"
                      required
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Strong password (12+ chars, Aa1!)"
                      className="w-full px-3 py-2 rounded-lg border border-[#EADBC2] text-xs"
                    />
                    <button
                      type="submit"
                      disabled={submittingSetup}
                      className="w-full py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold hover:bg-[#462E20]"
                    >
                      {submittingSetup ? 'Provisioning...' : 'Create Initial SUPER_ADMIN'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Authenticated Admin Summary */}
          <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#6E5644]">Authenticated Administrator</div>
              <div className="text-lg font-extrabold text-[#593B2A]">{admin.fullName}</div>
              <div className="text-xs text-[#6E5644]">
                {admin.email} · {admin.city}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {admin.roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 rounded-lg bg-[#FFF9ED] border border-[#F5B82E] text-xs font-bold text-[#593B2A]"
                >
                  {role}
                </span>
              ))}
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
