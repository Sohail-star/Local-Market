export type ChatMessageType = 'TEXT' | 'VOICE' | 'IMAGE';

export interface ChatParticipant {
  id: string;
  fullName: string;
  city: string;
  area: string;
  avatarUrl: string | null;
  phone: string | null;
  roleLabel: string;
}

export interface ChatListingSummary {
  kind: 'PRODUCT' | 'SERVICE' | 'GENERAL';
  refId: string | null;
  productId: string | null;
  serviceId: string | null;
  title: string;
  priceLabel: string | null;
  imageUrl: string | null;
  locationLabel: string | null;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string | null;
  messageType: ChatMessageType;
  mediaUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  buyerId: string;
  sellerId: string;
  otherParticipant: ChatParticipant;
  listing: ChatListingSummary;
  lastMessage: ChatMessageItem | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface StartConversationPayload {
  sellerId?: string;
  productId?: string;
  serviceId?: string;
  listingType?: 'PRODUCT' | 'SERVICE';
  listingRefId?: string;
  listingTitle?: string;
  listingPriceLabel?: string;
  listingImageUrl?: string;
  locationLabel?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerCity?: string;
  sellerArea?: string;
  sellerProvince?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

async function chatFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const exec = () =>
    fetch(input, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

  let res = await exec();
  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
    if (refreshRes.ok) {
      res = await exec();
    }
  }

  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`Unexpected response from chat server (${res.status}).`);
  }

  if (!res.ok || !body.success || body.data === undefined) {
    const err = new Error(body.message || 'Chat request failed.') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return body.data;
}

export async function startOrFindConversation(
  payload: StartConversationPayload
): Promise<{ conversation: ConversationSummary; created: boolean }> {
  return chatFetch<{ conversation: ConversationSummary; created: boolean }>(
    '/api/chat/conversations',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function fetchConversations(): Promise<{
  conversations: ConversationSummary[];
  totalUnreadCount: number;
}> {
  return chatFetch<{
    conversations: ConversationSummary[];
    totalUnreadCount: number;
  }>('/api/chat/conversations', { method: 'GET' });
}

export async function fetchConversationMessages(conversationId: string): Promise<{
  conversation: ConversationSummary;
  messages: ChatMessageItem[];
}> {
  return chatFetch<{
    conversation: ConversationSummary;
    messages: ChatMessageItem[];
  }>(`/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'GET',
  });
}

export async function sendChatMessage(
  conversationId: string,
  payload: {
    messageType: ChatMessageType;
    content?: string;
    mediaUrl?: string;
  }
): Promise<{ message: ChatMessageItem }> {
  return chatFetch<{ message: ChatMessageItem }>(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}
