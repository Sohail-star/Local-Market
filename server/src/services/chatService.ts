import crypto from 'node:crypto';
import type { ChatMessageType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '../config/prisma.ts';
import { AppError } from '../utils/apiResponse.ts';

export interface StartConversationInput {
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

export interface ChatParticipantDto {
  id: string;
  fullName: string;
  city: string;
  area: string;
  avatarUrl: string | null;
  phone: string | null;
  roleLabel: string;
}

export interface ChatListingSummaryDto {
  kind: 'PRODUCT' | 'SERVICE' | 'GENERAL';
  refId: string | null;
  productId: string | null;
  serviceId: string | null;
  title: string;
  priceLabel: string | null;
  imageUrl: string | null;
  locationLabel: string | null;
}

export interface ChatMessageDto {
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

export interface ConversationSummaryDto {
  id: string;
  buyerId: string;
  sellerId: string;
  otherParticipant: ChatParticipantDto;
  listing: ChatListingSummaryDto;
  lastMessage: ChatMessageDto | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

function slugifyMerchantKey(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'local-merchant'
  );
}

async function resolveOrCreateMerchantUser(params: {
  sellerName?: string;
  city?: string;
  area?: string;
  province?: string;
}): Promise<string> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }

  const cleanName = (params.sellerName || 'LocalMarket Seller').trim();
  const cleanCity = (params.city || 'Peshawar').trim();
  const cleanArea = (params.area || 'City Center').trim();
  const cleanProvince = (params.province || 'Khyber Pakhtunkhwa').trim();
  const merchantSlug = slugifyMerchantKey(`${cleanName}-${cleanCity}`);
  const merchantEmail = `merchant.${merchantSlug}@marketplace.localmarket.pk`;

  const existing = await prisma.user.findUnique({
    where: { email: merchantEmail },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 8);
  const created = await prisma.user.create({
    data: {
      fullName: cleanName,
      email: merchantEmail,
      phone: null,
      passwordHash: randomPasswordHash,
      province: cleanProvince,
      city: cleanCity,
      area: cleanArea,
      accountStatus: 'ACTIVE',
      sellerVerified: true,
      providerVerified: true,
      capabilities: {
        create: [
          { capability: 'BUY', isEnabled: true },
          { capability: 'SELL', isEnabled: true },
          { capability: 'OFFER_SERVICES', isEnabled: true },
          { capability: 'HIRE_PROVIDERS', isEnabled: true },
        ],
      },
    },
    select: { id: true },
  });

  return created.id;
}

function buildConversationInclude(currentUserId: string) {
  return {
    buyer: {
      select: {
        id: true,
        fullName: true,
        city: true,
        area: true,
        avatarUrl: true,
        phone: true,
      },
    },
    seller: {
      select: {
        id: true,
        fullName: true,
        city: true,
        area: true,
        avatarUrl: true,
        phone: true,
      },
    },
    product: {
      select: {
        id: true,
        title: true,
        price: true,
        city: true,
        area: true,
        images: {
          orderBy: { sortOrder: 'asc' as const },
          take: 1,
          select: { url: true },
        },
      },
    },
    service: {
      select: {
        id: true,
        title: true,
        startingPrice: true,
        city: true,
        primaryArea: true,
      },
    },
    messages: {
      where: { conversationId: { not: null } },
      orderBy: { createdAt: 'desc' as const },
      take: 1,
      include: {
        sender: {
          select: { id: true, fullName: true },
        },
      },
    },
    _count: {
      select: {
        messages: {
          where: {
            senderId: { not: currentUserId },
            isRead: false,
          },
        },
      },
    },
  };
}

type HydratedConversation = Awaited<
  ReturnType<NonNullable<ReturnType<typeof getPrismaClient>>['conversation']['findFirst']>
> & {
  buyer: {
    id: string;
    fullName: string;
    city: string;
    area: string;
    avatarUrl: string | null;
    phone: string | null;
  };
  seller: {
    id: string;
    fullName: string;
    city: string;
    area: string;
    avatarUrl: string | null;
    phone: string | null;
  };
  product: {
    id: string;
    title: string;
    price: unknown;
    city: string;
    area: string;
    images: { url: string }[];
  } | null;
  service: {
    id: string;
    title: string;
    startingPrice: unknown;
    city: string;
    primaryArea: string;
  } | null;
  messages: {
    id: string;
    conversationId: string | null;
    senderId: string;
    content: string | null;
    body: string | null;
    messageType: ChatMessageType;
    mediaUrl: string | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    sender: { id: string; fullName: string };
  }[];
  _count: { messages: number };
};

function formatMessageDto(msg: {
  id: string;
  conversationId: string | null;
  senderId: string;
  content: string | null;
  body: string | null;
  messageType: ChatMessageType;
  mediaUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  sender: { id: string; fullName: string };
}): ChatMessageDto {
  return {
    id: msg.id,
    conversationId: msg.conversationId || '',
    senderId: msg.senderId,
    senderName: msg.sender.fullName,
    content: msg.content ?? msg.body ?? null,
    messageType: msg.messageType,
    mediaUrl: msg.mediaUrl ?? null,
    isRead: msg.isRead,
    readAt: msg.readAt ? msg.readAt.toISOString() : null,
    createdAt: msg.createdAt.toISOString(),
  };
}

function formatConversationSummary(
  conv: HydratedConversation,
  currentUserId: string
): ConversationSummaryDto {
  const isCurrentUserBuyer = conv.buyerId === currentUserId;
  const other = isCurrentUserBuyer ? conv.seller : conv.buyer;
  const roleLabel = isCurrentUserBuyer
    ? conv.listingType === 'SERVICE' || conv.serviceId
      ? 'Service Provider'
      : 'Seller'
    : 'Buyer';

  const kind: ChatListingSummaryDto['kind'] =
    conv.serviceId || conv.listingType === 'SERVICE'
      ? 'SERVICE'
      : conv.productId || conv.listingType === 'PRODUCT'
        ? 'PRODUCT'
        : 'GENERAL';

  const title =
    conv.listingTitle ||
    conv.product?.title ||
    conv.service?.title ||
    'Direct Marketplace Inquiry';

  const priceLabel =
    conv.listingPriceLabel ||
    (conv.product ? `Rs. ${Number(conv.product.price).toLocaleString('en-PK')}` : null) ||
    (conv.service ? `From Rs. ${Number(conv.service.startingPrice).toLocaleString('en-PK')}` : null);

  const imageUrl = conv.listingImageUrl || conv.product?.images?.[0]?.url || null;
  const locationLabel =
    conv.locationLabel ||
    (conv.product ? `${conv.product.area}, ${conv.product.city}` : null) ||
    (conv.service ? `${conv.service.primaryArea}, ${conv.service.city}` : null);

  const lastMsg = conv.messages?.[0] ? formatMessageDto(conv.messages[0]) : null;

  return {
    id: conv.id,
    buyerId: conv.buyerId,
    sellerId: conv.sellerId,
    otherParticipant: {
      id: other.id,
      fullName: other.fullName,
      city: other.city,
      area: other.area,
      avatarUrl: other.avatarUrl,
      phone: other.phone,
      roleLabel,
    },
    listing: {
      kind,
      refId: conv.listingRefId || conv.productId || conv.serviceId || null,
      productId: conv.productId,
      serviceId: conv.serviceId,
      title,
      priceLabel,
      imageUrl,
      locationLabel,
    },
    lastMessage: lastMsg,
    unreadCount: conv._count?.messages ?? 0,
    updatedAt: conv.updatedAt.toISOString(),
    createdAt: conv.createdAt.toISOString(),
  };
}

export async function findOrCreateConversation(
  buyerUserId: string,
  input: StartConversationInput
): Promise<{ conversation: ConversationSummaryDto; created: boolean }> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }

  let dbProductId: string | null = null;
  let dbServiceId: string | null = null;
  let resolvedSellerId: string | null = null;
  let resolvedListingType: 'PRODUCT' | 'SERVICE' | undefined = input.listingType;
  let resolvedListingRefId: string | null = input.listingRefId?.trim() || null;
  let resolvedListingTitle = input.listingTitle?.trim() || null;
  let resolvedPriceLabel = input.listingPriceLabel?.trim() || null;
  let resolvedImageUrl = input.listingImageUrl?.trim() || null;
  let resolvedLocationLabel = input.locationLabel?.trim() || null;

  if (input.productId) {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: input.productId }, { slug: input.productId }] },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    if (product) {
      dbProductId = product.id;
      resolvedSellerId = product.ownerId;
      resolvedListingType = 'PRODUCT';
      resolvedListingRefId = resolvedListingRefId || product.id;
      resolvedListingTitle = resolvedListingTitle || product.title;
      resolvedPriceLabel =
        resolvedPriceLabel || `Rs. ${Number(product.price).toLocaleString('en-PK')}`;
      resolvedImageUrl = resolvedImageUrl || product.images[0]?.url || null;
      resolvedLocationLabel = resolvedLocationLabel || `${product.area}, ${product.city}`;
    } else {
      resolvedListingType = resolvedListingType || 'PRODUCT';
      resolvedListingRefId = resolvedListingRefId || input.productId;
    }
  }

  if (input.serviceId && !dbProductId) {
    const service = await prisma.service.findFirst({
      where: { OR: [{ id: input.serviceId }, { slug: input.serviceId }] },
    });
    if (service) {
      dbServiceId = service.id;
      resolvedSellerId = service.providerId;
      resolvedListingType = 'SERVICE';
      resolvedListingRefId = resolvedListingRefId || service.id;
      resolvedListingTitle = resolvedListingTitle || service.title;
      resolvedPriceLabel =
        resolvedPriceLabel ||
        `From Rs. ${Number(service.startingPrice).toLocaleString('en-PK')}`;
      resolvedLocationLabel = resolvedLocationLabel || `${service.primaryArea}, ${service.city}`;
    } else {
      resolvedListingType = resolvedListingType || 'SERVICE';
      resolvedListingRefId = resolvedListingRefId || input.serviceId;
    }
  }

  if (!resolvedSellerId && input.sellerId) {
    const sellerUser = await prisma.user.findUnique({
      where: { id: input.sellerId },
      select: { id: true },
    });
    if (sellerUser) {
      resolvedSellerId = sellerUser.id;
    }
  }

  if (!resolvedSellerId) {
    resolvedSellerId = await resolveOrCreateMerchantUser({
      sellerName: input.sellerName || resolvedListingTitle || 'LocalMarket Seller',
      city: input.sellerCity,
      area: input.sellerArea,
      province: input.sellerProvince,
    });
  }

  if (resolvedSellerId === buyerUserId) {
    throw new AppError(400, 'You cannot start a buyer inquiry chat with your own listing.');
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      buyerId: buyerUserId,
      sellerId: resolvedSellerId,
      ...(dbProductId
        ? { productId: dbProductId }
        : dbServiceId
          ? { serviceId: dbServiceId }
          : resolvedListingRefId
            ? { listingRefId: resolvedListingRefId }
            : { productId: null, serviceId: null, listingRefId: null }),
    },
    include: buildConversationInclude(buyerUserId),
  });

  if (existing) {
    return {
      conversation: formatConversationSummary(existing as HydratedConversation, buyerUserId),
      created: false,
    };
  }

  const created = await prisma.conversation.create({
    data: {
      buyerId: buyerUserId,
      sellerId: resolvedSellerId,
      productId: dbProductId,
      serviceId: dbServiceId,
      listingType: resolvedListingType || null,
      listingRefId: resolvedListingRefId,
      listingTitle: resolvedListingTitle,
      listingPriceLabel: resolvedPriceLabel,
      listingImageUrl: resolvedImageUrl,
      locationLabel: resolvedLocationLabel,
    },
    include: buildConversationInclude(buyerUserId),
  });

  return {
    conversation: formatConversationSummary(created as HydratedConversation, buyerUserId),
    created: true,
  };
}

