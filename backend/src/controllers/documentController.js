import Document from '../models/Document.js';
import Order from '../models/Order.js';
import MentorBooking from '../models/MentorBooking.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/security.js';
import mongoose from 'mongoose';

const categoryAliases = {
  se: 'software_engineering',
  software_engineering: 'software_engineering',
  marketing: 'marketing',
  communication: 'communication',
  business: 'business',
  design: 'design',
  data_science: 'data_science',
  other: 'other',
};

const categorySubjectPrefixes = {
  software_engineering: ['SWP', 'PRJ', 'DBI', 'MAD'],
  marketing: ['COM', 'MKT'],
};

const normalizeCategory = (category, subjectCode = '') => {
  const key = String(category || '').trim().toLowerCase();
  if (categoryAliases[key]) return categoryAliases[key];

  const subject = String(subjectCode || '').trim().toUpperCase();
  const matchedCategory = Object.entries(categorySubjectPrefixes).find(([, prefixes]) =>
    prefixes.some((prefix) => subject.startsWith(prefix))
  );

  return matchedCategory?.[0] || 'other';
};

const validateExternalUrl = (externalUrl) => {
  if (!externalUrl) return null;

  try {
    const url = new URL(externalUrl);
    const validHosts = ['drive.google.com', 'docs.google.com', 'www.dropbox.com', 'onedrive.live.com', 'sharepoint.com'];
    if (!validHosts.some((host) => url.hostname.includes(host))) {
      return 'Please provide a valid Google Drive, Dropbox, OneDrive, or SharePoint link';
    }
    return null;
  } catch {
    return 'Invalid URL format';
  }
};

const validateImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'Image URL must start with http:// or https://';
    }
    return null;
  } catch {
    return 'Invalid image URL format';
  }
};

const fileTypeMap = {
  pdf: 'pdf',
  doc: 'doc',
  docx: 'docx',
  jpg: 'jpg',
  jpeg: 'jpeg',
  png: 'png',
  zip: 'zip',
  rar: 'rar',
  pptx: 'pptx',
  xlsx: 'xlsx',
  txt: 'txt',
};

const mentorDocumentAccessStatuses = ['confirmed', 'in_progress', 'completed'];

const hasMentorDocumentAccess = async (user, mentorId) => {
  if (!user || !mentorId) return false;
  if (user.role === 'admin' || user._id?.toString() === String(mentorId)) return true;

  const booking = await MentorBooking.exists({
    student: user._id,
    mentor: mentorId,
    status: { $in: mentorDocumentAccessStatuses },
  });

  return Boolean(booking);
};

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
      scope,
      category,
    } = req.query;

    const query = {
      isActive: true,
      documentScope: scope === 'mentor_profile' ? 'mentor_profile' : { $in: ['marketplace', null] },
    };

    const andConditions = [];

    if (category) {
      const normalizedCategory = normalizeCategory(category);
      const legacyPrefixes = categorySubjectPrefixes[normalizedCategory] || [];
      andConditions.push({ $or: [
        { category: normalizedCategory },
        ...(legacyPrefixes.length ? [{ subjectCode: { $regex: `^(${legacyPrefixes.join('|')})`, $options: 'i' } }] : []),
      ] });
    }
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
      const escapedSearch = escapeRegex(search);
      andConditions.push({ $or: [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { subjectCode: { $regex: escapedSearch, $options: 'i' } }
      ] });
    }

    if (andConditions.length) query.$and = andConditions;

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

    if (document.documentScope === 'mentor_profile' && !(await hasMentorDocumentAccess(req.user, document.ownerMentor))) {
      return next(apiError('Bạn cần đặt lịch với mentor này để xem tài liệu', 403));
    }

    res.json(apiSuccess(document));
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const requestedScope = req.body.documentScope || 'marketplace';

    if (requestedScope === 'marketplace' && req.user.role !== 'admin') {
      return next(apiError('Only admin can create marketplace documents', 403));
    }

    if (requestedScope === 'mentor_profile' && req.user.role !== 'mentor') {
      return next(apiError('Only mentors can create mentor profile documents', 403));
    }

    const documentData = {
      ...req.body,
      author: req.user.id,
      documentScope: requestedScope,
      ownerMentor: requestedScope === 'mentor_profile' ? req.user.id : null,
    };
    const document = await Document.create(documentData);
    res.status(201).json(apiSuccess(document, 'Document created successfully'));
  } catch (error) {
    next(error);
  }
};

