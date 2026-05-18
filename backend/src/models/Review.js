import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['document', 'mentor'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['Document', 'MentorBooking'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: '',
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
