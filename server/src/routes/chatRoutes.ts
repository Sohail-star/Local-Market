import { Router } from 'express';
import {
  getConversationMessagesHandler,
  listConversationsHandler,
  sendMessageHandler,
  startConversationHandler,
} from '../controllers/chatController.ts';
import { requireUserAuth } from '../middleware/userAuthMiddleware.ts';

const chatRoutes = Router();

chatRoutes.use(requireUserAuth);

chatRoutes.post('/conversations', startConversationHandler);
chatRoutes.get('/conversations', listConversationsHandler);
chatRoutes.get('/conversations/:id/messages', getConversationMessagesHandler);
chatRoutes.post('/conversations/:id/messages', sendMessageHandler);

export { chatRoutes };
