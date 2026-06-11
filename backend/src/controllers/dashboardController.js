import User from '../models/User.js';
import Document from '../models/Document.js';
import Order from '../models/Order.js';
import MentorBooking from '../models/MentorBooking.js';
import Course from '../models/Course.js';
import AIChat from '../models/AIChat.js';
import Post from '../models/Post.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(apiError('User not found', 404));
    }

    // Run all independent queries in parallel
    const [
      recentOrders,
      upcomingBookings,
      recentChats,
      documentsOwnedCount,
      mentorSessionsCount,
      aiChatsCount,
      weeklyStudy,
      subjectProgress
    ] = await Promise.all([
      Order.find({ user: req.user.id, paymentStatus: 'paid' })
        .populate('documents.document', 'title subjectCode')
        .sort({ createdAt: -1 })
        .limit(5),
      MentorBooking.find({
        student: req.user.id,
        status: { $in: ['pending', 'confirmed'] },
        date: { $gte: new Date() }
      })
        .populate('mentor', 'name avatar mentorProfile')
        .sort({ date: 1 })
        .limit(3),
      AIChat.find({ user: req.user.id })
        .sort({ lastMessageAt: -1 })
        .limit(5),
      Order.countDocuments({ user: req.user.id, paymentStatus: 'paid' }),
      MentorBooking.countDocuments({ student: req.user.id, status: 'completed' }),
      AIChat.countDocuments({ user: req.user.id }),
      getWeeklyStudyData(req.user.id),
      getSubjectProgress(req.user.id)
    ]);

    // Populate download history documents in parallel
    const downloadHistory = user.studentProfile?.downloadHistory?.slice(-10).reverse() || [];
    const recentDownloads = await Promise.all(
      downloadHistory.map(async (d) => {
        const doc = await Document.findById(d.document).select('title subjectCode');
        return { ...d.toObject(), document: doc };
      })
    );

    res.json(apiSuccess({
      profile: {
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        gpa: user.studentProfile?.gpa || 0,
        level: user.studentProfile?.level || 1,
        xp: user.studentProfile?.xp || 0,
        xpForNextLevel: (user.studentProfile?.xp || 0) + 500,
        studyStreak: user.studentProfile?.studyStreak || 0,
        rewardPoints: user.studentProfile?.rewardPoints || 0
      },
      stats: {
        documentsOwned: documentsOwnedCount,
        mentorSessions: mentorSessionsCount,
        aiChatsCount: aiChatsCount,
        totalDownloads: downloadHistory.length
      },
      recentOrders,
      upcomingBookings,
      recentChats,
      recentDownloads,
      weeklyStudy,
      subjectProgress
    }));
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      userStats,
      documentStats,
      orderStats,
      mentorStats,
      recentOrders,
      popularDocuments,
      popularMentors,
      monthlyRevenue,
      userGrowth,
      dailyUserSignups,
      monthlyUserSignups
    ] = await Promise.all([
      getUserStats(),
      getDocumentStats(),
      getOrderStats(),
      getMentorStats(),
      Order.find()
        .populate('user', 'name avatar')
        .populate('documents.document', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
      Document.find({ isActive: true, documentScope: { $in: ['marketplace', null] } })
        .populate('author', 'name')
        .sort({ salesCount: -1, downloads: -1 })
        .limit(10),
      User.find({ role: 'mentor' })
        .select('name avatar mentorProfile')
        .sort({ 'mentorProfile.totalSessions': -1 })
        .limit(10),
      getMonthlyRevenue(),
      getUserGrowth(),
      getDailyUserSignups(),
      getMonthlyUserSignups()
    ]);

    res.json(apiSuccess({
      overview: {
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        totalDocuments: documentStats.total,
        totalOrders: orderStats.total,
        totalMentors: mentorStats.total,
        totalRevenue: orderStats.revenue,
        usersToday: userStats.today,
        usersThisMonth: userStats.thisMonth,
        documentStats,
        orderStats
      },
      stats: {
        userStats,
        documentStats,
        orderStats,
        mentorStats
      },
      charts: {
        monthlyRevenue,
        userGrowth,
        dailyUserSignups,
        monthlyUserSignups
      },
      recentOrders,
      popularDocuments,
      popularMentors
    }));
  } catch (error) {
    next(error);
  }
};

async function getUserStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [total, active, students, mentors, today, thisMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'mentor' }),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } })
  ]);

  return { total, active, students, mentors, today, thisMonth };
}

