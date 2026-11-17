import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Loader2, MapPin, ShieldCheck, Star, Wrench, X } from 'lucide-react';
import { CITY_NEIGHBORHOODS } from '../data/marketplaceData';
import { ServiceBooking, ServiceItem } from '../types/marketplace';
import { SmartImage } from './SmartImage';

interface ServiceBookingModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onConfirmBooking: (booking: ServiceBooking) => void;
}

const TIME_SLOTS = [
  '10:00 AM - 12:00 PM',
  '12:30 PM - 2:30 PM',
  '3:00 PM - 5:00 PM',
  '5:30 PM - 7:30 PM',
];

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  service,
  onClose,
  onConfirmBooking,
}) => {
  const [neighborhood, setNeighborhood] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<ServiceBooking | null>(null);

  useEffect(() => {
    if (service) {
      setConfirmedBooking(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [service]);

  if (!service) return null;

  const areas = CITY_NEIGHBORHOODS[service.city] || ['Main City Center'];
  const selectedArea = neighborhood || areas[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid Pakistani mobile number.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    window.setTimeout(() => {
      const booking: ServiceBooking = {
        id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceId: service.id,
        serviceTitle: service.title,
        providerName: service.providerName,
        startingPrice: service.startingPrice,
        city: service.city,
        neighborhood: selectedArea,
        date,
        timeSlot,
        customerName: customerName.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        status: 'Pending',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onConfirmBooking(booking);
      setIsSubmitting(false);
      setConfirmedBooking(booking);
    }, 220);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Book ${service.title}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC2]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-5 py-3.5 border-b border-[#F0E3CC] flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#C98A09]" />
            <span className="font-display font-bold text-base text-[#2B1609]">
              Book {service.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#FFF5DC] flex items-center justify-center text-[#3A1F0D] cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedBooking ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#1D8348] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-extrabold text-[#2B1609]">
              Service Request Sent ({confirmedBooking.id})
            </h3>
            <p className="mt-1.5 text-sm text-[#5C432D]">
              <strong>{confirmedBooking.providerName}</strong> has received your request (Status:{' '}
              <strong>Pending</strong>) for <strong>{confirmedBooking.serviceTitle}</strong>.
            </p>

            <div className="mt-5 rounded-xl bg-[#FFF8EA] border border-[#EADBC2] p-4 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-[#70553E]">Location:</span>
                <span className="font-semibold text-[#2B1609]">
                  {confirmedBooking.neighborhood}, {confirmedBooking.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#70553E]">Schedule:</span>
                <span className="font-semibold text-[#2B1609] tabular-nums">
                  {confirmedBooking.date} · {confirmedBooking.timeSlot}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#70553E]">Visit / Inspection Rate:</span>
                <span className="font-bold text-[#B8320A] tabular-nums">
                  From Rs. {confirmedBooking.startingPrice.toLocaleString('en-PK')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-lg bg-[#3A1F0D] hover:bg-[#2B1609] text-white text-sm font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Provider Overview */}
            <div className="flex flex-col sm:flex-row gap-4 bg-[#FFF8EA] border border-[#EADBC2] rounded-xl p-3.5">
              <div className="w-full sm:w-36 h-28 rounded-lg overflow-hidden shrink-0">
                <SmartImage
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base text-[#2B1609]">{service.providerName}</h3>
                  {service.providerVerified && (
                    <ShieldCheck className="w-4 h-4 text-[#1D8348] shrink-0" />
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5C432D] tabular-nums">
                  <span className="inline-flex items-center gap-1 font-bold text-[#2B1609]">
                    <Star className="w-3.5 h-3.5 fill-[#F5B727] text-[#F5B727]" />
                    {service.rating.toFixed(1)} ({service.reviewCount})
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C98A09]" />
                    {service.responseTime}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-[#B8320A]">
                    From Rs. {service.startingPrice.toLocaleString('en-PK')}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#4A3523] leading-relaxed">{service.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {service.includedTasks.map((task) => (
                    <span
                      key={task}
                      className="text-[11px] font-medium text-[#3A1F0D] bg-white border border-[#EADBC2] px-2 py-0.5 rounded-md"
                    >
                      {task}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-[#B42318]">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#2B1609] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tariq Khan"
                    className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#3A1F0D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B1609] mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#3A1F0D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B1609] mb-1">
                    Neighborhood in {service.city}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#70553E] absolute left-3 top-2.5" />
                    <select
                      value={selectedArea}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full rounded-lg border border-[#D8C5A5] pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[#3A1F0D]"
                    >
                      {areas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B1609] mb-1">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#70553E] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-[#D8C5A5] pl-9 pr-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#3A1F0D]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1609] mb-1.5">
                  Select Time Slot
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`py-2 px-2 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        timeSlot === slot
                          ? 'bg-[#F5B727] border-[#D99B10] text-[#2B1609]'
                          : 'bg-[#FFFDF9] border-[#E5D5BA] text-[#5C432D] hover:bg-[#FFF5DC]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1609] mb-1">
                  Describe the job or issue
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share brief details so the technician brings the right tools..."
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#3A1F0D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-[#D8C5A5] text-sm font-semibold text-[#3A1F0D] hover:bg-[#FFF8EA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-[#3A1F0D] hover:bg-[#2B1609] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Submitting Request...' : 'Confirm Service Booking'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
