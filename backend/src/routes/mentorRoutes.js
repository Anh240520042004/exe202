import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import * as mentorController from '../controllers/mentorController.js';

const router = express.Router();

router.get('/', mentorController.getMentors);
router.get('/top', mentorController.getTopMentors);
router.get('/suggestions', optionalAuth, mentorController.getMentorSuggestions);
router.get('/bookings/list', protect, mentorController.getBookings);
router.put('/bookings/:id/status', protect, mentorController.updateBookingStatus);
router.post('/bookings/:id/review', protect, mentorController.addBookingReview);
router.post('/me/promotion', protect, mentorController.activatePromotion);

router.post('/', protect, mentorController.createBooking);

router.put('/:id/profile', protect, mentorController.updateMentorProfile);
router.get('/:id/reviews', mentorController.getMentorReviews);
router.post('/:id/reviews', protect, mentorController.addMentorReview);
router.get('/:id', mentorController.getMentorById);

export default router;
