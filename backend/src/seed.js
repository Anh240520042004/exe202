import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import User from './models/User.js';
import Course from './models/Course.js';
import Document from './models/Document.js';
import Badge from './models/Badge.js';
import Order from './models/Order.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@fpt.edu.vn',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      isActive: true,
      isEmailVerified: true,
    },
    {
      name: 'Nguyen Van Mentor',
      email: 'mentor@fpt.edu.vn',
      password: await bcrypt.hash('mentor123', 10),
      role: 'mentor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor1',
      isActive: true,
      isEmailVerified: true,
      mentorProfile: {
        title: 'Senior Software Engineer',
        bio: 'Experienced mentor with 5+ years in software development. Passionate about teaching and helping students succeed.',
        expertise: ['SWP391', 'PRJ301'],
        major: 'Software Engineering',
        gpa: 3.8,
        passedSubjects: ['SWP391', 'PRJ301', 'DBI202', 'MAD101'],
        experience: '5 years at FPT Software',
        pricePerHour: 150000,
        rating: 4.8,
        totalReviews: 25,
        isAvailable: true,
        totalSessions: 48,
      },
    },
    {
      name: 'Tran Thi Mentor',
      email: 'mentor2@fpt.edu.vn',
      password: await bcrypt.hash('mentor123', 10),
      role: 'mentor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor2',
      isActive: true,
      isEmailVerified: true,
      mentorProfile: {
        title: 'Full Stack Developer',
        bio: 'Specialized in mobile and web development. Love sharing knowledge with juniors.',
        expertise: ['MAD101', 'SWP391'],
        major: 'Mobile Computing',
        gpa: 3.6,
        passedSubjects: ['MAD101', 'SWP391', 'PRJ301'],
        experience: '3 years at VNG Corporation',
        pricePerHour: 120000,
        rating: 4.6,
        totalReviews: 18,
        isAvailable: true,
        totalSessions: 32,
      },
    },
    {
      name: 'Le Van Student',
      email: 'student@fpt.edu.vn',
      password: await bcrypt.hash('student123', 10),
      role: 'student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1',
      isActive: true,
      isEmailVerified: true,
      studentProfile: {
        studentId: 'SE123456',
        gpa: 3.2,
        faculty: 'Software Engineering',
        passedSubjects: ['SWP391', 'DBI202'],
        studyStreak: 5,
        xp: 1250,
        level: 3,
      },
    },
    {
      name: 'Pham Thi Student',
      email: 'student2@fpt.edu.vn',
      password: await bcrypt.hash('student123', 10),
      role: 'student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2',
      isActive: true,
      isEmailVerified: true,
      studentProfile: {
        studentId: 'SE123457',
        gpa: 3.5,
        faculty: 'Software Engineering',
        passedSubjects: ['SWP391', 'PRJ301', 'DBI202', 'MAD101'],
        studyStreak: 12,
        xp: 2800,
        level: 5,
      },
    },
  ];

  await User.deleteMany({});
  const createdUsers = await User.insertMany(users);
  console.log('Users seeded:', createdUsers.length);
  return createdUsers;
};

