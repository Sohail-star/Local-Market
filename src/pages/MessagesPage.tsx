import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  ExternalLink,
  ImagePlus,
  LogIn,
  MessageSquare,
  Mic,
  Search,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { SmartImage } from '../components/SmartImage';
import { UserAvatar } from '../components/UserAvatar';
import {
  ChatMessageItem,
  ConversationSummary,
  fetchConversationMessages,
  fetchConversations,
  sendChatMessage,
} from '../services/chatApi';
import { UserAccount } from '../types/marketplace';

interface MessagesPageProps {
  user: UserAccount | null;
  onUnreadCountChange?: (count: number) => void;
}

function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatRelativeDay(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatDurationSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getMessagePreviewText(msg: ChatMessageItem | null): string {
  if (!msg) return 'Start the conversation';
  if (msg.messageType === 'VOICE') {
    return msg.content ? `Voice message (${msg.content})` : 'Voice message';
  }
  if (msg.messageType === 'IMAGE') {
    return msg.content ? `Photo: ${msg.content}` : 'Photo attachment';
  }
  return msg.content || 'Message';
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ user, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get('chatId') || '';

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Composer state
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Voice recording state (MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioDataUrl, setRecordedAudioDataUrl] = useState<string | null>(null);
  const [recordedDurationLabel, setRecordedDurationLabel] = useState<string>('0:00');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const prevMsgCountRef = useRef<number>(0);

  const stopRecordingTracks = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopRecordingTracks();
    };
  }, []);

  const loadInbox = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setLoadingInbox(true);
      try {
        const res = await fetchConversations();
        setConversations(res.conversations);
        onUnreadCountChange?.(res.totalUnreadCount);

        if (!activeChatId && res.conversations.length > 0 && window.innerWidth >= 1024) {
          setSearchParams({ chatId: res.conversations[0].id }, { replace: true });
        }
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Unable to load conversations.');
        }
      } finally {
        if (!silent) setLoadingInbox(false);
      }
    },
    [user, activeChatId, onUnreadCountChange, setSearchParams]
  );

  const loadMessages = useCallback(
    async (chatId: string, silent = false) => {
      if (!user || !chatId) return;
      if (!silent) setLoadingThread(true);
      try {
        const res = await fetchConversationMessages(chatId);
        setActiveConversation(res.conversation);
        setMessages(res.messages);
        setError(null);
        // Clear unread count locally for this active thread
        setConversations((prev) => {
          const updated = prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c));
          const total = updated.reduce((sum, c) => sum + c.unreadCount, 0);
          onUnreadCountChange?.(total);
          return updated;
        });
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Unable to load chat messages.');
        }
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [user, onUnreadCountChange]
  );

  useEffect(() => {
    if (user) {
      void loadInbox(false);
    } else {
      setLoadingInbox(false);
    }
  }, [user, loadInbox]);

  useEffect(() => {
    if (user && activeChatId) {
      prevMsgCountRef.current = 0;
      void loadMessages(activeChatId, false);
    } else {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, activeChatId, loadMessages]);

  // Smooth scroll to bottom when new messages appear
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  // Auto-poll inbox + active thread every 3.5 seconds for near real-time OLX-style updates
  useEffect(() => {
    if (!user) return;
    const intervalId = window.setInterval(() => {
      void loadInbox(true);
      if (activeChatId) {
        void loadMessages(activeChatId, true);
      }
    }, 3500);
    return () => window.clearInterval(intervalId);
  }, [user, activeChatId, loadInbox, loadMessages]);

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.otherParticipant.fullName.toLowerCase().includes(q) ||
        c.listing.title.toLowerCase().includes(q) ||
        (c.lastMessage?.content || '').toLowerCase().includes(q)
    );
  }, [conversations, searchTerm]);

  const handleSelectConversation = (chatId: string) => {
    setSearchParams({ chatId });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Image attachment must be smaller than 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingImageDataUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartRecording = async () => {
    setVoiceError(null);
    setRecordedAudioDataUrl(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError('Voice recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        stopRecordingTracks();
        setIsRecording(false);
        setRecordedDurationLabel(formatDurationSeconds(Math.max(1, recordingSecondsRef.current)));

        if (blob.size === 0) {
          setVoiceError('No audio was captured. Please try speaking again.');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setRecordedAudioDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);
      setIsRecording(true);
      recorder.start();

      recordingTimerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
        if (recordingSecondsRef.current >= 120) {
          recorder.stop();
        }
      }, 1000);
    } catch {
      stopRecordingTracks();
      setIsRecording(false);
      setVoiceError('Microphone access was denied. Enable mic permissions to record voice notes.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopRecordingTracks();
    setIsRecording(false);
    setRecordedAudioDataUrl(null);
    setRecordingSeconds(0);
  };

  const handleSendVoiceNote = async () => {
    if (!activeChatId || !recordedAudioDataUrl || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await sendChatMessage(activeChatId, {
        messageType: 'VOICE',
        content: recordedDurationLabel,
        mediaUrl: recordedAudioDataUrl,
      });
      setMessages((prev) => [...prev, res.message]);
      setRecordedAudioDataUrl(null);
      setRecordingSeconds(0);
      void loadInbox(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send voice note.');
    } finally {
      setSending(false);
    }
  };

  const handleSendTextOrImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || sending) return;

    const trimmed = textInput.trim();
    if (!pendingImageDataUrl && !trimmed) return;

    setSending(true);
    setError(null);
    try {
      const res = await sendChatMessage(activeChatId, {
        messageType: pendingImageDataUrl ? 'IMAGE' : 'TEXT',
        content: trimmed || undefined,
        mediaUrl: pendingImageDataUrl || undefined,
      });
      setMessages((prev) => [...prev, res.message]);
      setTextInput('');
      setPendingImageDataUrl(null);
      void loadInbox(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="bg-white rounded-2xl border border-[#EADBC2] shadow-xs p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF9ED] border border-[#EADBC2] flex items-center justify-center mx-auto">
            <MessageSquare className="w-7 h-7 text-[#593B2A]" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#382619]">
            Sign In to View Your Messages
          </h1>
          <p className="text-sm text-[#6F5643]">
            Chat in real time with sellers and local service providers, share product photos, and
            send quick voice notes directly from your LocalMarket inbox.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/login?redirect=/messages"
              className="px-5 py-2.5 rounded-xl bg-[#593B2A] hover:bg-[#3B2518] text-white text-sm font-bold inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#F5B82E]" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/signup?redirect=/messages"
              className="px-5 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-sm font-extrabold"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const listingDetailHref =
    activeConversation?.listing.kind === 'SERVICE' && activeConversation.listing.refId
      ? `/services/${activeConversation.listing.refId}`
      : activeConversation?.listing.kind === 'PRODUCT' && activeConversation.listing.refId
        ? `/products/${activeConversation.listing.refId}`
        : null;

  return (
    <div className="space-y-3">
      {/* Page Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#382619]">
            LocalMarket Inbox
          </h1>
          <p className="text-xs text-[#6F5643]">
            Direct chats &amp; voice messages for product and service inquiries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/buy-sell"
            className="px-3.5 py-2 rounded-lg bg-white border border-[#EADBC2] hover:bg-[#FFF9ED] text-xs font-bold text-[#593B2A]"
          >
            Browse Products
          </Link>
          <Link
            to="/services"
            className="px-3.5 py-2 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] text-xs font-extrabold text-[#382619]"
          >
            Find Services
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-[#B42318]"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 rounded hover:bg-red-100 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Split OLX-style Inbox & Chat Frame */}
      <div className="bg-white rounded-2xl border border-[#EADBC2] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] lg:h-[72vh]">
        {/* Left Sidebar: Active Conversations */}
        <aside
          className={`lg:col-span-4 border-r border-[#EADBC2] flex flex-col bg-[#FFFDF8] ${
            activeChatId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 border-b border-[#EADBC2] bg-[#FFF9ED] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#593B2A]">
                All Conversations ({conversations.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A7158] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search seller, provider, or listing..."
                className="w-full rounded-xl border border-[#D8C5A5] bg-white pl-9 pr-3 py-2 text-xs text-[#382619] focus:outline-none focus:border-[#593B2A]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F3E9D7]">
            {loadingInbox ? (
              <div className="p-6 text-center text-xs text-[#6F5643]">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2.5">
                <MessageSquare className="w-9 h-9 text-[#C9A878] mx-auto" />
                <p className="text-sm font-bold text-[#382619]">No conversations yet</p>
                <p className="text-xs text-[#6F5643]">
                  Open any product or service page and click &ldquo;Chat with Seller&rdquo; or
                  &ldquo;Chat with Provider&rdquo; to start messaging.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const selected = conv.id === activeChatId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#FFF4D6] border-l-4 border-[#593B2A]'
                        : 'hover:bg-[#FFF9ED]'
                    }`}
                  >
                    <UserAvatar
                      name={conv.otherParticipant.fullName}
                      avatarUrl={conv.otherParticipant.avatarUrl || undefined}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-[#382619] truncate">
                          {conv.otherParticipant.fullName}
                        </p>
                        <span className="text-[10px] font-medium text-[#8A7158] shrink-0 tabular-nums">
                          {formatRelativeDay(conv.lastMessage?.createdAt || conv.updatedAt)}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-[#593B2A] truncate mt-0.5">
                        {conv.listing.title}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-[#6F5643] truncate">
                          {getMessagePreviewText(conv.lastMessage)}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#F5B82E] text-[#382619] text-[10px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Chat Window */}
        <section
          className={`lg:col-span-8 flex flex-col bg-white min-h-[540px] ${
            !activeChatId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {!activeChatId || !activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FFFDF8]">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF4D6] border border-[#EADBC2] flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-[#593B2A]" />
              </div>
              <h2 className="font-display text-xl font-extrabold text-[#382619]">
                Select a Conversation
              </h2>
              <p className="text-xs sm:text-sm text-[#6F5643] max-w-sm mt-1.5">
                Choose a chat on the left to continue negotiating prices, asking about condition, or
                scheduling a service visit via text or voice note.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="border-b border-[#EADBC2] bg-[#FFF9ED] px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate('/messages')}
                      className="lg:hidden w-8 h-8 rounded-lg bg-white border border-[#EADBC2] flex items-center justify-center text-[#593B2A] cursor-pointer shrink-0"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <UserAvatar
                      name={activeConversation.otherParticipant.fullName}
                      avatarUrl={activeConversation.otherParticipant.avatarUrl || undefined}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-extrabold text-[#382619] truncate">
                          {activeConversation.otherParticipant.fullName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md bg-[#593B2A] text-[#F5B82E] text-[10px] font-bold shrink-0">
                          {activeConversation.otherParticipant.roleLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6F5643] truncate">
                        {activeConversation.otherParticipant.area},{' '}
                        {activeConversation.otherParticipant.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Discussed Product / Service Context Card */}
                <div className="rounded-xl bg-white border border-[#EADBC2] px-3 py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-[#FFF9ED] border border-[#EADBC2] overflow-hidden shrink-0">
                      <SmartImage
                        src={activeConversation.listing.imageUrl || ''}
                        alt={activeConversation.listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#382619] truncate">
                        {activeConversation.listing.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6F5643]">
                        {activeConversation.listing.priceLabel && (
                          <span className="font-extrabold text-[#B8320A] tabular-nums">
                            {activeConversation.listing.priceLabel}
                          </span>
                        )}
                        {activeConversation.listing.locationLabel && (
                          <span>· {activeConversation.listing.locationLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {listingDetailHref && (
                    <Link
                      to={listingDetailHref}
                      className="px-2.5 py-1.5 rounded-lg bg-[#FFF9ED] hover:bg-[#FFF2D6] border border-[#EADBC2] text-[11px] font-bold text-[#593B2A] inline-flex items-center gap-1 shrink-0"
                    >
                      <span>View Ad</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Scrollable Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFDF9]">
                {loadingThread && messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#6F5643]">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-xs font-bold text-[#593B2A]">
                      No messages in this chat yet
                    </p>
                    <p className="text-xs text-[#6F5643] max-w-sm mx-auto">
                      Send a quick message or record a voice note to ask about availability,
                      final price, or delivery in {activeConversation.otherParticipant.city}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-2xs space-y-1.5 ${
                            isMine
                              ? 'bg-[#593B2A] text-white rounded-br-sm'
                              : 'bg-[#FFF9ED] border border-[#EADBC2] text-[#382619] rounded-bl-sm'
                          }`}
                        >
                          {msg.messageType === 'IMAGE' && msg.mediaUrl && (
                            <button
                              type="button"
                              onClick={() => setLightboxImageUrl(msg.mediaUrl)}
                              className="block rounded-xl overflow-hidden border border-black/10 cursor-pointer"
                            >
                              <img
                                src={msg.mediaUrl}
                                alt={msg.content || 'Chat attachment'}
                                className="max-h-60 w-auto object-cover"
                              />
                            </button>
                          )}

                          {msg.messageType === 'VOICE' && msg.mediaUrl && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                <Mic
                                  className={`w-3.5 h-3.5 ${
                                    isMine ? 'text-[#F5B82E]' : 'text-[#593B2A]'
                                  }`}
                                />
                                <span>
                                  Voice Note{msg.content ? ` · ${msg.content}` : ''}
                                </span>
                              </div>
                              <audio
                                controls
                                preload="metadata"
                                src={msg.mediaUrl}
                                className="h-8 max-w-[240px] sm:max-w-[260px]"
                              />
                            </div>
                          )}

                          {msg.content && msg.messageType !== 'VOICE' && (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {msg.content}
                            </p>
                          )}

                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] tabular-nums ${
                              isMine ? 'text-[#E9D8BA]' : 'text-[#8A7158]'
                            }`}
                          >
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isMine &&
                              (msg.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#F5B82E]" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={feedEndRef} />
              </div>

              {/* Composer Area */}
              <div className="border-t border-[#EADBC2] bg-white p-3 space-y-2.5">
                {voiceError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-[#B42318] flex items-center justify-between">
                    <span>{voiceError}</span>
                    <button
                      type="button"
                      onClick={() => setVoiceError(null)}
                      className="cursor-pointer"
                      aria-label="Dismiss voice error"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {pendingImageDataUrl && (
                  <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={pendingImageDataUrl}
                        alt="Pending upload preview"
                        className="w-12 h-12 rounded-lg object-cover border border-[#D8C5A5]"
                      />
                      <span className="text-xs font-semibold text-[#382619]">
                        Image ready to send (add an optional caption below)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingImageDataUrl(null)}
                      className="p-1.5 rounded-lg text-[#B42318] hover:bg-red-50 cursor-pointer"
                      aria-label="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isRecording && (
                  <div className="rounded-xl bg-[#FFF4D6] border border-[#F5B82E] px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#B42318] text-white flex items-center justify-center">
                        <Mic className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-[#382619]">
                          Recording Voice Note...{' '}
                          <span className="tabular-nums text-[#B42318]">
                            {formatDurationSeconds(recordingSeconds)}
                          </span>
                        </p>
                        <p className="text-[11px] text-[#6F5643]">
                          Click Stop to preview before sending
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelRecording}
                        className="px-3 py-1.5 rounded-lg border border-[#D8C5A5] bg-white text-xs font-bold text-[#6F5643] hover:text-[#382619] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="px-3 py-1.5 rounded-lg bg-[#593B2A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-3 h-3 fill-current text-[#F5B82E]" />
                        <span>Stop</span>
                      </button>
                    </div>
                  </div>
                )}

                {!isRecording && recordedAudioDataUrl && (
                  <div className="rounded-xl bg-[#FFF9ED] border border-[#EADBC2] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Mic className="w-4 h-4 text-[#593B2A] shrink-0" />
                      <audio controls src={recordedAudioDataUrl} className="h-8 max-w-[220px]" />
                      <span className="text-[11px] font-bold text-[#593B2A] tabular-nums">
                        {recordedDurationLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRecordedAudioDataUrl(null)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#B42318] hover:bg-red-50 cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        disabled={sending}
                        onClick={handleSendVoiceNote}
                        className="px-3.5 py-1.5 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] disabled:opacity-60 text-[#382619] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sending ? 'Sending...' : 'Send Voice Note'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendTextOrImage} className="flex items-center gap-2">
                  <label
                    className="w-10 h-10 rounded-xl border border-[#EADBC2] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-[#593B2A] flex items-center justify-center shrink-0 cursor-pointer"
                    title="Attach photo"
                    aria-label="Attach photo"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                      isRecording
                        ? 'bg-[#B42318] border-[#B42318] text-white'
                        : 'border-[#EADBC2] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-[#593B2A]'
                    }`}
                    title={isRecording ? 'Stop recording voice note' : 'Record voice note'}
                    aria-label={isRecording ? 'Stop recording voice note' : 'Record voice note'}
                  >
                    {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Write a message (e.g. Is this still available?)"
                    className="flex-1 rounded-xl border border-[#D8C5A5] bg-[#FFFDF9] px-3.5 py-2.5 text-sm text-[#382619] focus:outline-none focus:border-[#593B2A]"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!textInput.trim() && !pendingImageDataUrl)}
                    className="h-10 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] disabled:opacity-50 text-[#382619] text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">{sending ? 'Sending' : 'Send'}</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Image Attachment Lightbox */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setLightboxImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-[#382619] shadow-lg flex items-center justify-center cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImageUrl}
              alt="Full attachment preview"
              className="max-h-[82vh] max-w-full rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
