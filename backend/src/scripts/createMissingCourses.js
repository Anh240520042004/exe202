// Script to create missing courses for mentors
// Run: node src/scripts/createMissingCourses.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import Course from '../models/Course.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createMissingCourses = async () => {
  try {
    await connectDB();

    // Find mentors by email
    const mentor1 = await User.findOne({ email: 'mentor@fpt.edu.vn', role: 'mentor' });
    const mentor2 = await User.findOne({ email: 'mentor2@fpt.edu.vn', role: 'mentor' });

    if (!mentor1 || !mentor2) {
      console.error('Mentors not found!');
      process.exit(1);
    }

    console.log('Found mentors:');
    console.log('  Mentor 1:', mentor1.name, '- ID:', mentor1._id);
    console.log('  Mentor 2:', mentor2.name, '- ID:', mentor2._id);

    // Missing courses to create
    const missingCourses = [
      // Mentor 1 courses
      {
        code: 'MKT101',
        name: 'Marketing Fundamentals',
        description: 'Introduction to marketing principles and strategies',
        credits: 3,
        faculty: 'Business Administration',
        semester: '1',
        category: 'marketing',
        mentor: mentor1._id,
        documentCount: 0,
        totalDownloads: 0,
        price: 0
      },
      {
        code: 'COM101',
        name: 'Communication Skills',
        description: 'Effective communication and public speaking',
        credits: 2,
        faculty: 'Communication',
        semester: '1',
        category: 'communication',
        mentor: mentor1._id,
        documentCount: 0,
        totalDownloads: 0,
        price: 0
      },
      // Mentor 2 courses
      {
        code: 'MKT202',
        name: 'Digital Marketing',
        description: 'Social media, SEO, and online marketing strategies',
        credits: 3,
        faculty: 'Business Administration',
        semester: '2',
        category: 'marketing',
        mentor: mentor2._id,
        documentCount: 0,
        totalDownloads: 0,
        price: 0
      },
      {
        code: 'COM201',
        name: 'Media and Journalism',
        description: 'Introduction to media studies and journalism',
        credits: 3,
        faculty: 'Communication',
        semester: '2',
        category: 'communication',
        mentor: mentor2._id,
        documentCount: 0,
        totalDownloads: 0,
        price: 0
      },
    ];

    console.log('\nCreating missing courses...');
    for (const courseData of missingCourses) {
      const existing = await Course.findOne({ code: courseData.code });
      if (existing) {
        console.log(`  ${courseData.code}: Already exists`);
      } else {
        const course = await Course.create(courseData);
        console.log(`  ${courseData.code}: ${course.name} - Created!`);
      }
    }

    // Count final courses per mentor
    const mentor1Courses = await Course.find({ mentor: mentor1._id });
    const mentor2Courses = await Course.find({ mentor: mentor2._id });

    console.log('\nFinal course counts:');
    console.log(`  ${mentor1.name}: ${mentor1Courses.length} courses`);
    mentor1Courses.forEach(c => console.log(`    - ${c.code}: ${c.name}`));
    console.log(`  ${mentor2.name}: ${mentor2Courses.length} courses`);
    mentor2Courses.forEach(c => console.log(`    - ${c.code}: ${c.name}`));

    console.log('\n✅ Missing courses created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createMissingCourses();
