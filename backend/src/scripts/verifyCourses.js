// Script to verify course assignments
// Run: node src/scripts/verifyCourses.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import Course from '../models/Course.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...\n');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const verifyCourses = async () => {
  try {
    await connectDB();

    // Get all courses
    const allCourses = await Course.find({}).sort({ code: 1 });
    
    console.log('=== ALL COURSES ===');
    console.log(`Total: ${allCourses.length} courses\n`);
    
    for (const course of allCourses) {
      console.log(`  ${course.code} - ${course.name}`);
      console.log(`    Mentor ID: ${course.mentor}`);
      console.log(`    Documents: ${course.documentCount}`);
      console.log(`    Downloads: ${course.totalDownloads}`);
      console.log(`    Category: ${course.category}`);
      console.log('');
    }

    // Find mentors
    const mentors = await User.find({ role: 'mentor' });
    
    console.log('=== COURSES BY MENTOR ===\n');
    for (const mentor of mentors) {
      const courses = await Course.find({ mentor: mentor._id });
      console.log(`${mentor.name} (${mentor.email}): ${courses.length} courses`);
      for (const c of courses) {
        console.log(`  - ${c.code}: ${c.name}`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyCourses();