const seedCourses = async (users) => {
  const mentors = users.filter(u => u.role === 'mentor');

  const courses = [
    { code: 'SWP391', name: 'Software Engineering', description: 'Introduction to software engineering principles and practices', credits: 3, faculty: 'Software Engineering', semester: '1', mentor: mentors[0]._id, category: 'software_engineering' },
    { code: 'PRJ301', name: 'Project Management', description: 'Learn project management methodologies and tools', credits: 3, faculty: 'Software Engineering', semester: '2', mentor: mentors[0]._id, category: 'software_engineering' },
    { code: 'DBI202', name: 'Database Systems', description: 'Database design, SQL, and management systems', credits: 3, faculty: 'Information System', semester: '1', mentor: mentors[1]._id, category: 'software_engineering' },
    { code: 'MAD101', name: 'Mobile App Development', description: 'Introduction to mobile application development', credits: 3, faculty: 'Software Engineering', semester: '2', mentor: mentors[1]._id, category: 'software_engineering' },
    { code: 'OSG201', name: 'Operating Systems', description: 'Operating system concepts and principles', credits: 3, faculty: 'Computer Science', semester: '1', mentor: mentors[0]._id, category: 'software_engineering' },
    { code: 'WED201', name: 'Web Development', description: 'Frontend and backend web development', credits: 3, faculty: 'Software Engineering', semester: '2', mentor: mentors[1]._id, category: 'software_engineering' },
    { code: 'MKT101', name: 'Marketing Fundamentals', description: 'Introduction to marketing principles and strategies', credits: 3, faculty: 'Business Administration', semester: '1', mentor: mentors[0]._id, category: 'marketing' },
    { code: 'MKT202', name: 'Digital Marketing', description: 'Social media, SEO, and online marketing strategies', credits: 3, faculty: 'Business Administration', semester: '2', mentor: mentors[1]._id, category: 'marketing' },
    { code: 'COM101', name: 'Communication Skills', description: 'Effective communication and public speaking', credits: 2, faculty: 'Communication', semester: '1', mentor: mentors[0]._id, category: 'communication' },
    { code: 'COM201', name: 'Media and Journalism', description: 'Introduction to media studies and journalism', credits: 3, faculty: 'Communication', semester: '2', mentor: mentors[1]._id, category: 'communication' },
  ];

  await Course.deleteMany({});
  const createdCourses = await Course.insertMany(courses);
  console.log('Courses seeded:', createdCourses.length);
  return createdCourses;
};

