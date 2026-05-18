import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'dark',
      },
      language: {
        type: String,
        default: 'vi',
      },
      currency: {
        type: String,
        default: 'VND',
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        transactionAlerts: { type: Boolean, default: true },
      },
      privacy: {
        showBalance: { type: Boolean, default: true },
        showTransactions: { type: Boolean, default: true },
      },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      lastPasswordChange: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
