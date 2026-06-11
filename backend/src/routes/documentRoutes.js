import express from 'express';
import multer from 'multer';
import path from 'path';
import { admin, optionalAuth, protect } from '../middleware/auth.js';
import * as documentController from '../controllers/documentController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/zip',
      'application/x-rar-compressed',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

router.get('/', documentController.getDocuments);
router.get('/featured', documentController.getFeaturedDocuments);
router.get('/popular', documentController.getPopularDocuments);
router.get('/top-rated', documentController.getTopRatedDocuments);
router.get('/subject/:subjectCode', documentController.getDocumentsBySubject);
router.get('/mentor/:mentorId', optionalAuth, documentController.getMentorDocuments);
router.get('/favorites', protect, documentController.getUserFavorites);
router.get('/download-history', protect, documentController.getDownloadHistory);

router.post('/', protect, documentController.createDocument);
router.post('/marketplace', protect, admin, upload.single('file'), documentController.createMarketplaceDocument);
router.post('/mentor-profile', protect, upload.single('file'), documentController.createMentorProfileDocument);
router.post('/favorites', protect, documentController.addToFavorites);

router.get('/:id', optionalAuth, documentController.getDocumentById);
router.get('/:id/download', protect, documentController.downloadDocument);
router.post('/:id/reviews', protect, documentController.addReview);
router.put('/:id', protect, documentController.updateDocument);
router.put('/:id/reviews/:reviewId/like', protect, documentController.likeReview);
router.delete('/:id', protect, documentController.deleteDocument);

export default router;