export async function listUserConversations(userId: string): Promise<{
  conversations: ConversationSummaryDto[];
  totalUnreadCount: number;
}> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }

  const rows = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: buildConversationInclude(userId),
  });

  const conversations = rows.map((row) =>
    formatConversationSummary(row as HydratedConversation, userId)
  );
  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, totalUnreadCount };
}

export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<{
  conversation: ConversationSummaryDto;
  messages: ChatMessageDto[];
}> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: buildConversationInclude(userId),
  });

  if (!conv) {
    throw new AppError(404, 'Conversation not found.');
  }

  if (conv.buyerId !== userId && conv.sellerId !== userId) {
    throw new AppError(403, 'You do not have permission to view this conversation.');
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, fullName: true } },
    },
  });

  const formattedSummary = formatConversationSummary(conv as HydratedConversation, userId);
  formattedSummary.unreadCount = 0;

  return {
    conversation: formattedSummary,
    messages: messages.map((m) => formatMessageDto(m)),
  };
}

export async function sendChatMessage(
  conversationId: string,
  senderId: string,
  input: {
    messageType?: ChatMessageType;
    content?: string;
    mediaUrl?: string;
  }
): Promise<ChatMessageDto> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(503, 'Database unavailable.');
  }

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, buyerId: true, sellerId: true },
  });

  if (!conv) {
    throw new AppError(404, 'Conversation not found.');
  }

  if (conv.buyerId !== senderId && conv.sellerId !== senderId) {
    throw new AppError(403, 'You do not have permission to send messages in this conversation.');
  }

  const messageType: ChatMessageType = input.messageType || 'TEXT';
  const trimmedContent = input.content?.trim() || null;
  const trimmedMediaUrl = input.mediaUrl?.trim() || null;

  if (messageType === 'TEXT') {
    if (!trimmedContent) {
      throw new AppError(400, 'Message text cannot be empty.');
    }
  } else if (messageType === 'VOICE') {
    if (
      !trimmedMediaUrl ||
      !(
        trimmedMediaUrl.startsWith('data:audio/') ||
        trimmedMediaUrl.startsWith('data:video/webm') ||
        trimmedMediaUrl.startsWith('https://')
      )
    ) {
      throw new AppError(400, 'Valid audio recording payload is required for voice messages.');
    }
  } else if (messageType === 'IMAGE') {
    if (
      !trimmedMediaUrl ||
      !(trimmedMediaUrl.startsWith('data:image/') || trimmedMediaUrl.startsWith('https://'))
    ) {
      throw new AppError(400, 'Valid image payload is required for image messages.');
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderId,
        content: trimmedContent,
        body: trimmedContent,
        messageType,
        mediaUrl: trimmedMediaUrl,
        isRead: false,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return msg;
  });

  return formatMessageDto(created);
}
