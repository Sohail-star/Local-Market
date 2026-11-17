import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CheckCheck,
  ChevronDown,
  HelpCircle,
  MapPin,
  PhoneCall,
  Wrench,
} from 'lucide-react';
import { CITIES } from '../data/marketplaceData';
import { CityName, NotificationItem } from '../types/marketplace';

interface TopUtilityBarProps {
  selectedCity: CityName;
  onSelectCity: (city: CityName) => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onOpenHelp: () => void;
  onOpenContact: () => void;
  onOpenProviderModal: () => void;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({
  selectedCity,
  onSelectCity,
  notifications,
  onMarkAllRead,
  onOpenHelp,
  onOpenContact,
  onOpenProviderModal,
}) => {
  const [cityOpen, setCityOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const cityRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  return (
    <div className="bg-[#2B1609] text-[#F7EAD2] text-xs border-b border-[#4A2913] relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-4">
        {/* Left: City selector + date/time */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="relative" ref={cityRef}>
            <button
              type="button"
              onClick={() => setCityOpen((o) => !o)}
              className="flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-md hover:bg-white/10 transition-colors font-medium whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F5B727]"
              aria-expanded={cityOpen}
              aria-label="Select city"
            >
              <MapPin className="w-3.5 h-3.5 text-[#F5B727]" />
              <span>{selectedCity}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            </button>

            {cityOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white text-[#2B1609] rounded-xl shadow-xl border border-[#EADBC2] py-1.5 z-50">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      onSelectCity(city);
                      setCityOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-[#FFF8EA] transition-colors cursor-pointer ${
                      selectedCity === city ? 'bg-[#FFF5DC] text-[#3A1F0D] font-semibold' : ''
                    }`}
                  >
                    <span>{city}</span>
                    {selectedCity === city && (
                      <span className="text-[10px] font-semibold text-[#C98A09]">Active</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="hidden sm:inline-block h-3.5 w-px bg-white/20" aria-hidden="true" />

          <div className="hidden sm:flex items-center gap-1.5 text-[#DFC9A6] whitespace-nowrap tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-[#F5B727]/90" />
            <span>
              {formattedDate} · {formattedTime}
            </span>
          </div>
        </div>

        {/* Right: Notifications, Help, Contact, Provider CTA */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F5B727]"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="w-4 h-4 text-[#F7EAD2]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D92D20] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white text-[#2B1609] rounded-xl shadow-2xl border border-[#EADBC2] overflow-hidden z-50">
                <div className="px-4 py-3 bg-[#FFF8EA] border-b border-[#EADBC2] flex items-center justify-between">
                  <span className="font-semibold text-sm">Marketplace Updates</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-xs font-medium text-[#8C5319] hover:text-[#3A1F0D] flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#F3E9D7] max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 text-xs ${n.read ? 'bg-white' : 'bg-[#FFFDF7]'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-[#2B1609]">{n.title}</span>
                        <span className="text-[11px] text-[#8B735B] whitespace-nowrap">{n.time}</span>
                      </div>
                      <p className="text-[#5C432D] leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 bg-[#FFF8EA] border-t border-[#EADBC2] text-center">
                  <Link
                    to="/dashboard/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-bold text-[#593B2A] hover:underline"
                  >
                    Open Notifications Center →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenHelp}
            className="hidden md:flex items-center gap-1 py-1 px-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#F5B727]" />
            <span>Help</span>
          </button>

          <span className="hidden md:inline-block h-3.5 w-px bg-white/20" aria-hidden="true" />

          <button
            type="button"
            onClick={onOpenContact}
            className="hidden sm:flex items-center gap-1 py-1 px-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#F5B727]" />
            <span>Contact</span>
          </button>

          <button
            type="button"
            onClick={onOpenProviderModal}
            className="bg-[#F5B727] hover:bg-[#E5A617] text-[#2B1609] font-semibold px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Become a Service Provider</span>
            <span className="xs:hidden">Join as Pro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
