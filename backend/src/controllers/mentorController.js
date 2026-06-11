import User from '../models/User.js';
import MentorBooking from '../models/MentorBooking.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import { escapeRegex } from '../utils/security.js';

const mentorSelect = '-password -refreshToken';

const promotedSort = (sortBy, order) => ({
  'mentorProfile.promotion.isPromoted': -1,
  'mentorProfile.promotion.priorityScore': -1,
  [sortBy === 'rating' ? 'mentorProfile.documentRating' : sortBy]: order === 'asc' ? 1 : -1,
  'mentorProfile.documentReviewCount': -1,
});

const validTemplateLevels = ['beginner', 'intermediate', 'advanced'];

const normalizeTemplateLevel = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return validTemplateLevels.includes(normalized) ? normalized : 'intermediate';
};

const clampGpa = (value) => {
  const gpa = Number(value);
  if (!Number.isFinite(gpa)) return 0;
  return Math.min(4, Math.max(0, gpa));
};

const sanitizeExerciseTemplates = (templates = []) => (
  Array.isArray(templates)
    ? templates.map((template) => ({
        ...template,
        title: String(template?.title || '').trim(),
        subjectCode: String(template?.subjectCode || '').trim(),
        level: normalizeTemplateLevel(template?.level),
        url: String(template?.url || '').trim(),
        description: String(template?.description || '').trim(),
      }))
    : []
);

