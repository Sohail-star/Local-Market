import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react';
import { EnquiryModal, EnquiryTarget, SubmittedEnquiryPayload } from '../components/EnquiryModals';
import { SmartImage } from '../components/SmartImage';
import { startOrFindConversation } from '../services/chatApi';
import { ServiceItem, UserAccount } from '../types/marketplace';

interface ServiceProfilePageProps {
  services: ServiceItem[];
  favoriteServiceIds: string[];
  onToggleFavoriteService: (id: string) => void;
  onContactService: (service: ServiceItem) => void;
  onRecordEnquiry?: (payload: SubmittedEnquiryPayload) => void;
  user?: UserAccount | null;
}

export const ServiceProfilePage: React.FC<ServiceProfilePageProps> = ({
  services,
  favoriteServiceIds,
  onToggleFavoriteService,
  onContactService,
  onRecordEnquiry,
  user,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [enquiryTarget, setEnquiryTarget] = useState<EnquiryTarget | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const service = services.find((s) => s.id === id);

  if (!service) {
    return (
      <div className="bg-white rounded-2xl border border-[#EADBC2] p-8 text-center">
        <h1 className="font-display text-xl font-bold text-[#382619]">
          Service Provider Not Found
        </h1>
        <p className="text-sm text-[#6F5643] mt-1">
          The service profile you requested could not be located.
        </p>
        <Link
          to="/services"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Services</span>
        </Link>
      </div>
    );
  }

  const isFav = favoriteServiceIds.includes(service.id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3.5 py-2 rounded-lg bg-white border border-[#EADBC2] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="text-xs text-[#6F5643]">
          <Link to="/" className="hover:underline">
            Home
          </Link>{' '}
          /{' '}
          <Link to="/services" className="hover:underline">
            Services
          </Link>{' '}
          / <span className="font-semibold text-[#382619]">{service.providerName}</span>
        </div>
      </div>

      {/* Provider Main Profile */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-[#EADBC2] bg-[#FFF9ED] aspect-[4/3]">
            <SmartImage
              src={service.image}
              alt={service.providerName}
              className="w-full h-full object-cover"
              icon={<Wrench className="w-8 h-8" />}
            />
            <button
              type="button"
              onClick={() => onToggleFavoriteService(service.id)}
              aria-label={isFav ? 'Remove from favorites' : 'Save service provider'}
              className={`absolute top-3.5 right-3.5 w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors ${
                isFav ? 'bg-[#D92D20] text-white' : 'bg-white text-[#593B2A] hover:text-[#D92D20]'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Working Hours & Service Areas Card */}
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CalendarClock className="w-4 h-4 text-[#593B2A] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#382619]">Working Hours</p>
                <p className="text-[#5C432D] mt-0.5">{service.workingHours}</p>
                <p className="text-[#1D8348] font-semibold mt-0.5">{service.availability}</p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#EADBC2]">
              <p className="font-bold text-[#382619] mb-1.5">Service Areas Covered</p>
              <div className="flex flex-wrap gap-1.5">
                {service.serviceAreas.map((areaName) => (
                  <span
                    key={areaName}
                    className="bg-white border border-[#EADBC2] text-[#382619] px-2.5 py-1 rounded-md text-[11px] font-medium"
                  >
                    {areaName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6F5643]">
              <span className="text-[#593B2A] font-bold">{service.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>{service.serviceGroup}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C98A09]" />
                {service.area}, {service.city}, {service.province}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
                {service.providerName}
              </h1>
              {service.providerVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1D8348] bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4" />
                  Trusted Profile (Demo)
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5C432D] tabular-nums">
              <span className="inline-flex items-center gap-1 font-bold text-[#382619]">
                <Star className="w-4 h-4 fill-[#F5B82E] text-[#F5B82E]" />
                {service.rating.toFixed(1)} ({service.reviewCount} sample reviews)
              </span>
              <span className="inline-flex items-center gap-1">
                <Award className="w-4 h-4 text-[#593B2A]" />
                {service.experienceYears} years experience (Demo)
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#C98A09]" />
                {service.responseTime}
              </span>
            </div>

            <p className="mt-4 text-sm text-[#4A3523] leading-relaxed">{service.description}</p>

            <div className="mt-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#593B2A] mb-2.5">
                Services Included
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {service.includedTasks.map((task) => (
                  <div
                    key={task}
                    className="flex items-center gap-2 bg-[#FFF9ED] border border-[#EADBC2] rounded-lg px-3 py-2 text-xs font-semibold text-[#382619]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#1D8348] shrink-0" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Starting Price + Call Now / WhatsApp / Request Service */}
          <div className="pt-4 border-t border-[#F0E3CC] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-[#6F5643]">Starting Visit / Inspection Price</p>
                <p className="font-display text-2xl font-extrabold text-[#B8320A] tabular-nums">
                  From Rs. {service.startingPrice.toLocaleString('en-PK')}
                </p>
              </div>
              <p className="text-xs font-semibold text-[#593B2A] tabular-nums flex items-center gap-1.5 bg-[#FFF9ED] px-3 py-1.5 rounded-lg border border-[#EADBC2]">
                <Phone className="w-3.5 h-3.5" />
                <span>{service.phone}</span>
              </p>
            </div>

            {chatError && (
              <p className="text-xs font-semibold text-[#B42318] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {chatError}
              </p>
            )}

            <button
              type="button"
              disabled={startingChat}
              onClick={async () => {
                setChatError(null);
                if (!user) {
                  navigate(`/login?redirect=${encodeURIComponent(`/services/${service.id}`)}`);
                  return;
                }
                setStartingChat(true);
                try {
                  const res = await startOrFindConversation({
                    sellerId: service.ownerId,
                    serviceId: service.id,
                    listingType: 'SERVICE',
                    listingRefId: service.id,
                    listingTitle: service.title,
                    listingPriceLabel: `From Rs. ${service.startingPrice.toLocaleString('en-PK')}`,
                    listingImageUrl: service.image,
                    locationLabel: `${service.area}, ${service.city}`,
                    sellerName: service.providerName,
                    sellerPhone: service.phone,
                    sellerCity: service.city,
                    sellerArea: service.area,
                    sellerProvince: service.province,
                  });
                  navigate(`/messages?chatId=${encodeURIComponent(res.conversation.id)}`);
                } catch (err) {
                  const status = (err as Error & { status?: number })?.status;
                  if (status === 401) {
                    navigate(`/login?redirect=${encodeURIComponent(`/services/${service.id}`)}`);
                    return;
                  }
                  setChatError(
                    err instanceof Error ? err.message : 'Unable to start chat with provider.'
                  );
                } finally {
                  setStartingChat(false);
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] disabled:opacity-60 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#F5B82E]" />
              <span>{startingChat ? 'Opening Chat...' : 'Chat with Provider'}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setEnquiryTarget({
                    kind: 'call',
                    targetId: service.id,
                    recipientName: service.providerName,
                    subjectTitle: `${service.categoryName} Service`,
                    phone: service.phone,
                    locationLabel: `${service.area}, ${service.city}`,
                  })
                }
                className="py-3 px-4 rounded-xl bg-[#FFF9ED] border border-[#D8C5A5] hover:bg-[#FFF2D6] text-[#382619] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#593B2A]" />
                <span>Call Now</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEnquiryTarget({
                    kind: 'whatsapp',
                    targetId: service.id,
                    recipientName: service.providerName,
                    subjectTitle: `${service.categoryName} Service`,
                    phone: service.phone,
                    locationLabel: `${service.area}, ${service.city}`,
                  })
                }
                className="py-3 px-4 rounded-xl bg-[#1D8348] hover:bg-[#166838] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => onContactService(service)}
                className="py-3 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4" />
                <span>Request Service</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Ratings & Reviews Section */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#382619]">
            Customer Ratings &amp; Reviews (Sample Data)
          </h2>
          <span className="text-xs font-semibold text-[#5C432D] tabular-nums">
            {service.rating.toFixed(1)} / 5.0 · {service.reviewCount} demo reviews
          </span>
        </div>

        {service.sampleReviews.length === 0 ? (
          <p className="text-xs text-[#6F5643]">No sample reviews added for this demo listing yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {service.sampleReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#382619]">{rev.author}</p>
                    <p className="text-[11px] text-[#6F5643]">
                      {rev.area} · {rev.date}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#382619] bg-white border border-[#EADBC2] px-2 py-0.5 rounded-md tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-[#F5B82E] text-[#F5B82E]" />
                    {rev.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-[#4A3523] leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <EnquiryModal
        target={enquiryTarget}
        onClose={() => setEnquiryTarget(null)}
        onRecordEnquiry={onRecordEnquiry}
      />
    </div>
  );
};
