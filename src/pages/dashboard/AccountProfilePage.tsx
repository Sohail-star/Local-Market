import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  UserCog,
} from 'lucide-react';
import { LocationSelector } from '../../components/LocationSelector';
import { UserAvatar } from '../../components/UserAvatar';
import { ProvinceName, getProvinceForCity } from '../../data/locations';
import { CITY_NEIGHBORHOODS } from '../../data/marketplaceData';
import { ADMIN_READY_MODULES } from '../../types/admin';
import { CityName, UserAccount, UserCapabilities } from '../../types/marketplace';

interface AccountProfilePageProps {
  user: UserAccount;
  onUpdateProfile: (updated: UserAccount) => void;
  onToggleCapability: (cap: keyof UserCapabilities) => void;
  onNotifyToast: (msg: string) => void;
}

export const AccountProfilePage: React.FC<AccountProfilePageProps> = ({
  user,
  onUpdateProfile,
  onToggleCapability,
  onNotifyToast,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [province, setProvince] = useState<ProvinceName>(
    (user.province as ProvinceName) || getProvinceForCity(user.city)
  );
  const [city, setCity] = useState<CityName>(user.city);
  const [area, setArea] = useState<string>(user.area);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password Demo State (never persisted)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setProfileError('Profile photo must be a valid image under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setProfileError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setProfileError('Full Name, Email, and Phone are required.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^(?:92|0)?3\d{9}$/.test(phoneDigits)) {
      setProfileError(
        'Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or +92 300 1234567).'
      );
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

    setProfileError(null);
    onUpdateProfile({
      ...user,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      province: resolvedProvince,
      city: resolvedCity,
      area: resolvedArea,
      avatarUrl: avatarUrl || undefined,
    });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 6) {
      setPasswordStatus({
        kind: 'error',
        text: 'Enter your current password and a new password of at least 6 characters.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({
        kind: 'error',
        text: 'New Password and Confirm Password do not match.',
      });
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordStatus({
      kind: 'success',
      text: 'Password change preview validated. Real password hashing & rotation require backend auth.',
    });
    onNotifyToast('Password change validated (frontend demo)');
  };

  const capabilityItems: {
    key: keyof UserCapabilities;
    title: string;
    desc: string;
  }[] = [
    { key: 'buy', title: 'Buy Products', desc: 'Place orders and message local merchants' },
    { key: 'sell', title: 'Sell Products', desc: 'Enable Seller Dashboard & product listings' },
    {
      key: 'offerServices',
      title: 'Offer Services',
      desc: 'Enable Service Provider Dashboard & job bookings',
    },
    {
      key: 'hireProviders',
      title: 'Hire Service Providers',
      desc: 'Request visits and manage service bookings',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Edit Profile Card */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0E3CC] pb-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#382619] flex items-center gap-2">
              <UserCog className="w-6 h-6 text-[#C98A09]" />
              <span>Account Profile &amp; Settings</span>
            </h1>
            <p className="text-xs text-[#6F5643] mt-0.5">
              Update your photo, contact details, Pakistan location, and account capabilities.
            </p>
          </div>
          {profileSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D8348] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile Saved</span>
            </span>
          )}
        </div>

        {profileError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#B42318]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Profile Photo */}
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar name={name || user.name} avatarUrl={avatarUrl} size="xl" />
              <div>
                <p className="text-xs font-bold text-[#382619]">Profile Photo</p>
                <p className="text-[11px] text-[#6F5643] mt-0.5">
                  Member since {user.memberSince} · Displayed across seller and provider cards.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="px-3.5 py-2 rounded-lg border border-[#D8C5A5] bg-white hover:bg-[#FFF2D6] text-xs font-bold text-[#382619] inline-flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-[#593B2A]" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="sr-only"
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-[#B42318] hover:bg-red-50 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#593B2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#593B2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#382619] mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#593B2A]"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 space-y-2">
            <p className="text-xs font-bold text-[#382619]">City &amp; Neighborhood Area</p>
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

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </section>

      {/* Account Capabilities */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 space-y-3.5">
        <div>
          <h2 className="font-display text-lg font-bold text-[#382619]">
            Account Capabilities
          </h2>
          <p className="text-xs text-[#6F5643]">
            Toggle which dashboards and activities are active on this single account.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {capabilityItems.map((cap) => {
            const active = user.capabilities[cap.key];
            return (
              <button
                key={cap.key}
                type="button"
                onClick={() => onToggleCapability(cap.key)}
                aria-pressed={active}
                className={`text-left rounded-xl border p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  active ? 'bg-[#FFF4D6] border-[#593B2A]' : 'bg-white border-[#EADBC2]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#382619]">{cap.title}</p>
                  <p className="text-[11px] text-[#6F5643] mt-0.5">{cap.desc}</p>
                </div>
                <span
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-[#593B2A] border-[#593B2A] text-[#F5B82E]'
                      : 'bg-white border-[#D8C5A5]'
                  }`}
                >
                  {active && <Check className="w-4 h-4 stroke-[3]" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Change Password Demo */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#382619] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#593B2A]" />
              <span>Change Password (Frontend Demo)</span>
            </h2>
            <p className="text-xs text-[#6F5643]">
              Validates password matching locally without storing passwords in browser storage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((s) => !s)}
            className="px-3 py-1.5 rounded-lg border border-[#D8C5A5] text-xs font-bold text-[#593B2A] inline-flex items-center gap-1 cursor-pointer"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPasswords ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {passwordStatus && (
          <div
            className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
              passwordStatus.kind === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-[#1D8348]'
                : 'bg-red-50 border-red-200 text-[#B42318]'
            }`}
          >
            {passwordStatus.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
          />
          <input
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            className="rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
          />
          <input
            type={showPasswords ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Confirm new password"
            className="rounded-xl border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none"
          />
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-extrabold cursor-pointer"
            >
              Update Password (Demo)
            </button>
          </div>
        </form>
      </section>

      {/* Admin-Ready Architecture Note */}
      <section className="bg-[#FFF9ED] rounded-2xl border border-[#EADBC2] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#593B2A]">
            <ShieldAlert className="w-4 h-4 text-[#C98A09]" />
            <span>Future Backend Admin Architecture Prepared</span>
          </div>
          <p className="text-xs text-[#5C432D] leading-relaxed max-w-2xl">
            Domain contracts for {ADMIN_READY_MODULES.length} future admin modules (Users, Products,
            Services, Categories, Locations, Reports, Listings, and Settings) are prepared in
            TypeScript and intentionally withheld from client-side permission toggles until
            server-side authorization is implemented.
          </p>
        </div>
        <Link
          to="/admin-blueprint"
          className="px-4 py-2 rounded-xl border border-[#D8C5A5] bg-white hover:bg-[#FFF4D6] text-xs font-bold text-[#593B2A] inline-flex items-center gap-1.5 shrink-0"
        >
          <span>View Admin UI Blueprint</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  );
};
