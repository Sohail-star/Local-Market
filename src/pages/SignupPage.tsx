import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import { LocationSelector } from '../components/LocationSelector';
import { UserAvatar } from '../components/UserAvatar';
import { ProvinceName, getProvinceForCity } from '../data/locations';
import { CITY_NEIGHBORHOODS } from '../data/marketplaceData';
import { CityName, UserAccount, UserCapabilities } from '../types/marketplace';

interface SignupPageProps {
  defaultCity: CityName;
  onAuthenticate: (account: UserAccount, rememberMe: boolean) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ defaultCity, onAuthenticate }) => {
  const navigate = useNavigate();
  const initialCity: Exclude<CityName, 'All Cities'> =
    defaultCity === 'All Cities' ? 'Peshawar' : defaultCity;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [province, setProvince] = useState<ProvinceName>(() => getProvinceForCity(initialCity));
  const [city, setCity] = useState<CityName>(initialCity);
  const [area, setArea] = useState<string>(
    (CITY_NEIGHBORHOODS[initialCity] || ['University Road'])[0]
  );

  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [capabilities, setCapabilities] = useState<UserCapabilities>({
    buy: true,
    sell: false,
    offerServices: false,
    hireProviders: true,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleCapability = (key: keyof UserCapabilities) => {
    setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    const isValidPkPhone = /^(?:92|0)?3\d{9}$/.test(phoneDigits);
    if (!isValidPkPhone) {
      setError('Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or +92 300 1234567).');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    if (
      !capabilities.buy &&
      !capabilities.sell &&
      !capabilities.offerServices &&
      !capabilities.hireProviders
    ) {
      setError('Select at least one marketplace capability for your account.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms and Conditions to create your account.');
      return;
    }

    setError(null);
    const resolvedCity: Exclude<CityName, 'All Cities'> =
      city === 'All Cities' ? 'Peshawar' : city;
    const resolvedArea =
      area === 'All Areas'
        ? (CITY_NEIGHBORHOODS[resolvedCity] || ['City Center'])[0]
        : area;
    const resolvedProvince =
      province === 'All Provinces' ? getProvinceForCity(resolvedCity) : province;

    const primaryRole: UserAccount['role'] = capabilities.offerServices
      ? 'Service Provider'
      : capabilities.sell
      ? 'Seller'
      : 'Buyer';

    const newAccount: UserAccount = {
      id: `usr-${Date.now()}`,
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      province: resolvedProvince,
      city: resolvedCity,
      area: resolvedArea,
      avatarUrl: avatarPreview || undefined,
      capabilities,
      role: primaryRole,
      memberSince: 'Nov 2026',
    };

    onAuthenticate(newAccount, true);
    navigate('/dashboard');
  };

  const capabilityCards: {
    key: keyof UserCapabilities;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'buy',
      title: 'Buy Products',
      desc: 'Shop electronics, mobiles, furniture & local deals',
      icon: <ShoppingCart className="w-4 h-4 text-[#593B2A]" />,
    },
    {
      key: 'sell',
      title: 'Sell Products',
      desc: 'List new or used products & manage buyer enquiries',
      icon: <Store className="w-4 h-4 text-[#593B2A]" />,
    },
    {
      key: 'offerServices',
      title: 'Offer Services',
      desc: 'Accept bookings as a mechanic, electrician, tailor, etc.',
      icon: <Wrench className="w-4 h-4 text-[#593B2A]" />,
    },
    {
      key: 'hireProviders',
      title: 'Hire Service Providers',
      desc: 'Book trusted local technicians & track service requests',
      icon: <Users className="w-4 h-4 text-[#593B2A]" />,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="bg-white rounded-2xl border border-[#EADBC2] shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0E3CC] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#593B2A] mb-1">
              <ShoppingBag className="w-4 h-4 text-[#F5B82E]" />
              <span>Unified Multi-Capability Registration</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
              Create Your LocalMarket Account
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5643] mt-1">
              One account lets you buy, sell, offer services, and hire professionals — switch or
              enable capabilities anytime.
            </p>
          </div>
          <div className="text-xs text-[#6F5643]">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-[#593B2A] hover:underline">
              Login here
            </Link>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-xs font-semibold text-[#B42318]"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Optional Profile Image */}
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={fullName || 'Local Member'} avatarUrl={avatarPreview} size="lg" />
              <div>
                <p className="text-xs font-bold text-[#382619]">Profile Photo (Optional)</p>
                <p className="text-[11px] text-[#6F5643] mt-0.5">
                  Shown on your buyer, seller, and provider profile. Max 2 MB image preview.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="px-3.5 py-2 rounded-lg bg-white border border-[#D8C5A5] hover:border-[#593B2A] text-xs font-bold text-[#382619] inline-flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-[#593B2A]" />
                <span>{avatarPreview ? 'Change Photo' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="sr-only"
                />
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview('')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-[#B42318] hover:bg-red-50 cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Core Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="signup-name"
                className="block text-xs font-bold text-[#382619] mb-1.5"
              >
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6F5643] absolute left-3 top-3" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Hamza Afridi"
                  className="w-full rounded-xl border border-[#D8C5A5] pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#593B2A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-bold text-[#382619] mb-1.5"
              >
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6F5643] absolute left-3 top-3" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.pk"
                  className="w-full rounded-xl border border-[#D8C5A5] pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#593B2A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-phone"
                className="block text-xs font-bold text-[#382619] mb-1.5"
              >
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6F5643] absolute left-3 top-3" />
                <input
                  id="signup-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full rounded-xl border border-[#D8C5A5] pl-10 pr-3 py-2.5 text-sm tabular-nums focus:outline-none focus:border-[#593B2A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-bold text-[#382619] mb-1.5"
              >
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F5643] absolute left-3 top-3" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-[#D8C5A5] pl-10 pr-11 py-2.5 text-sm focus:outline-none focus:border-[#593B2A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-2 p-1.5 rounded-lg text-[#6F5643] hover:bg-[#FFF9ED] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-bold text-[#382619] mb-1.5"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6F5643] absolute left-3 top-3" />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-[#D8C5A5] pl-10 pr-11 py-2.5 text-sm focus:outline-none focus:border-[#593B2A]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2.5 top-2 p-1.5 rounded-lg text-[#6F5643] hover:bg-[#FFF9ED] cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Location Selection */}
          <div className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 space-y-2">
            <p className="text-xs font-bold text-[#382619]">Your Location in Pakistan</p>
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

          {/* Multiple Account Capabilities */}
          <div className="space-y-2.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#593B2A]">
                Select Account Capabilities (Enable One or All)
              </h2>
              <p className="text-xs text-[#6F5643] mt-0.5">
                You do not need separate accounts—check everything you plan to do on LocalMarket.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {capabilityCards.map((cap) => {
                const active = capabilities[cap.key];
                return (
                  <button
                    key={cap.key}
                    type="button"
                    onClick={() => toggleCapability(cap.key)}
                    aria-pressed={active}
                    className={`text-left rounded-xl border p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      active
                        ? 'border-[#593B2A] bg-[#FFF4D6]'
                        : 'border-[#EADBC2] bg-white hover:bg-[#FFF9ED]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#EADBC2] flex items-center justify-center shrink-0 mt-0.5">
                        {cap.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#382619]">{cap.title}</p>
                        <p className="text-[11px] text-[#6F5643] mt-0.5 leading-snug">{cap.desc}</p>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        active
                          ? 'bg-[#593B2A] border-[#593B2A] text-[#F5B82E]'
                          : 'bg-white border-[#D8C5A5]'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#F0E3CC]">
            <label className="inline-flex items-start gap-2.5 text-xs text-[#382619] cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 accent-[#593B2A] rounded mt-0.5"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="font-bold text-[#593B2A] underline">
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-bold text-[#593B2A] underline">
                  Privacy Policy
                </Link>{' '}
                (Frontend Demo).
              </span>
            </label>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-sm font-extrabold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
