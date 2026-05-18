// Script to clean up bad courses
// Run: node src/scripts/cleanupBadCourses.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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

const cleanupBadCourses = async () => {
  try {
    await connectDB();

    // Find and delete courses with suspicious codes
    const badCourses = await Course.find({
      $or: [
        { code: { $regex: /^M\d+$/ } }, // Codes like M9380
        { code: { $regex: /^W\d+$/ } }, // Codes like W...
        { code: { $regex: /^C\d+$/ } }, // Codes like C...
        { name: { $regex: /^[a-z]+$/ } } // Lowercase names like "mma"
      ]
    });

    console.log('Found bad courses:');
    for (const course of badCourses) {
      console.log(`  ${course.code}: ${course.name}`);
    }

    if (badCourses.length > 0) {
      const codes = badCourses.map(c => c.code);
      await Course.deleteMany({ code: { $in: codes } });
      console.log(`\nDeleted ${badCourses.length} bad courses`);
    } else {
      console.log('No bad courses found');
    }

    console.log('\n✅ Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanupBadCourses();
