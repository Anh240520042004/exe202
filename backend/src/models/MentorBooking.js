import mongoose from 'mongoose';

const mentorBookingSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 30
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'declined'],
    default: 'pending'
  },
  meetingLink: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    comment: String,
    createdAt: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, {
  timestamps: true
});

mentorBookingSchema.index({ mentor: 1, status: 1 });
mentorBookingSchema.index({ student: 1 });
mentorBookingSchema.index({ date: 1 });

const MentorBooking = mongoose.model('MentorBooking', mentorBookingSchema);

export default MentorBooking;
