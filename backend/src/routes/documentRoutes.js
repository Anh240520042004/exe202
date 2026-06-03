import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import * as documentController from '../controllers/documentController.js';

const router = express.Router();

router.get('/', documentController.getDocuments);
router.get('/featured', documentController.getFeaturedDocuments);
router.get('/popular', documentController.getPopularDocuments);
router.get('/top-rated', documentController.getTopRatedDocuments);
router.get('/subject/:subjectCode', documentController.getDocumentsBySubject);
router.get('/favorites', protect, documentController.getUserFavorites);
router.get('/download-history', protect, documentController.getDownloadHistory);
router.get('/:id', documentController.getDocumentById);

// Download route - serves file and tracks history
router.get('/:id/download', protect, documentController.downloadDocument);

router.post('/', protect, documentController.createDocument);
router.post('/favorites', protect, documentController.addToFavorites);
router.post('/:id/reviews', protect, documentController.addReview);

router.put('/:id', protect, documentController.updateDocument);
router.put('/:id/reviews/:reviewId/like', protect, documentController.likeReview);

router.delete('/:id', protect, documentController.deleteDocument);

export default router;