const seedDocuments = async (users, courses) => {
  const mentors = users.filter(u => u.role === 'mentor');
  const admin = users.find(u => u.role === 'admin');

  const documents = [
    {
      title: 'SWP391 Complete Notes - Software Engineering Fundamentals',
      description: 'Comprehensive notes covering all topics from SWP391 including SDLC, UML diagrams, and design patterns.',
      course: courses[0]._id,
      subjectCode: 'SWP391',
      semester: '1',
      author: mentors[0]._id,
      price: 50000,
      fileUrl: '/uploads/documents/swp391-notes.txt',
      previewImages: ['https://picsum.photos/seed/swp391notes/400/600'],
      downloads: 245,
      rating: 4.7,
      totalReviews: 32,
      documentType: 'pdf',
      tags: ['notes', 'UML', 'design patterns', 'SDLC'],
      fileSize: 2.5,
      fileName: 'swp391-notes.pdf',
      pageCount: 45,
      isFeatured: true,
      salesCount: 120,
    },
    {
      title: 'PRJ301 Final Exam Preparation 2024',
      description: 'Previous final exams with detailed solutions. Perfect for exam preparation.',
      course: courses[1]._id,
      subjectCode: 'PRJ301',
      semester: '2',
      author: mentors[0]._id,
      price: 30000,
      fileUrl: '/uploads/documents/prj301-exam.txt',
      previewImages: ['https://picsum.photos/seed/prjexam2024/400/600'],
      downloads: 189,
      rating: 4.5,
      totalReviews: 28,
      documentType: 'exam',
      tags: ['exam', 'final', 'solutions'],
      fileSize: 1.8,
      fileName: 'prj301-exam.pdf',
      pageCount: 32,
      isFeatured: true,
      salesCount: 95,
    },
    {
      title: 'DBI202 SQL Cheat Sheet',
      description: 'Quick reference guide for SQL queries, joins, and database concepts.',
      course: courses[2]._id,
      subjectCode: 'DBI202',
      semester: '1',
      author: admin._id,
      price: 20000,
      fileUrl: '/uploads/documents/dbi202-sql.txt',
      previewImages: ['https://picsum.photos/seed/dbi202sql/400/600'],
      downloads: 312,
      rating: 4.8,
      totalReviews: 45,
      documentType: 'checklist',
      tags: ['SQL', 'cheatsheet', 'reference'],
      fileSize: 0.8,
      fileName: 'dbi202-sql.pdf',
      pageCount: 8,
      isFeatured: true,
      salesCount: 156,
    },
    {
      title: 'MAD101 React Native Assignment Templates',
      description: 'Complete assignment templates with source code for React Native projects.',
      course: courses[3]._id,
      subjectCode: 'MAD101',
      semester: '2',
      author: mentors[1]._id,
      price: 75000,
      fileUrl: '/uploads/documents/mad101-templates.txt',
      previewImages: ['https://picsum.photos/seed/mad101react/400/600'],
      downloads: 98,
      rating: 4.6,
      totalReviews: 18,
      documentType: 'source_code',
      tags: ['react native', 'templates', 'source code'],
      fileSize: 5.2,
      fileName: 'mad101-templates.zip',
      pageCount: 0,
      isPremium: true,
      salesCount: 45,
    },
    {
      title: 'Software Design Patterns Presentation Slides',
      description: 'Beautiful slides covering all 23 GoF design patterns with examples.',
      course: courses[0]._id,
      subjectCode: 'SWP391',
      semester: '1',
      author: mentors[0]._id,
      price: 40000,
      fileUrl: '/uploads/documents/swp391-slides.txt',
      previewImages: ['https://picsum.photos/seed/patternslides/400/600'],
      downloads: 156,
      rating: 4.9,
      totalReviews: 22,
      documentType: 'slide',
      tags: ['slides', 'design patterns', 'GoF'],
      fileSize: 8.5,
      fileName: 'swp391-slides.pptx',
      pageCount: 120,
      isFeatured: true,
      salesCount: 78,
    },
    {
      title: 'Agile & Scrum Complete Guide',
      description: 'Everything you need to know about Agile methodologies and Scrum framework.',
      course: courses[1]._id,
      subjectCode: 'PRJ301',
      semester: '2',
      author: mentors[0]._id,
      price: 60000,
      fileUrl: '/uploads/documents/prj301-agile.txt',
      previewImages: ['https://picsum.photos/seed/agilescrum/400/600'],
      downloads: 134,
      rating: 4.4,
      totalReviews: 15,
      documentType: 'pdf',
      tags: ['agile', 'scrum', 'project management'],
      fileSize: 3.2,
      fileName: 'prj301-agile.pdf',
      pageCount: 56,
      salesCount: 67,
    },
    {
      title: 'MKT101 Marketing Strategy Notes',
      description: 'Complete notes on marketing fundamentals and strategies.',
      course: courses[6]._id,
      subjectCode: 'MKT101',
      semester: '1',
      author: mentors[0]._id,
      price: 35000,
      fileUrl: '/uploads/documents/mkt101-notes.txt',
      previewImages: ['https://picsum.photos/seed/mkt101/400/600'],
      downloads: 145,
      rating: 4.5,
      totalReviews: 20,
      documentType: 'pdf',
      tags: ['marketing', 'strategy', 'fundamentals'],
      fileSize: 2.1,
      fileName: 'mkt101-notes.pdf',
      pageCount: 38,
      salesCount: 72,
    },
    {
      title: 'Digital Marketing Campaign Templates',
      description: 'Ready-to-use templates for digital marketing campaigns.',
      course: courses[7]._id,
      subjectCode: 'MKT202',
      semester: '2',
      author: mentors[1]._id,
      price: 55000,
      fileUrl: '/uploads/documents/mkt202-templates.txt',
      previewImages: ['https://picsum.photos/seed/mkt202/400/600'],
      downloads: 88,
      rating: 4.3,
      totalReviews: 12,
      documentType: 'source_code',
      tags: ['digital marketing', 'templates', 'campaigns'],
      fileSize: 4.5,
      fileName: 'mkt202-templates.zip',
      pageCount: 0,
      salesCount: 38,
    },
    {
      title: 'Communication Skills Handbook',
      description: 'Essential guide to effective communication and public speaking.',
      course: courses[8]._id,
      subjectCode: 'COM101',
      semester: '1',
      author: mentors[0]._id,
      price: 25000,
      fileUrl: '/uploads/documents/com101-handbook.txt',
      previewImages: ['https://picsum.photos/seed/com101/400/600'],
      downloads: 210,
      rating: 4.6,
      totalReviews: 30,
      documentType: 'pdf',
      tags: ['communication', 'public speaking', 'handbook'],
      fileSize: 3.0,
      fileName: 'com101-handbook.pdf',
      pageCount: 52,
      isFeatured: true,
      salesCount: 105,
    },
    {
      title: 'Media Ethics and Journalism Guide',
      description: 'Comprehensive guide to media ethics and journalism practices.',
      course: courses[9]._id,
      subjectCode: 'COM201',
      semester: '2',
      author: mentors[1]._id,
      price: 45000,
      fileUrl: '/uploads/documents/com201-guide.txt',
      previewImages: ['https://picsum.photos/seed/com201/400/600'],
      downloads: 95,
      rating: 4.4,
      totalReviews: 14,
      documentType: 'pdf',
      tags: ['media', 'journalism', 'ethics'],
      fileSize: 2.8,
      fileName: 'com201-guide.pdf',
      pageCount: 48,
      salesCount: 42,
    },
  ];

  await Document.deleteMany({});
  const createdDocs = await Document.insertMany(documents);
  console.log('Documents seeded:', createdDocs.length);

  // Update documents array and documentCount in each course
  for (const doc of createdDocs) {
    await Course.findByIdAndUpdate(doc.course, {
      $push: { documents: doc._id },
      $inc: { documentCount: 1 },
      $inc: { totalDownloads: doc.downloads }
    });
  }
  console.log('Courses updated with document references');

  return createdDocs;
};

