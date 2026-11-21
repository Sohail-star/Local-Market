import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import {
  findOrCreateConversation,
  getConversationWithMessages,
  listUserConversations,
  sendChatMessage,
} from '../services/chatService.ts';
import type { AuthenticatedRequest } from '../types/api.ts';
import { sendError, sendSuccess } from '../utils/apiResponse.ts';

const startConversationSchema = z.object({
  sellerId: z.string().trim().max(128).optional(),
  productId: z.string().trim().max(128).optional(),
  serviceId: z.string().trim().max(128).optional(),
  listingType: z.enum(['PRODUCT', 'SERVICE']).optional(),
  listingRefId: z.string().trim().max(128).optional(),
  listingTitle: z.string().trim().max(200).optional(),
  listingPriceLabel: z.string().trim().max(80).optional(),
  listingImageUrl: z.string().trim().max(1000).optional(),
  locationLabel: z.string().trim().max(160).optional(),
  sellerName: z.string().trim().max(120).optional(),
  sellerPhone: z.string().trim().max(32).optional(),
  sellerCity: z.string().trim().max(80).optional(),
  sellerArea: z.string().trim().max(120).optional(),
  sellerProvince: z.string().trim().max(80).optional(),
});

const sendMessageSchema = z.object({
  messageType: z.enum(['TEXT', 'VOICE', 'IMAGE']).default('TEXT'),
  content: z.string().max(4000).optional(),
  mediaUrl: z.string().max(6_500_000).optional(),
});

export async function startConversationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      sendError(res, 401, 'Authentication required.');
      return;
    }

    const parsed = startConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        400,
        'Invalid conversation request.',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
      return;
    }

    const result = await findOrCreateConversation(req.auth.userId, parsed.data);
    sendSuccess(
      res,
      result.created ? 201 : 200,
      result.created ? 'Conversation started.' : 'Existing conversation loaded.',
      result
    );
  } catch (err) {
    next(err);
  }
}

export async function listConversationsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      sendError(res, 401, 'Authentication required.');
      return;
    }

    const result = await listUserConversations(req.auth.userId);
    sendSuccess(res, 200, 'Conversations loaded.', result);
  } catch (err) {
    next(err);
  }
}

export async function getConversationMessagesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      sendError(res, 401, 'Authentication required.');
      return;
    }

    const conversationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!conversationId) {
      sendError(res, 400, 'Conversation ID is required.');
      return;
    }

    const result = await getConversationWithMessages(conversationId, req.auth.userId);
    sendSuccess(res, 200, 'Messages loaded.', result);
  } catch (err) {
    next(err);
  }
}

export async function sendMessageHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      sendError(res, 401, 'Authentication required.');
      return;
    }

    const conversationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!conversationId) {
      sendError(res, 400, 'Conversation ID is required.');
      return;
    }

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        400,
        'Invalid message payload.',
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
      return;
    }

    const message = await sendChatMessage(conversationId, req.auth.userId, parsed.data);
    sendSuccess(res, 201, 'Message sent.', { message });
  } catch (err) {
    next(err);
  }
}
