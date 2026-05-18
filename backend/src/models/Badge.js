import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏆'
  },
  category: {
    type: String,
    enum: ['academic', 'streak', 'social', 'mentor', 'purchase'],
    default: 'academic'
  },
  requirement: {
    type: {
      type: String,
      enum: ['gpa', 'streak', 'downloads', 'mentor_sessions', 'purchases', 'reviews', 'xp', 'level']
    },
    value: Number,
    description: String
  },
  xpReward: {
    type: Number,
    default: 100
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

badgeSchema.index({ code: 1 });
badgeSchema.index({ category: 1 });

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
