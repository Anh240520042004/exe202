import express from 'express';
import { protect } from '../middleware/auth.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

router.get('/', protect, aiController.getChats);
router.get('/provider-status', protect, aiController.getProviderStatus);
router.get('/:id', protect, aiController.getChatById);

router.post('/', protect, aiController.createChat);
router.post('/chatbot', protect, aiController.chatWithGPT);
router.post('/:id/message', protect, aiController.sendMessage);

router.delete('/:id', protect, aiController.deleteChat);

export default router;
