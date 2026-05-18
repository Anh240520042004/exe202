import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import * as mentorController from '../controllers/mentorController.js';

const router = express.Router();

router.get('/', mentorController.getMentors);
router.get('/top', mentorController.getTopMentors);
router.get('/:id', mentorController.getMentorById);

router.post('/', protect, mentorController.createBooking);
router.post('/:id/review', protect, mentorController.addBookingReview);

router.get('/bookings/list', protect, mentorController.getBookings);
router.put('/bookings/:id/status', protect, mentorController.updateBookingStatus);

router.put('/:id/profile', protect, mentorController.updateMentorProfile);

export default router;
