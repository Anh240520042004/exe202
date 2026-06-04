import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'mentor'],
    default: 'student',
  },
  emailVerificationToken: {
    type: String,
    required: true,
    select: false,
  },
  emailVerificationExpire: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

pendingRegistrationSchema.index({ emailVerificationExpire: 1 }, { expireAfterSeconds: 0 });

const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);

export default PendingRegistration;
