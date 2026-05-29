import express from 'express';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension));
  },
});

// ─── POST /api/upload ─────────────────────────────────────────────────────
router.post('/', protect, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return next(apiError('No file uploaded', 400));
    const url = `/uploads/images/${req.file.filename}`;
    return res.json(apiSuccess({ url }, 'File uploaded'));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/upload/multiple ───────────────────────────────────────────
router.post('/multiple', protect, upload.array('files', 5), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next(apiError('No files uploaded', 400));
    const urls = req.files.map(f => `/uploads/images/${f.filename}`);
    return res.json(apiSuccess({ urls }, 'Files uploaded'));
  } catch (error) {
    next(error);
  }
});

export default router;