const seedBadges = async () => {
  const badges = [
    {
      name: 'Final Slayer',
      code: 'final_slayer',
      description: 'Score 80+ in any final exam',
      icon: '🎯',
      category: 'academic',
      requirement: { type: 'gpa', value: 3.5, description: 'Achieve GPA 3.5 or higher' },
      xpReward: 500,
      rarity: 'rare',
    },
    {
      name: 'Assignment Master',
      code: 'assignment_master',
      description: 'Submit 10 assignments on time',
      icon: '📝',
      category: 'academic',
      requirement: { type: 'downloads', value: 10, description: 'Download 10 documents' },
      xpReward: 300,
      rarity: 'common',
    },
    {
      name: 'GPA Hunter',
      code: 'gpa_hunter',
      description: 'Achieve a GPA above 3.8',
      icon: '📚',
      category: 'academic',
      requirement: { type: 'gpa', value: 3.8, description: 'Maintain GPA 3.8 or higher' },
      xpReward: 1000,
      rarity: 'epic',
    },
    {
      name: 'Mentor Hero',
      code: 'mentor_hero',
      description: 'Book 5 sessions with mentors',
      icon: '🦸',
      category: 'mentor',
      requirement: { type: 'mentor_sessions', value: 5, description: 'Complete 5 mentor sessions' },
      xpReward: 400,
      rarity: 'rare',
    },
    {
      name: 'Study Streak 7',
      code: 'streak_7',
      description: 'Study for 7 days in a row',
      icon: '🔥',
      category: 'streak',
      requirement: { type: 'streak', value: 7, description: 'Maintain 7-day study streak' },
      xpReward: 200,
      rarity: 'common',
    },
    {
      name: 'Study Streak 30',
      code: 'streak_30',
      description: 'Study for 30 days in a row',
      icon: '⚡',
      category: 'streak',
      requirement: { type: 'streak', value: 30, description: 'Maintain 30-day study streak' },
      xpReward: 800,
      rarity: 'legendary',
    },
    {
      name: 'XP Collector',
      code: 'xp_collector',
      description: 'Earn 1000 XP',
      icon: '⭐',
      category: 'social',
      requirement: { type: 'xp', value: 1000, description: 'Accumulate 1000 XP' },
      xpReward: 100,
      rarity: 'common',
    },
    {
      name: 'Level Up',
      code: 'level_5',
      description: 'Reach level 5',
      icon: '🚀',
      category: 'social',
      requirement: { type: 'level', value: 5, description: 'Reach level 5' },
      xpReward: 300,
      rarity: 'rare',
    },
  ];

  await Badge.deleteMany({});
  const createdBadges = await Badge.insertMany(badges);
  console.log('Badges seeded:', createdBadges.length);
  return createdBadges;
};

