import Document from '../models/Document.js';
import Order from '../models/Order.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import mongoose from 'mongoose';

export const getDocuments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      subjectCode,
      semester,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc',
      search,
      type,
      isPremium,
    } = req.query;

    const query = { isActive: true };

    if (subjectCode) query.subjectCode = subjectCode.toUpperCase();
    if (semester) query.semester = semester;
    if (type) query.documentType = type;
    if (isPremium !== undefined) query.isPremium = isPremium === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      query.$or = [
        { title: { $regex: searchLower, $options: 'i' } },
        { description: { $regex: searchLower, $options: 'i' } },
        { subjectCode: { $regex: searchLower, $options: 'i' } }
      ];
    }

    console.log('Final query:', JSON.stringify(query));

    const sortOption = { [sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('author', 'name avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Document.countDocuments(query),
    ]);

    console.log('Found documents:', documents.length, 'total:', total);

    res.json(apiSuccess({
      documents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id)
      .populate('author', 'name avatar');

    if (!document) {
      return next(apiError('Document not found', 404));
    }

    res.json(apiSuccess(document));
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const documentData = {
      ...req.body,
      author: req.user.id,
    };
    const document = await Document.create(documentData);
    res.status(201).json(apiSuccess(document, 'Document created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return next(apiError('Document not found', 404));
    }

    if (document.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized to update this document', 403));
    }

    Object.assign(document, req.body);
    await document.save();

    res.json(apiSuccess(document, 'Document updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return next(apiError('Document not found', 404));
    }

    if (document.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized to delete this document', 403));
    }

    document.isActive = false;
    await document.save();

    res.json(apiSuccess(null, 'Document deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return next(apiError('Document not found', 404));
    }

    const existingReview = document.reviews.find(
      r => r.user.toString() === req.user.id
    );

    if (existingReview) {
      return next(apiError('You have already reviewed this document', 400));
    }

    const order = await Order.findOne({
      user: req.user.id,
      'documents.document': id,
      paymentStatus: 'paid',
    });

    const isVerified = !!order;

    document.reviews.push({
      user: req.user.id,
      rating,
      comment,
      isVerified,
    });

    const totalRating = document.reviews.reduce((sum, r) => sum + r.rating, 0);
    document.rating = Number((totalRating / document.reviews.length).toFixed(1));
    document.totalReviews = document.reviews.length;

    await document.save();

    res.status(201).json(apiSuccess(document.reviews[document.reviews.length - 1], 'Review added successfully'));
  } catch (error) {
    next(error);
  }
};

export const likeReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const { type } = req.query;

    const document = await Document.findById(id);
    if (!document) {
      return next(apiError('Document not found', 404));
    }

    const review = document.reviews.id(reviewId);
    if (!review) {
      return next(apiError('Review not found', 404));
    }

    if (type === 'like') {
      review.likes += 1;
    } else {
      review.dislikes += 1;
    }

    await document.save();
    res.json(apiSuccess({ likes: review.likes, dislikes: review.dislikes }));
  } catch (error) {
    next(error);
  }
};

export const getDocumentsBySubject = async (req, res, next) => {
  try {
    const { subjectCode } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const query = { 
      subjectCode: subjectCode.toUpperCase(), 
      isActive: true 
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('author', 'name avatar')
        .sort({ rating: -1, downloads: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Document.countDocuments(query),
    ]);

    res.json(apiSuccess({
      documents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
};

export const getFeaturedDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ 
      isActive: true,
      $or: [{ isFeatured: true }, { rating: { $gte: 4 } }]
    })
      .populate('author', 'name avatar')
      .sort({ rating: -1, downloads: -1 })
      .limit(8);

    res.json(apiSuccess(documents));
  } catch (error) {
    next(error);
  }
};

export const getPopularDocuments = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const documents = await Document.find({ isActive: true })
      .populate('author', 'name avatar')
      .sort({ downloads: -1, salesCount: -1 })
      .limit(Number(limit));

    res.json(apiSuccess(documents));
  } catch (error) {
    next(error);
  }
};

export const getTopRatedDocuments = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const documents = await Document.find({ isActive: true })
      .populate('author', 'name avatar')
      .sort({ rating: -1, avgRating: -1, totalReviews: -1, reviewCount: -1, downloads: -1 })
      .limit(Number(limit));

    res.json(apiSuccess(documents));
  } catch (error) {
    next(error);
  }
};

