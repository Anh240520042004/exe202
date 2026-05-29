import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Document from '../models/Document.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const router = express.Router();

// ─── GET /api/documents/:docId/reviews ──────────────────────────────────
router.get('/documents/:docId/reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const docId = new mongoose.Types.ObjectId(req.params.docId);

    const [reviews, total, stats, distribution] = await Promise.all([
      Review.find({ document: req.params.docId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit))
        .populate('user', 'name avatar')
        .lean(),
      Review.countDocuments({ document: req.params.docId, isDeleted: false }),
      Review.aggregate([
        { $match: { document: docId, isDeleted: false } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { document: docId, isDeleted: false } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const avgRating = stats[0]?.avgRating ? Number(stats[0].avgRating.toFixed(1)) : 0;
    const count = stats[0]?.count || 0;
    const ratingDist = [5, 4, 3, 2, 1].map(n => {
      const found = distribution.find(d => d._id === n);
      return { rating: n, count: found?.count || 0 };
    });

    return res.json(apiSuccess({
      reviews,
      avgRating,
      reviewCount: count,
      ratingDist,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/documents/:docId/reviews ─────────────────────────────────
router.post('/documents/:docId/reviews', protect, async (req, res, next) => {
  try {
    const { rating, comment = '' } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return next(apiError('Rating must be 1-5', 400));
    }

    const purchased = await Order.findOne({
      user: req.user.id,
      'items.document': req.params.docId,
      paymentStatus: 'paid',
    });
    if (!purchased) return next(apiError('You must purchase this document to review', 403));

    const existing = await Review.findOne({ document: req.params.docId, user: req.user.id });
    if (existing) return next(apiError('You already reviewed this document', 400));

    const review = await Review.create({
      document: req.params.docId,
      user: req.user.id,
      rating,
      comment: comment.trim(),
    });

    await recalcDocumentRating(req.params.docId);

    const populated = await Review.findById(review._id).populate('user', 'name avatar').lean();
    return res.status(201).json(apiSuccess(populated, 'Review created'));
  } catch (error) {
    next(error);
  }
});

// ─── PUT /api/reviews/:id ───────────────────────────────────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.isDeleted) return next(apiError('Review not found', 404));
    if (review.user.toString() !== req.user.id) return next(apiError('Not authorized', 403));

    const { rating, comment } = req.body;
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment.trim();
    await review.save();

    await recalcDocumentRating(review.document);

    const populated = await Review.findById(review._id).populate('user', 'name avatar').lean();
    return res.json(apiSuccess(populated, 'Review updated'));
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/reviews/:id ─────────────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.isDeleted) return next(apiError('Review not found', 404));
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }

    const docId = review.document;
    review.isDeleted = true;
    await review.save();

    await recalcDocumentRating(docId);

    return res.json(apiSuccess(null, 'Review deleted'));
  } catch (error) {
    next(error);
  }
});

async function recalcDocumentRating(docId) {
  const stats = await Review.aggregate([
    { $match: { document: docId, isDeleted: false } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats[0]) {
    await Document.findByIdAndUpdate(docId, {
      avgRating: Number(stats[0].avgRating.toFixed(1)),
      reviewCount: stats[0].count,
    });
  } else {
    await Document.findByIdAndUpdate(docId, { avgRating: 0, reviewCount: 0 });
  }
}

export default router;