const seedOrders = async (users, documents) => {
  const students = users.filter(u => u.role === 'student');

  const orders = [
    {
      user: students[0]._id,
      documents: [
        { document: documents[0]._id, price: documents[0].price, downloaded: true, downloadedAt: new Date() },
        { document: documents[2]._id, price: documents[2].price, downloaded: true, downloadedAt: new Date() },
      ],
      totalAmount: documents[0].price + documents[2].price,
      status: 'completed',
      paymentMethod: 'vnpay',
      paymentStatus: 'paid',
    },
    {
      user: students[0]._id,
      documents: [
        { document: documents[1]._id, price: documents[1].price, downloaded: false },
        { document: documents[4]._id, price: documents[4].price, downloaded: false },
      ],
      totalAmount: documents[1].price + documents[4].price,
      status: 'completed',
      paymentMethod: 'momo',
      paymentStatus: 'paid',
    },
    {
      user: students[1]._id,
      documents: [
        { document: documents[0]._id, price: documents[0].price, downloaded: true, downloadedAt: new Date() },
        { document: documents[1]._id, price: documents[1].price, downloaded: true, downloadedAt: new Date() },
        { document: documents[2]._id, price: documents[2].price, downloaded: true, downloadedAt: new Date() },
        { document: documents[3]._id, price: documents[3].price, downloaded: false },
      ],
      totalAmount: documents[0].price + documents[1].price + documents[2].price + documents[3].price,
      status: 'completed',
      paymentMethod: 'vnpay',
      paymentStatus: 'paid',
    },
    {
      user: students[1]._id,
      documents: [
        { document: documents[5]._id, price: documents[5].price, downloaded: false },
      ],
      totalAmount: documents[5].price,
      status: 'pending',
      paymentMethod: 'banking',
      paymentStatus: 'pending',
    },
  ];

  await Order.deleteMany({});
  const createdOrders = await Order.insertMany(orders);
  console.log('Orders seeded:', createdOrders.length);
  
  // Add download history to students
  // Student 1 (Le Van Student) - 2 downloads
  await User.findByIdAndUpdate(students[0]._id, {
    'studentProfile.downloadHistory': [
      { document: documents[0]._id, downloadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // 2 days ago
      { document: documents[2]._id, downloadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }, // 1 day ago
    ]
  });
  
  // Student 2 (Pham Thi Student) - 3 downloads
  await User.findByIdAndUpdate(students[1]._id, {
    'studentProfile.downloadHistory': [
      { document: documents[0]._id, downloadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, // 5 days ago
      { document: documents[1]._id, downloadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // 3 days ago
      { document: documents[2]._id, downloadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }, // 1 day ago
    ]
  });
  
  console.log('Download history seeded for students');
  return createdOrders;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    await seedBadges();
    const users = await seedUsers();
    const courses = await seedCourses(users);
    const documents = await seedDocuments(users, courses);
    await seedOrders(users, documents);
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