export const getMentors = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      subject,
      minPrice,
      maxPrice,
      sortBy = 'rating',
      order = 'desc',
      search,
      isAvailable,
      promotedOnly,
    } = req.query;

    const query = { role: 'mentor', 'mentorProfile.isAvailable': true };

    if (subject) query['mentorProfile.expertise'] = { $in: [subject.toUpperCase()] };
    if (minPrice) query['mentorProfile.pricePerHour'] = { $gte: Number(minPrice) };
    if (maxPrice) query['mentorProfile.pricePerHour'] = { ...query['mentorProfile.pricePerHour'], $lte: Number(maxPrice) };
    if (isAvailable !== undefined) query['mentorProfile.isAvailable'] = isAvailable === 'true';
    if (promotedOnly === 'true') {
      query['mentorProfile.promotion.isPromoted'] = true;
      query['mentorProfile.promotion.paidUntil'] = { $gte: new Date() };
    }
    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { 'mentorProfile.title': { $regex: escapedSearch, $options: 'i' } },
        { 'mentorProfile.expertise': { $regex: escapedSearch, $options: 'i' } },
        { 'mentorProfile.major': { $regex: escapedSearch, $options: 'i' } },
        { 'mentorProfile.projects.title': { $regex: escapedSearch, $options: 'i' } },
        { 'mentorProfile.achievements.title': { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const sortOption = promotedSort(sortBy, order);
    const skip = (Number(page) - 1) * Number(limit);

    const [mentors, total] = await Promise.all([
      User.find(query)
        .select(mentorSelect)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json(apiSuccess({
      mentors,
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

export const getMentorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mentor = await User.findOne({ _id: id, role: 'mentor' })
      .select(mentorSelect);

    if (!mentor) {
      return next(apiError('Mentor not found', 404));
    }

    const totalBookings = await MentorBooking.countDocuments({
      mentor: id,
      status: 'completed'
    });

    const recentReviews = await MentorBooking.find({
      mentor: id,
      status: 'completed',
      rating: { $exists: true }
    })
      .populate('student', 'name avatar role')
      .sort({ updatedAt: -1 })
      .limit(8);

    res.json(apiSuccess({
      mentor,
      stats: {
        totalBookings,
        totalSessions: mentor.mentorProfile?.totalSessions || 0,
        averageRating: mentor.mentorProfile?.rating || 0
      },
      recentReviews
    }));
  } catch (error) {
    next(error);
  }
};

export const updateMentorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }

    const mentor = await User.findOne({ _id: id, role: 'mentor' });

    if (!mentor) {
      return next(apiError('Mentor not found', 404));
    }

    const allowedFields = [
      'mentorProfile.title',
      'mentorProfile.bio',
      'mentorProfile.expertise',
      'mentorProfile.gpa',
      'mentorProfile.major',
      'mentorProfile.passedSubjects',
      'mentorProfile.experience',
      'mentorProfile.achievements',
      'mentorProfile.demoMaterials',
      'mentorProfile.exerciseTemplates',
      'mentorProfile.projects',
      'mentorProfile.pricePerHour',
      'mentorProfile.availability',
      'mentorProfile.isAvailable',
      'avatar',
      'name'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'mentorProfile.gpa') {
          updates[key] = clampGpa(req.body[key]);
        } else if (key === 'mentorProfile.exerciseTemplates') {
          updates[key] = sanitizeExerciseTemplates(req.body[key]);
        } else if (key === 'mentorProfile.pricePerHour') {
          updates[key] = Math.max(0, Number(req.body[key]) || 0);
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    mentor.set(updates);
    await mentor.save();

    res.json(apiSuccess(mentor, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const activatePromotion = async (req, res, next) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
      return next(apiError('Only mentors can promote their profile', 403));
    }

    const {
      mentorId = req.user.id,
      days = 7,
      priorityScore = 100,
      campaignName = 'Mentor search boost',
    } = req.body;

    if (mentorId !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) return next(apiError('Mentor not found', 404));

    const paidUntil = new Date();
    paidUntil.setDate(paidUntil.getDate() + Math.max(1, Number(days)));

    mentor.set({
      'mentorProfile.promotion.isPromoted': true,
      'mentorProfile.promotion.priorityScore': Number(priorityScore) || 100,
      'mentorProfile.promotion.paidUntil': paidUntil,
      'mentorProfile.promotion.campaignName': campaignName,
    });
    await mentor.save();

    res.json(apiSuccess({
      mentor,
      promotion: mentor.mentorProfile.promotion,
    }, 'Promotion activated'));
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { mentorId, subject, topic, date, startTime, endTime, notes } = req.body;

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });

    if (!mentor) {
      return next(apiError('Mentor not found', 404));
    }

    if (!mentor.mentorProfile?.isAvailable) {
      return next(apiError('Mentor is not available', 400));
    }

    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = (endHour - startHour) * 60;

    const price = (mentor.mentorProfile.pricePerHour / 60) * duration;

    const booking = await MentorBooking.create({
      mentor: mentorId,
      student: req.user.id,
      subject,
      topic,
      date,
      startTime,
      endTime,
      duration,
      price,
      notes
    });

    res.status(201).json(apiSuccess(booking, 'Booking created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { status, role = 'student' } = req.query;
    const userId = role === 'mentor' ? { mentor: req.user.id } : { student: req.user.id };

    const query = { ...userId };
    if (status) query.status = status;

    const bookings = await MentorBooking.find(query)
      .populate('mentor', 'name avatar mentorProfile')
      .populate('student', 'name avatar')
      .sort({ date: -1, createdAt: -1 });

    res.json(apiSuccess(bookings));
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, meetingLink, cancellationReason } = req.body;

    const booking = await MentorBooking.findById(id);

    if (!booking) {
      return next(apiError('Booking not found', 404));
    }

    const isAuthorized = 
      booking.mentor.toString() === req.user.id ||
      booking.student.toString() === req.user.id ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return next(apiError('Not authorized', 403));
    }

    booking.status = status;

    if (status === 'confirmed' && meetingLink) {
      booking.meetingLink = meetingLink;
    }

    if (status === 'cancelled') {
      booking.cancelledBy = req.user.id;
      booking.cancellationReason = cancellationReason;
    }

    if (status === 'completed') {
      const mentor = await User.findById(booking.mentor);
      mentor.mentorProfile.totalSessions += 1;
      await mentor.save();

      const mentorBookings = await MentorBooking.find({
        mentor: booking.mentor,
        status: 'completed',
        rating: { $exists: true }
      });

      if (mentorBookings.length > 0) {
        const avgRating = mentorBookings.reduce((sum, b) => sum + b.rating, 0) / mentorBookings.length;
        mentor.mentorProfile.rating = Number(avgRating.toFixed(1));
        mentor.mentorProfile.totalReviews = mentorBookings.length;
        await mentor.save();
      }
    }

    await booking.save();

    res.json(apiSuccess(booking, `Booking ${status}`));
  } catch (error) {
    next(error);
  }
};

export const addBookingReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const booking = await MentorBooking.findById(id);

    if (!booking) {
      return next(apiError('Booking not found', 404));
    }

    if (booking.student.toString() !== req.user.id) {
      return next(apiError('Only students can review bookings', 403));
    }

    if (booking.status !== 'completed') {
      return next(apiError('Can only review completed bookings', 400));
    }

    if (booking.rating) {
      return next(apiError('Already reviewed this booking', 400));
    }

    booking.rating = rating;
    booking.review = { comment, createdAt: new Date() };
    await booking.save();

    const mentor = await User.findById(booking.mentor);
    const allReviews = await MentorBooking.find({
      mentor: booking.mentor,
      status: 'completed',
      rating: { $exists: true }
    });

    const avgRating = allReviews.reduce((sum, b) => sum + b.rating, 0) / allReviews.length;
    mentor.mentorProfile.rating = Number(avgRating.toFixed(1));
    mentor.mentorProfile.totalReviews = allReviews.length;
    await mentor.save();

    res.json(apiSuccess(booking, 'Review added successfully'));
  } catch (error) {
    next(error);
  }
};

