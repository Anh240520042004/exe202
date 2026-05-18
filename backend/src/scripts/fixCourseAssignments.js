// Script to fix course assignments for mentors
// Run: node src/scripts/fixCourseAssignments.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import Course from '../models/Course.js';
import Document from '../models/Document.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixCourseAssignments = async () => {
  try {
    await connectDB();

    // Find mentors by email
    const mentor1 = await User.findOne({ email: 'mentor@fpt.edu.vn', role: 'mentor' });
    const mentor2 = await User.findOne({ email: 'mentor2@fpt.edu.vn', role: 'mentor' });

    if (!mentor1 || !mentor2) {
      console.error('Mentors not found!');
      console.log('mentor1:', mentor1);
      console.log('mentor2:', mentor2);
      process.exit(1);
    }

    console.log('Found mentors:');
    console.log('  Mentor 1:', mentor1.name, '- ID:', mentor1._id);
    console.log('  Mentor 2:', mentor2.name, '- ID:', mentor2._id);

    // Define course assignments (7 courses total)
    const courseAssignments = {
      // Mentor 1 courses
      'SWP391': mentor1._id, // Software Engineering
      'PRJ301': mentor1._id, // Project Management
      'OSG201': mentor1._id, // Operating Systems
      'MKT101': mentor1._id, // Marketing Fundamentals
      'COM101': mentor1._id, // Communication Skills
      
      // Mentor 2 courses
      'DBI202': mentor2._id, // Database Systems
      'MAD101': mentor2._id, // Mobile App Development
      'WED201': mentor2._id, // Web Development
      'MKT202': mentor2._id, // Digital Marketing
      'COM201': mentor2._id, // Media and Journalism
    };

    // Update all courses
    console.log('\nUpdating course assignments...');
    for (const [courseCode, mentorId] of Object.entries(courseAssignments)) {
      const course = await Course.findOne({ code: courseCode });
      if (course) {
        const oldMentor = course.mentor;
        course.mentor = mentorId;
        await course.save();
        console.log(`  ${courseCode}: ${course.name} -> Mentor ID ${mentorId} (was ${oldMentor})`);
      } else {
        console.log(`  ${courseCode}: NOT FOUND`);
      }
    }

    // Count courses per mentor
    const mentor1Courses = await Course.countDocuments({ mentor: mentor1._id });
    const mentor2Courses = await Course.countDocuments({ mentor: mentor2._id });

    console.log('\nCourse counts:');
    console.log(`  ${mentor1.name}: ${mentor1Courses} courses`);
    console.log(`  ${mentor2.name}: ${mentor2Courses} courses`);

    // Update document references
    console.log('\nUpdating document references...');
    const courses = await Course.find({});
    for (const course of courses) {
      // Find documents that reference this course's subjectCode
      const docs = await Document.find({ subjectCode: course.code });
      for (const doc of docs) {
        if (!doc.course || doc.course.toString() !== course._id.toString()) {
          doc.course = course._id;
          await doc.save();
          console.log(`  Updated doc "${doc.title}" -> course ${course.code}`);
        }
      }
      
      // Update course documents array
      const courseDocs = await Document.find({ subjectCode: course.code, course: course._id });
      course.documents = courseDocs.map(d => d._id);
      course.documentCount = courseDocs.length;
      course.totalDownloads = courseDocs.reduce((sum, d) => sum + (d.downloads || 0), 0);
      await course.save();
    }

    console.log('\n✅ Course assignments fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixCourseAssignments();
