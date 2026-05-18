import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const mentors = [
  {
    name: 'Nguyễn Văn Minh',
    email: 'minh.mentor@fpt.edu.vn',
    password: 'password123',
    role: 'mentor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=minh',
    mentorProfile: {
      title: 'Senior Software Engineer tại FPT Software',
      bio: '5 năm kinh nghiệm phát triển web với React và Node.js. Chuyên gia về full-stack development và DevOps.',
      expertise: ['SWP391', 'PRJ301', 'WED201'],
      pricePerHour: 150000,
      rating: 4.8,
      totalReviews: 25,
      isAvailable: true,
      yearsOfExperience: 5,
      company: 'FPT Software',
    },
  },
  {
    name: 'Trần Thị Lan',
    email: 'lan.mentor@fpt.edu.vn',
    password: 'password123',
    role: 'mentor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lan',
    mentorProfile: {
      title: 'Backend Developer tại VNG Corporation',
      bio: 'Chuyên gia về database design và backend architecture. Đã hỗ trợ 100+ sinh viên hoàn thành đồ án.',
      expertise: ['DBI202', 'PRJ301'],
      pricePerHour: 120000,
      rating: 4.9,
      totalReviews: 42,
      isAvailable: true,
      yearsOfExperience: 3,
      company: 'VNG Corporation',
    },
  },
  {
    name: 'Lê Hoàng Nam',
    email: 'nam.mentor@fpt.edu.vn',
    password: 'password123',
    role: 'mentor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
    mentorProfile: {
      title: 'Mobile Developer & Tech Lead',
      bio: 'Chuyên về React Native và Flutter. Lead team mobile 10 người. Mentor part-time với passion giúp đỡ sinh viên.',
      expertise: ['MAD101', 'SWP391', 'OSG201'],
      pricePerHour: 180000,
      rating: 4.7,
      totalReviews: 18,
      isAvailable: true,
      yearsOfExperience: 6,
      company: 'Freelance',
    },
  },
];

async function seedMentors() {
  try {
    await mongoose.connect('mongodb://localhost:27017/fptaiez');
    console.log('Connected to MongoDB');

    // Clear existing mentors
    await User.deleteMany({ role: 'mentor' });
    console.log('Cleared existing mentors');

    // Create new mentors
    for (const mentorData of mentors) {
      const { password, ...rest } = mentorData;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const mentor = new User({
        ...rest,
        password: hashedPassword,
      });
      
      await mentor.save();
      console.log(`Created mentor: ${mentor.name}`);
    }

    console.log('\nSeed completed! Created 3 mentors');
    console.log('Email: minh.mentor@fpt.edu.vn');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedMentors();
