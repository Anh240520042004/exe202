import express from 'express';
import { protect, admin, mentor } from '../middleware/auth.js';
import * as courseController from '../controllers/courseController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
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
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Public routes
router.get('/', courseController.getCourses);
router.get('/popular', courseController.getPopularSubjects);
router.get('/:code', courseController.getCourseByCode);

// Mentor routes - manage own courses
router.get('/mentor/my-courses', protect, mentor, courseController.getMyCourses);
router.post('/', protect, mentor, courseController.createCourse);
router.put('/:code', protect, mentor, courseController.updateCourse);
router.delete('/:code', protect, mentor, courseController.deleteCourse);

// Document management within course
// File upload is optional - can add document with external URL instead
router.post('/:code/documents', protect, mentor, upload.single('file'), courseController.addDocumentToCourse);
router.put('/:code/documents/:docId', protect, mentor, upload.single('file'), courseController.updateCourseDocument);
router.delete('/:code/documents/:docId', protect, mentor, courseController.removeDocumentFromCourse);

// Admin routes (for management)
router.post('/admin', protect, admin, courseController.createCourse);
router.put('/admin/:code', protect, admin, courseController.updateCourse);
router.delete('/admin/:code', protect, admin, courseController.deleteCourse);

export default router;
