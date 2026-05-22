import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subjectCode: {
    type: String,
    uppercase: true,
    trim: true
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
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  fileUrl: {
    type: String,
    default: ''
  },
  previewImages: [{
    type: String
  }],
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    isVerified: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  documentType: {
    type: String,
    enum: ['pdf', 'slide', 'source_code', 'exam', 'assignment', 'checklist', 'all'],
    default: 'pdf'
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip', 'rar', 'pptx', 'xlsx', 'txt'],
    default: 'pdf'
  },
  tags: [{
    type: String,
    trim: true
  }],
  fileSize: {
    type: Number,
    default: 0
  },
  fileName: {
    type: String,
    default: ''
  },
  pageCount: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  salesCount: {
    type: Number,
    default: 0
  },
  sourceType: {
    type: String,
    enum: ['upload', 'google_drive', 'external_link'],
    default: 'upload'
  },
  externalUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

documentSchema.index({ title: 'text', description: 'text', subjectCode: 'text' });
documentSchema.index({ subjectCode: 1, semester: 1 });
documentSchema.index({ price: 1 });
documentSchema.index({ rating: -1 });
documentSchema.index({ downloads: -1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