export const getMentorReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      MentorBooking.find({ mentor: id, status: 'completed', rating: { $exists: true } })
        .populate('student', 'name avatar role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MentorBooking.countDocuments({ mentor: id, status: 'completed', rating: { $exists: true } }),
    ]);

    res.json(apiSuccess({
      reviews: reviews.map(booking => ({
        _id: booking._id,
        user: booking.student,
        rating: booking.rating,
        comment: booking.review?.comment || '',
        createdAt: booking.review?.createdAt || booking.updatedAt,
      })),
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

export const addMentorReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment = '', bookingId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return next(apiError('Rating must be 1-5', 400));
    }

    const mentor = await User.findOne({ _id: id, role: 'mentor' });
    if (!mentor) return next(apiError('Mentor not found', 404));

    const bookingQuery = {
      mentor: id,
      student: req.user.id,
      status: 'completed',
    };
    if (bookingId) bookingQuery._id = bookingId;

    const booking = await MentorBooking.findOne(bookingQuery);
    if (!booking) {
      return next(apiError('You need a completed mentor session before reviewing', 403));
    }

    if (booking.rating) return next(apiError('You already reviewed this session', 400));

    booking.rating = rating;
    booking.review = { comment: comment.trim(), createdAt: new Date() };
    await booking.save();
    await recalcMentorRating(id);

    const populated = await MentorBooking.findById(booking._id).populate('student', 'name avatar role');
    res.status(201).json(apiSuccess({
      _id: populated._id,
      user: populated.student,
      rating: populated.rating,
      comment: populated.review?.comment || '',
      createdAt: populated.review?.createdAt || populated.updatedAt,
    }, 'Mentor review created'));
  } catch (error) {
    next(error);
  }
};

export const getMentorSuggestions = async (req, res, next) => {
  try {
    const user = req.user ? await User.findById(req.user.id).select(mentorSelect) : null;
    const signals = new Set();

    if (user?.role === 'student') {
      (user.studentProfile?.passedSubjects || []).forEach(subject => signals.add(subject));
      if (user.studentProfile?.faculty) signals.add(user.studentProfile.faculty);
    }

    if (user?.role === 'mentor') {
      (user.mentorProfile?.expertise || []).forEach(subject => signals.add(subject));
      if (user.mentorProfile?.major) signals.add(user.mentorProfile.major);
    }

    const signalList = [...signals].filter(Boolean);
    const query = { role: 'mentor', 'mentorProfile.isAvailable': true };
    if (user?.role === 'mentor') query._id = { $ne: user._id };
    if (signalList.length > 0) {
      const escapedPattern = signalList.map(s => escapeRegex(String(s))).join('|');
      query.$or = [
        { 'mentorProfile.expertise': { $in: signalList.map(s => String(s).toUpperCase()) } },
        { 'mentorProfile.major': { $in: signalList } },
        { 'mentorProfile.title': { $regex: escapedPattern, $options: 'i' } },
      ];
    }

    let mentors = await User.find(query)
      .select(mentorSelect)
      .sort(promotedSort('rating', 'desc'))
      .limit(8);

    if (mentors.length < 4) {
      mentors = await User.find({ role: 'mentor', 'mentorProfile.isAvailable': true, ...(user?.role === 'mentor' ? { _id: { $ne: user._id } } : {}) })
        .select(mentorSelect)
        .sort(promotedSort('rating', 'desc'))
        .limit(8);
    }

    res.json(apiSuccess({ mentors, signals: signalList }));
  } catch (error) {
    next(error);
  }
};

export const getTopMentors = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const mentors = await User.find({ role: 'mentor', 'mentorProfile.isAvailable': true })
      .select(mentorSelect)
      .sort({
        'mentorProfile.promotion.isPromoted': -1,
        'mentorProfile.promotion.priorityScore': -1,
        'mentorProfile.documentRating': -1,
        'mentorProfile.documentReviewCount': -1,
        'mentorProfile.totalSessions': -1,
      })
      .limit(Number(limit));

    res.json(apiSuccess(mentors));
  } catch (error) {
    next(error);
  }
};

async function recalcMentorRating(mentorId) {
  const stats = await MentorBooking.aggregate([
    { $match: { mentor: new mongoose.Types.ObjectId(mentorId), status: 'completed', rating: { $exists: true } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await User.findByIdAndUpdate(mentorId, {
    'mentorProfile.rating': stats[0]?.avgRating ? Number(stats[0].avgRating.toFixed(1)) : 0,
    'mentorProfile.totalReviews': stats[0]?.count || 0,
  });
}
