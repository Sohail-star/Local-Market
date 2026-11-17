import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  Mail,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { DEMO_USER_ACCOUNT } from '../data/dashboardSeed';
import { getProvinceForCity } from '../data/locations';
import { CITY_NEIGHBORHOODS } from '../data/marketplaceData';
import { CityName, UserAccount } from '../types/marketplace';

interface LoginPageProps {
  defaultCity: CityName;
  onAuthenticate: (account: UserAccount, rememberMe: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ defaultCity, onAuthenticate }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError('Please enter your email address or mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    window.setTimeout(() => {
      const fallbackCity: Exclude<CityName, 'All Cities'> =
        defaultCity === 'All Cities' ? 'Peshawar' : defaultCity;
      const areas = CITY_NEIGHBORHOODS[fallbackCity] || ['University Road'];
      const isPhone = /^[0-9+\-\s]{7,}$/.test(trimmedId);
      const inferredName = isPhone
        ? 'LocalMarket Member'
        : trimmedId
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (ch) => ch.toUpperCase()) || 'LocalMarket Member';

      const account: UserAccount =
        trimmedId.toLowerCase() === DEMO_USER_ACCOUNT.email
          ? DEMO_USER_ACCOUNT
          : {
              id: `usr-${Date.now()}`,
              name: inferredName,
              email: isPhone ? 'member@localmarket.pk' : trimmedId,
              phone: isPhone ? trimmedId : '0300-9123456',
              province: getProvinceForCity(fallbackCity),
              city: fallbackCity,
              area: areas[0],
              capabilities: {
                buy: true,
                sell: true,
                offerServices: true,
                hireProviders: true,
              },
              role: 'Buyer',
              memberSince: 'Nov 2026',
            };

      onAuthenticate(account, rememberMe);
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 240);
  };

  const handleDemoSignIn = () => {
    onAuthenticate(DEMO_USER_ACCOUNT, true);
    navigate('/dashboard');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget.trim()) return;
    setResetSent(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="bg-white rounded-2xl border border-[#EADBC2] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Visual & Multi-Capability Context Panel */}
        <div className="lg:col-span-5 bg-[#593B2A] text-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#F5B82E]">
              <ShoppingBag className="w-4 h-4" />
              <span>LocalMarket Pakistan</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
              One Account for Buying, Selling &amp; Services
            </h1>
            <p className="text-xs sm:text-sm text-[#E9D8BA] leading-relaxed">
              Sign in once to shop local products, manage your own store listings, offer skilled
              services, and track booking requests from a unified dashboard.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-[#F7EAD2]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F5B82E] shrink-0 mt-0.5" />
                <span>Customer Hub: Favorites, orders, enquiries &amp; service requests</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F5B82E] shrink-0 mt-0.5" />
                <span>Seller Studio: Add, edit, pause or remove product listings</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#F5B82E] shrink-0 mt-0.5" />
                <span>Provider Hub: Accept or reject service booking requests</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-black/20 border border-white/10 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F5B82E]">
              <Sparkles className="w-4 h-4" />
              <span>Quick Frontend Demo Account</span>
            </div>
            <p className="text-[11px] text-[#E9D8BA] leading-relaxed">
              Test all Customer, Seller, and Service Provider dashboards immediately using our
              pre-seeded Peshawar demo account ({DEMO_USER_ACCOUNT.name}).
            </p>
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Sign In with Demo Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-5">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-[#382619]">
                Sign In to Your Account
              </h2>
              <p className="text-xs sm:text-sm text-[#6F5643] mt-1">
                Enter your email or Pakistani mobile number and password.
              </p>
            </div>

            <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] px-3.5 py-2.5 flex items-start gap-2.5 text-[11px] text-[#5C432D]">
              <Info className="w-4 h-4 text-[#593B2A] shrink-0 mt-0.5" />
              <span>
                Frontend preview authentication: passwords are validated locally and never stored in{' '}
                <code className="font-mono">localStorage</code>. Real auth connects in the backend
                phase.
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#B42318]"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-bold text-[#382619] mb-1.5"
                >
                  Email or Phone Number *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6F5643] absolute left-3 top-3" />
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. hamza.afridi@example.pk or 0300-9123456"
                    className="w-full rounded-xl border border-[#D8C5A5] pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#593B2A]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-[#382619] mb-1.5"
                >
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6F5643] absolute left-3 top-3" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min. 6 characters)"
                    className="w-full rounded-xl border border-[#D8C5A5] pl-10 pr-11 py-2.5 text-sm focus:outline-none focus:border-[#593B2A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-2 p-1.5 rounded-lg text-[#6F5643] hover:text-[#382619] hover:bg-[#FFF9ED] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[#382619] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#593B2A] rounded"
                  />
                  <span>Remember me on this browser</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen((o) => !o);
                    setResetSent(false);
                  }}
                  className="font-bold text-[#593B2A] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Login to Dashboard'}</span>
                <ArrowRight className="w-4 h-4 text-[#F5B82E]" />
              </button>
            </form>

            {/* Forgot Password Demo Drawer */}
            {forgotOpen && (
              <div className="rounded-xl border border-[#EADBC2] bg-[#FFF9ED] p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#382619]">
                  <KeyRound className="w-4 h-4 text-[#593B2A]" />
                  <span>Reset Password (Frontend Preview)</span>
                </div>
                {resetSent ? (
                  <p className="text-xs text-[#1D8348] font-semibold">
                    Demo reset instructions previewed for &ldquo;{resetTarget}&rdquo;. Real email/OTP
                    delivery requires backend integration.
                  </p>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={resetTarget}
                      onChange={(e) => setResetTarget(e.target.value)}
                      placeholder="Enter registered email or phone"
                      className="flex-1 rounded-lg border border-[#D8C5A5] bg-white px-3 py-2 text-xs focus:outline-none focus:border-[#593B2A]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      Send Reset Link
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-[#F0E3CC] text-center text-xs text-[#6F5643]">
              New to LocalMarket?{' '}
              <Link to="/signup" className="font-bold text-[#593B2A] hover:underline">
                Create an Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
