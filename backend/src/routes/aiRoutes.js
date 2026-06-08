import express from 'express';
import { protect } from '../middleware/auth.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

router.get('/', protect, aiController.getChats);
router.get('/prompts', aiController.getSuggestedPrompts);
router.get('/provider-status', protect, aiController.getProviderStatus);
router.get('/:id', protect, aiController.getChatById);

router.post('/', protect, aiController.createChat);
router.post('/:id/message', protect, aiController.sendMessage);
router.post('/summarize', protect, aiController.summarizePdf);
router.post('/flashcards', protect, aiController.generateFlashcards);
router.post('/quiz', protect, aiController.generateQuiz);
router.post('/explain-code', protect, aiController.explainCode);
router.post('/roadmap', protect, aiController.generateStudyRoadmap);

router.delete('/:id', protect, aiController.deleteChat);

export default router;
