import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const availabilitySlotSchema = new mongoose.Schema(
  {
    start: {
      type: String,
    },
    end: {
      type: String,
    },
    booked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    avatar: {
      type: String,
      default: '',
    },

    role: {
      type: String,
      enum: ['student', 'mentor', 'admin'],
      default: 'student',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    // Email verification
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpire: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },

    lastLogin: {
      type: Date,
    },

    // Activity log
    activities: [{
      type: {
        type: String,
        enum: ['login', 'profile_update', 'password_change', 'download', 'purchase', 'mentor_booking', 'badge_earned'],
      },
      description: String,
      metadata: mongoose.Schema.Types.Mixed,
      createdAt: { type: Date, default: Date.now }
    }],

    // =========================
    // Student Profile
    // =========================
    studentProfile: {
      studentId: {
        type: String,
        trim: true,
      },

      gpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 4,
      },

      faculty: {
        type: String,
        trim: true,
      },

      passedSubjects: [
        {
          type: String,
          trim: true,
        },
      ],

      studyStreak: {
        type: Number,
        default: 0,
      },

      lastStudyDate: {
        type: Date,
      },

      xp: {
        type: Number,
        default: 0,
      },

      level: {
        type: Number,
        default: 1,
      },

      favoriteDocuments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
      ],

      favoriteMentors: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],

      downloadHistory: [
        {
          document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
          },

          downloadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      bookedMentors: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],

      badges: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Badge',
        },
      ],

      achievements: [
        {
          badgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Badge',
          },

          earnedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      rewardPoints: {
        type: Number,
        default: 0,
      },

      rewardPointsClaimedMilestones: {
        streaks: { type: [Number], default: [] },
        levels: { type: [Number], default: [] },
        xpMilestones: { type: [Number], default: [] },
      },
    },

    // =========================
    // Mentor Profile
    // =========================
    mentorProfile: {
      title: {
        type: String,
        trim: true,
      },

      expertise: [
        {
          type: String,
          trim: true,
        },
      ],

      bio: {
        type: String,
      },

      gpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 4,
      },

      major: {
        type: String,
        trim: true,
      },

      passedSubjects: [
        {
          type: String,
          trim: true,
        },
      ],

      experience: {
        type: String,
      },

      pricePerHour: {
        type: Number,
        default: 0,
      },

      rating: {
        type: Number,
        default: 0,
      },

      totalReviews: {
        type: Number,
        default: 0,
      },

      availability: {
        type: Map,
        of: [availabilitySlotSchema],
        default: {},
      },

      isAvailable: {
        type: Boolean,
        default: true,
      },

      totalSessions: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// Hash password before save
// =========================
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// =========================
// Compare password
// =========================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// =========================
// Email verification token
// =========================
userSchema.methods.getEmailVerificationToken = function () {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  this.emailVerificationToken = verificationCode;
  this.emailVerificationExpire = Date.now() + 5 * 60 * 1000; // 5 minutes

  return verificationCode;
};

userSchema.methods.verifyEmailCode = function (code) {
  if (!this.emailVerificationToken || !this.emailVerificationExpire) {
    return false;
  }
  
  if (Date.now() > this.emailVerificationExpire) {
    return false;
  }
  
  return this.emailVerificationToken === code;
};

// =========================
// Reset password token
// =========================
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;