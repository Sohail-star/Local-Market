import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  X,
} from 'lucide-react';

export interface EnquiryTarget {
  kind: 'seller' | 'whatsapp' | 'call';
  targetId?: string;
  recipientName: string;
  subjectTitle: string;
  phone: string;
  locationLabel: string;
}

export interface SubmittedEnquiryPayload {
  target: EnquiryTarget;
  senderName: string;
  senderPhone: string;
  message: string;
}

interface EnquiryModalProps {
  target: EnquiryTarget | null;
  onClose: () => void;
  onRecordEnquiry?: (payload: SubmittedEnquiryPayload) => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  target,
  onClose,
  onRecordEnquiry,
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setMessage(
        `Assalam-o-Alaikum ${target.recipientName}, I saw "${target.subjectTitle}" (${target.locationLabel}) on LocalMarket and would like more details.`
      );
      setSubmitted(false);
      setIsSubmitting(false);
      setError(null);
      setCopied(false);
    }
  }, [target]);

  if (!target) return null;

  const handleClose = () => {
    setSubmitted(false);
    setIsSubmitting(false);
    setError(null);
    setCopied(false);
    onClose();
  };

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(target.phone).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (senderPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10–11 digit Pakistani mobile number.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    window.setTimeout(() => {
      onRecordEnquiry?.({
        target,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        message: message.trim(),
      });
      setIsSubmitting(false);
      setSubmitted(true);
    }, 220);
  };

  const titleByKind =
    target.kind === 'whatsapp'
      ? 'WhatsApp Quick Enquiry (Demo)'
      : target.kind === 'call'
      ? 'Call Provider / Request Callback'
      : 'Contact Seller / Product Enquiry';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titleByKind}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#EADBC2] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between ${
            target.kind === 'whatsapp'
              ? 'bg-[#1D8348] text-white'
              : 'bg-[#593B2A] text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {target.kind === 'whatsapp' ? (
              <MessageCircle className="w-5 h-5" />
            ) : target.kind === 'call' ? (
              <Phone className="w-5 h-5 text-[#F5B82E]" />
            ) : (
              <MessageSquare className="w-5 h-5 text-[#F5B82E]" />
            )}
            <h2 className="font-display text-base sm:text-lg font-bold">{titleByKind}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Recipient Info Strip */}
          <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-3.5 mb-4">
            <p className="text-xs font-bold text-[#382619]">{target.recipientName}</p>
            <p className="text-[11px] text-[#6F5643] mt-0.5">
              {target.subjectTitle} · {target.locationLabel}
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2 bg-white border border-[#EADBC2] rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-[#593B2A] tabular-nums">{target.phone}</span>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="text-[11px] font-bold text-[#593B2A] hover:text-[#382619] inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#1D8348]" />
                    <span className="text-[#1D8348]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {submitted ? (
            <div className="py-4 text-center space-y-2">
              <CheckCircle2 className="w-11 h-11 text-[#1D8348] mx-auto" />
              <h3 className="font-display text-lg font-bold text-[#382619]">
                {target.kind === 'call'
                  ? 'Callback Request Preview Saved'
                  : 'Enquiry Sent (Frontend Demo)'}
              </h3>
              <p className="text-xs text-[#6F5643] leading-relaxed">
                Your demo enquiry for <strong>{target.recipientName}</strong> has been recorded in
                this preview session. No live SMS or payment transaction was sent.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 px-6 py-2 rounded-lg bg-[#593B2A] text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-[#B42318]">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Bilal Khan"
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm focus:outline-none focus:border-[#593B2A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">
                  Your Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#593B2A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#382619] mb-1">Message</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-[#D8C5A5] px-3 py-2 text-xs leading-relaxed focus:outline-none focus:border-[#593B2A]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-[#D8C5A5] text-xs font-semibold text-[#593B2A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    target.kind === 'whatsapp'
                      ? 'bg-[#1D8348] hover:bg-[#166838] text-white'
                      : 'bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619]'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Sending...'
                      : target.kind === 'whatsapp'
                      ? 'Send WhatsApp Demo'
                      : target.kind === 'call'
                      ? 'Request Callback'
                      : 'Send Enquiry'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