export const getUserFavorites = async (req, res, next) => {
  try {
    const user = await mongoose.model('User').findById(req.user.id)
      .populate({
        path: 'studentProfile.favoriteDocuments',
        populate: { path: 'author', select: 'name avatar' }
      });

    res.json(apiSuccess(user.studentProfile?.favoriteDocuments || []));
  } catch (error) {
    next(error);
  }
};

export const addToFavorites = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    const user = await mongoose.model('User').findById(req.user.id);

    if (!user.studentProfile) {
      user.studentProfile = {};
    }

    const isFavorited = user.studentProfile.favoriteDocuments?.some(
      id => id.toString() === documentId
    );

    if (isFavorited) {
      user.studentProfile.favoriteDocuments = user.studentProfile.favoriteDocuments.filter(
        id => id.toString() !== documentId
      );
      await user.save();
      return res.json(apiSuccess(null, 'Removed from favorites'));
    }

    user.studentProfile.favoriteDocuments.push(documentId);
    await user.save();

    res.json(apiSuccess(null, 'Added to favorites'));
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return next(apiError('Document not found', 404));
    }

    if (!document.isActive) {
      return next(apiError('Document is no longer available', 404));
    }

    // Update download count on document
    document.downloads += 1;
    await document.save();

    // Add to user's download history
    const user = await mongoose.model('User').findById(req.user.id);
    if (!user.studentProfile) {
      user.studentProfile = {};
    }
    if (!user.studentProfile.downloadHistory) {
      user.studentProfile.downloadHistory = [];
    }

    // Add to history with full document info
    user.studentProfile.downloadHistory.unshift({
      document: document._id,
      downloadedAt: new Date()
    });

    // Keep only last 100 downloads
    if (user.studentProfile.downloadHistory.length > 100) {
      user.studentProfile.downloadHistory = user.studentProfile.downloadHistory.slice(0, 100);
    }

    // Update activity
    user.activities = user.activities || [];
    user.activities.push({
      type: 'download',
      description: `Tải tài liệu: ${document.title}`,
      metadata: { documentId: document._id, title: document.title },
      createdAt: new Date()
    });

    await user.save();

    // Return download URL or file
    if (document.fileUrl) {
      // If fileUrl is a full URL, return it
      if (document.fileUrl.startsWith('http')) {
        return res.json(apiSuccess({
          downloadUrl: document.fileUrl,
          fileName: document.fileName,
          fileSize: document.fileSize
        }));
      }
      // Otherwise return the internal path
      return res.json(apiSuccess({
        downloadUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize
      }));
    }

    res.json(apiSuccess({
      message: 'Download tracked successfully'
    }));
  } catch (error) {
    next(error);
  }
};

export const getDownloadHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const user = await mongoose.model('User').findById(req.user.id)
      .populate({
        path: 'studentProfile.downloadHistory.document',
        populate: { path: 'author', select: 'name avatar' }
      });

    if (!user || !user.studentProfile?.downloadHistory) {
      return res.json(apiSuccess({ downloads: [], pagination: { page: 1, total: 0, pages: 0 } }));
    }

    const history = user.studentProfile.downloadHistory;
    const total = history.length;
    const skip = (Number(page) - 1) * Number(limit);

    const paginatedHistory = history.slice(skip, skip + Number(limit));

    res.json(apiSuccess({
      downloads: paginatedHistory,
      stats: {
        totalDownloads: total,
        thisMonth: history.filter(h => {
          const date = new Date(h.downloadedAt);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error) {
    next(error);
  }
};
