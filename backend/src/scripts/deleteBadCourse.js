// Script to delete specific bad course
// Run: node src/scripts/deleteBadCourse.js

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

const deleteBadCourse = async () => {
  try {
    await connectDB();

    // Delete specific bad course
    const result = await Course.deleteOne({ code: 'M9380' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Deleted course M9380');
    } else {
      console.log('Course M9380 not found');
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteBadCourse();