export const createMarketplaceDocument = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(apiError('Only admin can create marketplace documents', 403));
    }

    const { title, description, subjectCode, category, semester, price, documentType, tags, externalUrl, imageUrl } = req.body;
    const file = req.file;

    if (!subjectCode) {
      return next(apiError('Subject code is required', 400));
    }

    if (!file && !externalUrl) {
      return next(apiError('File or external URL is required', 400));
    }

    if (file && externalUrl) {
      return next(apiError('Please provide either a file OR an external URL, not both', 400));
    }

    const urlError = validateExternalUrl(externalUrl);
    if (urlError) return next(apiError(urlError, 400));

    const imageUrlError = validateImageUrl(imageUrl);
    if (imageUrlError) return next(apiError(imageUrlError, 400));

    const normalizedSubject = subjectCode.toUpperCase();
    const ext = file ? file.originalname.split('.').pop().toLowerCase() : null;

    const document = await Document.create({
      title: title || (file ? file.originalname : 'Marketplace document'),
      description,
      subjectCode: normalizedSubject,
      category: normalizeCategory(category, normalizedSubject),
      semester: semester || '1',
      author: req.user.id,
      ownerMentor: null,
      documentScope: 'marketplace',
      price: Number(price) || 0,
      isPremium: Number(price) > 0,
      fileUrl: file ? `/uploads/documents/${file.filename}` : '',
      fileName: file ? file.originalname : (title || 'External marketplace document'),
      fileType: file ? (fileTypeMap[ext] || 'pdf') : 'pdf',
      fileSize: file ? file.size : 0,
      documentType: documentType || 'pdf',
      tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      previewImages: imageUrl ? [imageUrl.trim()] : [],
      sourceType: externalUrl ? (externalUrl.includes('drive.google.com') ? 'google_drive' : 'external_link') : 'upload',
      externalUrl: externalUrl || '',
    });

    res.status(201).json(apiSuccess(document, 'Marketplace document created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMentorDocuments = async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!(await hasMentorDocumentAccess(req.user, mentorId))) {
      return res.json(apiSuccess({
        documents: [],
        restricted: true,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
      }));
    }

    const query = {
      ownerMentor: mentorId,
      documentScope: 'mentor_profile',
      isActive: true,
    };

    const [documents, total] = await Promise.all([
      Document.find(query)
        .populate('author', 'name avatar')
        .sort({ avgRating: -1, rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Document.countDocuments(query),
    ]);

    res.json(apiSuccess({
      documents,
      restricted: false,
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

export const createMentorProfileDocument = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor') {
      return next(apiError('Only mentors can upload mentor profile documents', 403));
    }

    const { title, description, subjectCode, semester, documentType, tags, externalUrl } = req.body;
    const file = req.file;

    if (!file && !externalUrl) {
      return next(apiError('File or external URL is required', 400));
    }

    if (file && externalUrl) {
      return next(apiError('Please provide either a file OR an external URL, not both', 400));
    }

    if (externalUrl) {
      try {
        const url = new URL(externalUrl);
        const validHosts = ['drive.google.com', 'docs.google.com', 'www.dropbox.com', 'onedrive.live.com', 'sharepoint.com'];
        if (!validHosts.some((host) => url.hostname.includes(host))) {
          return next(apiError('Please provide a valid Google Drive, Dropbox, OneDrive, or SharePoint link', 400));
        }
      } catch {
        return next(apiError('Invalid URL format', 400));
      }
    }

    const ext = file ? file.originalname.split('.').pop().toLowerCase() : null;
    const fileTypeMap = {
      pdf: 'pdf',
      doc: 'doc',
      docx: 'docx',
      jpg: 'jpg',
      jpeg: 'jpeg',
      png: 'png',
      zip: 'zip',
      rar: 'rar',
      pptx: 'pptx',
      xlsx: 'xlsx',
      txt: 'txt',
    };

    const document = await Document.create({
      title: title || (file ? file.originalname : 'Mentor profile document'),
      description,
      subjectCode: subjectCode?.toUpperCase?.() || '',
      semester: semester || '1',
      author: req.user.id,
      ownerMentor: req.user.id,
      documentScope: 'mentor_profile',
      price: 0,
      isPremium: false,
      fileUrl: file ? `/uploads/documents/${file.filename}` : '',
      fileName: file ? file.originalname : (title || 'External mentor document'),
      fileType: file ? (fileTypeMap[ext] || 'pdf') : 'pdf',
      fileSize: file ? file.size : 0,
      documentType: documentType || 'pdf',
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      sourceType: externalUrl ? (externalUrl.includes('drive.google.com') ? 'google_drive' : 'external_link') : 'upload',
      externalUrl: externalUrl || '',
    });

    res.status(201).json(apiSuccess(document, 'Mentor profile document created successfully'));
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

    // [SECURITY FIX] Whitelist allowed fields — prevents mass assignment attack
    // Disallows: author, isActive, documentScope, ownerMentor, downloads, salesCount, rating, etc.
    const ALLOWED_FIELDS = ['title', 'description', 'subjectCode', 'semester', 'tags', 'documentType', 'externalUrl'];
    const ADMIN_EXTRA_FIELDS = ['price', 'isPremium', 'isActive', 'isFeatured', 'category'];

    const allowedFields = req.user.role === 'admin'
      ? [...ALLOWED_FIELDS, ...ADMIN_EXTRA_FIELDS]
      : ALLOWED_FIELDS;

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'tags' && typeof req.body.tags === 'string') {
          document.tags = req.body.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        } else if (field === 'subjectCode') {
          document.subjectCode = req.body.subjectCode.toUpperCase();
        } else {
          document[field] = req.body[field];
        }
      }
    });

    if (req.body.imageUrl !== undefined) {
      const imageUrlError = validateImageUrl(req.body.imageUrl);
      if (imageUrlError) return next(apiError(imageUrlError, 400));
      document.previewImages = req.body.imageUrl ? [req.body.imageUrl.trim()] : [];
    }

    if (req.body.externalUrl !== undefined) {
      const urlError = validateExternalUrl(req.body.externalUrl);
      if (urlError) return next(apiError(urlError, 400));
      document.sourceType = req.body.externalUrl
        ? (req.body.externalUrl.includes('drive.google.com') ? 'google_drive' : 'external_link')
        : 'upload';
    }

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
    const userId = req.user?.id;

    // [SECURITY FIX] Require auth to vote on reviews
    if (!userId) {
      return next(apiError('Vui lòng đăng nhập để thực hiện hành động này', 401));
    }

    const document = await Document.findById(id);
    if (!document) {
      return next(apiError('Document not found', 404));
    }

    const review = document.reviews.id(reviewId);
    if (!review) {
      return next(apiError('Review not found', 404));
    }

    // [SECURITY FIX] Prevent spam: one vote per user per review
    if (!review.likedBy) review.likedBy = [];
    if (!review.dislikedBy) review.dislikedBy = [];

    const alreadyLiked = review.likedBy.some((uid) => uid.toString() === userId);
    const alreadyDisliked = review.dislikedBy.some((uid) => uid.toString() === userId);

    if (type === 'like') {
      if (alreadyLiked) return res.json(apiSuccess({ likes: review.likes, dislikes: review.dislikes }, 'Bạn đã vote rồi'));
      if (alreadyDisliked) {
        review.dislikedBy = review.dislikedBy.filter((uid) => uid.toString() !== userId);
        review.dislikes = Math.max(0, review.dislikes - 1);
      }
      review.likedBy.push(userId);
      review.likes += 1;
    } else {
      if (alreadyDisliked) return res.json(apiSuccess({ likes: review.likes, dislikes: review.dislikes }, 'Bạn đã vote rồi'));
      if (alreadyLiked) {
        review.likedBy = review.likedBy.filter((uid) => uid.toString() !== userId);
        review.likes = Math.max(0, review.likes - 1);
      }
      review.dislikedBy.push(userId);
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
      isActive: true,
      documentScope: { $in: ['marketplace', null] },
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
      documentScope: 'marketplace',
      $or: [{ isFeatured: true }, { rating: { $gte: 4 } }, { avgRating: { $gte: 4 } }]
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

    const documents = await Document.find({ isActive: true, documentScope: { $in: ['marketplace', null] } })
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

    const documents = await Document.find({ isActive: true, documentScope: { $in: ['marketplace', null] } })
      .populate('author', 'name avatar')
      .sort({ avgRating: -1, rating: -1, reviewCount: -1, totalReviews: -1, downloads: -1 })
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

    // [SECURITY FIX] Block premium document download without payment
    if (document.isPremium && document.price > 0) {
      const hasPurchased = await Order.findOne({
        user: req.user.id,
        'documents.document': id,
        paymentStatus: 'paid',
      });

      const isOwnerOrAdmin = document.author.toString() === req.user.id || req.user.role === 'admin';

      if (!hasPurchased && !isOwnerOrAdmin) {
        return next(apiError('Bạn cần mua tài liệu này trước khi tải xuống', 403));
      }
    }

    if (document.documentScope === 'mentor_profile' && !(await hasMentorDocumentAccess(req.user, document.ownerMentor))) {
      return next(apiError('Bạn cần đặt lịch với mentor này để tải tài liệu', 403));
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
