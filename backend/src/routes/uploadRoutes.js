import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = express.Router();
const bucketName = 'profileImages';

const getImageBucket = () => {
  if (!mongoose.connection.db) {
    throw apiError('Database is not ready', 503);
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
};

const storeImage = (file, userId) => new Promise((resolve, reject) => {
  const uploadStream = getImageBucket().openUploadStream(file.originalname, {
    contentType: file.mimetype,
    metadata: {
      contentType: file.mimetype,
      uploadedBy: userId,
    },
  });

  uploadStream.once('error', reject);
  uploadStream.once('finish', () => resolve(uploadStream.id));
  uploadStream.end(file.buffer);
});

const deleteImages = async (ids) => {
  if (!ids.length) return;

  const bucket = getImageBucket();
  await Promise.allSettled(ids.map((id) => bucket.delete(id)));
};

const imageUrl = (id) => `/uploads/images/${id}`;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension));
  },
});

// Public image handler mounted at /uploads/images/:id in index.js. Keeping the
// old URL shape means existing frontend code can display both disk and GridFS images.
export const getUploadedImage = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(apiError('Image not found', 404));
    }

    const id = new mongoose.Types.ObjectId(req.params.id);
    const bucket = getImageBucket();
    const [file] = await bucket.find({ _id: id }).limit(1).toArray();

    if (!file) {
      return next(apiError('Image not found', 404));
    }

    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': file.length,
      'Content-Type': file.contentType || file.metadata?.contentType || 'application/octet-stream',
    });

    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.once('error', (error) => {
      if (res.headersSent) {
        res.destroy(error);
        return;
      }
      next(error);
    });
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// POST /api/upload
router.post('/', protect, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return next(apiError('No file uploaded', 400));

    const id = await storeImage(req.file, req.user.id);
    return res.json(apiSuccess({ url: imageUrl(id) }, 'File uploaded'));
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/multiple
router.post('/multiple', protect, upload.array('files', 5), async (req, res, next) => {
  const uploadedIds = [];

  try {
    if (!req.files || req.files.length === 0) {
      return next(apiError('No files uploaded', 400));
    }

    for (const file of req.files) {
      uploadedIds.push(await storeImage(file, req.user.id));
    }

    const urls = uploadedIds.map(imageUrl);
    return res.json(apiSuccess({ urls }, 'Files uploaded'));
  } catch (error) {
    await deleteImages(uploadedIds);
    next(error);
  }
});

export default router;