async function getDocumentStats() {
  const [total, activeMarketplace, totalDownloads, totalSales] = await Promise.all([
    Document.countDocuments(),
    Document.countDocuments({ isActive: true, documentScope: { $in: ['marketplace', null] } }),
    Document.aggregate([
      { $group: { _id: null, total: { $sum: '$downloads' } } }
    ]),
    Document.aggregate([
      { $group: { _id: null, total: { $sum: '$salesCount' } } }
    ])
  ]);

  return {
    total,
    activeMarketplace,
    totalDownloads: totalDownloads[0]?.total || 0,
    totalSales: totalSales[0]?.total || 0
  };
}

async function getOrderStats() {
  const [total, completed, pending, revenue] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: 'paid' }),
    Order.countDocuments({ paymentStatus: 'pending' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);

  return {
    total,
    completed,
    pending,
    revenue: revenue[0]?.total || 0
  };
}

async function getMentorStats() {
  const total = await User.countDocuments({ role: 'mentor' });
  const sessions = await MentorBooking.countDocuments({ status: 'completed' });

  return { total, sessions };
}

async function getMonthlyRevenue() {
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const revenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: start }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const byMonth = new Map(revenue.map(item => [
    `${item._id.year}-${item._id.month}`,
    item
  ]));

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const item = byMonth.get(key);
    return {
      month: `${date.getMonth() + 1}/${date.getFullYear()}`,
      revenue: item?.revenue || 0,
      orders: item?.orders || 0
    };
  });
}

async function getUserGrowth() {
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const growth = await User.aggregate([
    {
      $match: { createdAt: { $gte: start } }
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        users: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const byMonth = new Map(growth.map(item => [
    `${item._id.year}-${item._id.month}`,
    item
  ]));

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const item = byMonth.get(key);
    return {
      month: `${date.getMonth() + 1}/${date.getFullYear()}`,
      users: item?.users || 0
    };
  });
}

async function getDailyUserSignups() {
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const growth = await User.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: '$createdAt' },
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        users: { $sum: 1 },
        students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
        mentors: { $sum: { $cond: [{ $eq: ['$role', 'mentor'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  const byDate = new Map(growth.map(item => [
    `${item._id.year}-${item._id.month}-${item._id.day}`,
    item
  ]));

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const item = byDate.get(key);
    return {
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      users: item?.users || 0,
      students: item?.students || 0,
      mentors: item?.mentors || 0
    };
  });
}

async function getMonthlyUserSignups() {
  const start = new Date();
  start.setMonth(start.getMonth() - 23);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const growth = await User.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        users: { $sum: 1 },
        students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
        mentors: { $sum: { $cond: [{ $eq: ['$role', 'mentor'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const byMonth = new Map(growth.map(item => [
    `${item._id.year}-${item._id.month}`,
    item
  ]));

  return Array.from({ length: 24 }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const item = byMonth.get(key);
    return {
      month: `${date.getMonth() + 1}/${date.getFullYear()}`,
      users: item?.users || 0,
      students: item?.students || 0,
      mentors: item?.mentors || 0
    };
  });
}

async function getWeeklyStudyData(userId) {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const [chats, posts, purchases] = await Promise.all([
    AIChat.find({
      user: userId,
      createdAt: { $gte: weekAgo }
    }).select('createdAt'),
    Post.find({
      author: userId,
      isDeleted: false,
      createdAt: { $gte: weekAgo }
    }).select('createdAt'),
    Order.find({
      user: userId,
      paymentStatus: 'paid',
      updatedAt: { $gte: weekAgo }
    }).select('updatedAt')
  ]);

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const dailyActivity = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    dailyActivity[d.toDateString()] = { day: dayNames[d.getDay()], count: 0 };
  }

  chats.forEach(chat => {
    const chatDate = new Date(chat.createdAt).toDateString();
    if (dailyActivity[chatDate] !== undefined) {
      dailyActivity[chatDate].count += 1;
    }
  });

  posts.forEach(post => {
    const postDate = new Date(post.createdAt).toDateString();
    if (dailyActivity[postDate] !== undefined) {
      dailyActivity[postDate].count += 1;
    }
  });

  purchases.forEach(order => {
    const purchaseDate = new Date(order.updatedAt).toDateString();
    if (dailyActivity[purchaseDate] !== undefined) {
      dailyActivity[purchaseDate].count += 1;
    }
  });

  return Object.values(dailyActivity);
}

async function getSubjectProgress(userId) {
  const orders = await Order.find({ user: userId, paymentStatus: 'paid' })
    .populate('documents.document', 'subjectCode');

  const subjectCounts = {};
  orders.forEach(order => {
    order.documents.forEach(item => {
      if (item.document?.subjectCode) {
        subjectCounts[item.document.subjectCode] = (subjectCounts[item.document.subjectCode] || 0) + 1;
      }
    });
  });

  return Object.entries(subjectCounts).map(([subject, count]) => ({ subject, count }));
}
