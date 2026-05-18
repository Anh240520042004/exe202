import User from '../models/User.js';
import MentorBooking from '../models/MentorBooking.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

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
    } = req.query;

    const query = { role: 'mentor', 'mentorProfile.isAvailable': true };

    if (subject) query['mentorProfile.expertise'] = { $in: [subject.toUpperCase()] };
    if (minPrice) query['mentorProfile.pricePerHour'] = { $gte: Number(minPrice) };
    if (maxPrice) query['mentorProfile.pricePerHour'] = { ...query['mentorProfile.pricePerHour'], $lte: Number(maxPrice) };
    if (isAvailable !== undefined) query['mentorProfile.isAvailable'] = isAvailable === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'mentorProfile.title': { $regex: search, $options: 'i' } },
        { 'mentorProfile.expertise': { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption = { [sortBy === 'rating' ? 'mentorProfile.rating' : sortBy]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [mentors, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
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
      .select('-password -refreshToken');

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
      .populate('student', 'name avatar')
      .sort({ updatedAt: -1 })
      .limit(5);

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
      'mentorProfile.pricePerHour',
      'mentorProfile.availability',
      'mentorProfile.isAvailable',
      'avatar',
      'name'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(mentor, updates);
    await mentor.save();

    res.json(apiSuccess(mentor, 'Profile updated successfully'));
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

export const getTopMentors = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const mentors = await User.find({ role: 'mentor', 'mentorProfile.isAvailable': true })
      .select('-password -refreshToken')
      .sort({ 'mentorProfile.rating': -1, 'mentorProfile.totalSessions': -1 })
      .limit(Number(limit));

    res.json(apiSuccess(mentors));
  } catch (error) {
    next(error);
  }
};
