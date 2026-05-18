import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  faculty: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['software_engineering', 'marketing', 'communication', 'business', 'design', 'data_science', 'other'],
    default: 'software_engineering'
  },
  semester: {
    type: String,
    enum: ['1', '2', '3', 'summer'],
    default: '1'
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  documentCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  totalDownloads: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

courseSchema.index({ code: 'text', name: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ faculty: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
