import Course from '../models/Course.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

// Generate unique course code
const generateCourseCode = (name) => {
  const prefix = name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join('')
    .substring(0, 4);
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${number}`;
};

export const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, faculty, semester, search, category } = req.query;

    const query = { isActive: true };
    if (faculty) query.faculty = faculty;
    if (semester) query.semester = semester;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('mentor', 'name avatar mentorProfile.title')
        .populate('documents', 'title downloads fileType fileSize')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Course.countDocuments(query),
    ]);

    res.json(apiSuccess({
      courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }));
  } catch (error) {
    next(error);
  }
};

export const getCourseByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const course = await Course.findOne({ code: code.toUpperCase() })
      .populate('mentor', 'name avatar mentorProfile.title mentorProfile.expertise');

    if (!course) {
      return next(apiError('Course not found', 404));
    }

    const documents = await Document.find({
      course: course._id,
      isActive: true
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(apiSuccess({ course, documents }));
  } catch (error) {
    next(error);
  }
};

export const getMyCourses = async (req, res, next) => {
  try {
    const { filter = 'my', category, search } = req.query;
    
    // Always filter by current mentor
    let query = { mentor: req.user.id, isActive: true };
    
    // Apply category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Apply search filter if provided
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query)
      .populate('mentor', 'name avatar mentorProfile.title')
      .populate('documents', 'title downloads fileType fileSize createdAt')
      .sort({ createdAt: -1 });

    res.json(apiSuccess(courses));
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { name, description, credits, faculty, category, semester, year, thumbnail, price } = req.body;

    // Generate unique course code
    let code = generateCourseCode(name);
    let exists = await Course.findOne({ code });
    while (exists) {
      code = generateCourseCode(name);
      exists = await Course.findOne({ code });
    }

    const course = await Course.create({
      code,
      name,
      description,
      credits,
      faculty,
      category,
      semester,
      year,
      thumbnail,
      price,
      mentor: req.user.id
    });

    res.status(201).json(apiSuccess(course, 'Course created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { code } = req.params;
    const course = await Course.findOne({ code: code.toUpperCase() });

    if (!course) {
      return next(apiError('Course not found', 404));
    }

    // Check if user is the mentor of this course or admin
    if (course.mentor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('You can only update your own courses', 403));
    }

    Object.assign(course, req.body);
    await course.save();

    res.json(apiSuccess(course, 'Course updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { code } = req.params;
    const course = await Course.findOne({ code: code.toUpperCase() });

    if (!course) {
      return next(apiError('Course not found', 404));
    }

    // Check if user is the mentor of this course or admin
    if (course.mentor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('You can only delete your own courses', 403));
    }

    course.isActive = false;
    await course.save();

    // Also deactivate documents
    await Document.updateMany({ course: course._id }, { isActive: false });

    res.json(apiSuccess(null, 'Course deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const addDocumentToCourse = async (req, res, next) => {
  try {
    const { code } = req.params;
    const course = await Course.findOne({ code: code.toUpperCase() });

    if (!course) {
      return next(apiError('Course not found', 404));
    }

    if (course.mentor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('You can only add documents to your own courses', 403));
    }

    const { title, description, price, documentType, tags, sourceType, externalUrl } = req.body;
    const file = req.file;

    // Validate: must have either file or externalUrl
    if (!file && !externalUrl) {
      return next(apiError('File or external URL is required', 400));
    }

    if (file && externalUrl) {
      return next(apiError('Please provide either a file OR an external URL, not both', 400));
    }

    // Validate external URL format if provided
    if (externalUrl) {
      try {
        const url = new URL(externalUrl);
        const validHosts = ['drive.google.com', 'docs.google.com', 'www.dropbox.com', 'onedrive.live.com', 'sharepoint.com'];
        if (!validHosts.some(host => url.hostname.includes(host))) {
          return next(apiError('Please provide a valid Google Drive, Dropbox, OneDrive, or SharePoint link', 400));
        }
      } catch {
        return next(apiError('Invalid URL format', 400));
      }
    }

    // Determine file type from extension for uploads
    const ext = file ? file.originalname.split('.').pop().toLowerCase() : null;
    const fileTypeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'jpg': 'jpg',
      'jpeg': 'jpeg',
      'png': 'png',
      'zip': 'zip',
      'rar': 'rar',
      'pptx': 'pptx',
      'xlsx': 'xlsx',
      'txt': 'txt'
    };

    // Determine source type
    let docSourceType = 'upload';
    let docExternalUrl = '';
    let docFileUrl = '';
    let docFileName = '';
    let docFileSize = 0;
    let docFileType = 'pdf';

    if (externalUrl) {
      docSourceType = externalUrl.includes('drive.google.com') ? 'google_drive' : 'external_link';
      docExternalUrl = externalUrl;
      docFileName = title || 'External Document';
    } else {
      docFileUrl = `/uploads/documents/${file.filename}`;
      docFileName = file.originalname;
      docFileSize = file.size;
      docFileType = fileTypeMap[ext] || 'pdf';
    }

    const document = await Document.create({
      title: title || (externalUrl ? 'External Document' : file.originalname),
      description,
      course: course._id,
      subjectCode: code,
      author: req.user.id,
      price: price || 0,
      fileUrl: docFileUrl,
      fileName: docFileName,
      fileType: docFileType,
      fileSize: docFileSize,
      documentType: documentType || 'pdf',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      sourceType: docSourceType,
      externalUrl: docExternalUrl
    });

    course.documents.push(document._id);
    course.documentCount = course.documents.length;
    await course.save();

    res.status(201).json(apiSuccess(document, 'Document added successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateCourseDocument = async (req, res, next) => {
  try {
    const { code, docId } = req.params;
    const course = await Course.findOne({ code: code.toUpperCase() });

    if (!course) {
      return next(apiError('Course not found', 404));
    }

    if (course.mentor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('You can only update documents in your own courses', 403));
    }

    const document = await Document.findOne({ _id: docId, course: course._id });
    if (!document) {
      return next(apiError('Document not found in this course', 404));
    }

    const { title, description, price, documentType, tags, sourceType, externalUrl } = req.body;

    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (price !== undefined) document.price = price;
    if (documentType) document.documentType = documentType;
    if (tags) document.tags = tags.split(',').map(t => t.trim());

    if (req.file) {
      document.fileUrl = `/uploads/documents/${req.file.filename}`;
      document.fileName = req.file.originalname;
      document.fileSize = req.file.size;
      document.sourceType = 'upload';
      document.externalUrl = '';
    }

    if (sourceType !== undefined) {
      document.sourceType = sourceType;
      if (sourceType !== 'upload' && externalUrl) {
        document.externalUrl = externalUrl;
        document.fileUrl = '';
      }
    }

    if (externalUrl !== undefined) {
      if (externalUrl) {
        try {
          const url = new URL(externalUrl);
          const validHosts = ['drive.google.com', 'docs.google.com', 'www.dropbox.com', 'onedrive.live.com', 'sharepoint.com'];
          if (!validHosts.some(host => url.hostname.includes(host))) {
            return next(apiError('Please provide a valid Google Drive, Dropbox, OneDrive, or SharePoint link', 400));
          }
        } catch {
          return next(apiError('Invalid URL format', 400));
        }
        document.externalUrl = externalUrl;
        document.sourceType = externalUrl.includes('drive.google.com') ? 'google_drive' : 'external_link';
        document.fileUrl = '';
      } else {
        document.externalUrl = '';
      }
    }

    await document.save();

    res.json(apiSuccess(document, 'Document updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const removeDocumentFromCourse = async (req, res, next) => {
  try {
    const { code, docId } = req.params;
    const course = await Course.findOne({ code: code.toUpperCase() });

    if (!course) {
      return next(apiError('Course not found', 404));
    }

    // Check if user is the mentor of this course
    if (course.mentor.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('You can only remove documents from your own courses', 403));
    }

    // Remove document from course
    course.documents = course.documents.filter(d => d.toString() !== docId);
    course.documentCount = course.documents.length;
    await course.save();

    // Deactivate the document
    await Document.findByIdAndUpdate(docId, { isActive: false });

    res.json(apiSuccess(null, 'Document removed successfully'));
  } catch (error) {
    next(error);
  }
};

export const getPopularSubjects = async (req, res, next) => {
  try {
    const subjects = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subjectCode', count: { $sum: 1 }, totalDownloads: { $sum: '$downloads' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const result = await Promise.all(
      subjects.map(async (s) => {
        const course = await Course.findOne({ code: s._id });
        return {
          code: s._id,
          name: course?.name || s._id,
          documentCount: s.count,
          totalDownloads: s.totalDownloads,
        };
      })
    );

    res.json(apiSuccess(result));
  } catch (error) {
    next(error);
  }
};
