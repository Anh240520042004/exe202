import mongoose from 'mongoose';
import { RewardPoint, PointRedemption, Order, Document, User, Payment, Transaction, Notification } from '../models/index.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';

const POINTS_PER_VND = 0.01;  // 1 VNĐ = 0.01 điểm (mua 1000đ = 10 điểm)
const VND_PER_POINT = 0.5;     // 1 điểm = 0.5 VNĐ (đổi điểm lấy tài liệu: điểm × 2 = giá VNĐ)
const MIN_REDEEM_POINTS = 100; // Tối thiểu 100 điểm để đổi
const MAX_POINTS_REDEEM_RATIO = 0.5; // Tối đa dùng 50% giá trị đơn hàng bằng điểm

// =========================
// BONUS POINTS TABLE
// =========================
// Streak bonus (theo số ngày liên tiếp)
const STREAK_BONUS = {
  7:   50,    // 7 ngày → 50 điểm
  14:  100,   // 14 ngày → 100 điểm
  21:  150,   // 21 ngày → 150 điểm
  30:  200,   // 30 ngày → 200 điểm
  60:  300,   // 60 ngày → 300 điểm
  90:  500,   // 90 ngày → 500 điểm
};

// Level bonus (theo cấp độ)
const LEVEL_BONUS = {
  2:   20,    // Lv 2  → 20 điểm
  3:   30,    // Lv 3  → 30 điểm
  5:   50,    // Lv 5  → 50 điểm
  10:  100,   // Lv 10 → 100 điểm
  15:  150,   // Lv 15 → 150 điểm
  20:  200,   // Lv 20 → 200 điểm
};

// Badge rarity bonus
const BADGE_RARITY_BONUS = {
  common:    15,
  rare:      30,
  epic:      60,
  legendary: 100,
};

// XP milestone bonus
const XP_BONUS = {
  500:   25,
  1000:  50,
  2500:  75,
  5000:  100,
  10000: 200,
};

// =========================
// CALCULATE FUNCTIONS
// =========================

// Tính điểm kiếm được từ mua hàng (VD: mua 30000đ → 300 điểm)
export function calculatePointsFromPurchase(amountVnd) {
  return Math.floor(amountVnd * POINTS_PER_VND);
}

// Tính giá VNĐ khi đổi điểm (VD: 15000 điểm → 15000 × 2 = 30000đ)
export function calculateVndFromPoints(points) {
  return Math.floor(points * VND_PER_POINT);
}

// Lấy bonus điểm streak mới đạt được
export function getStreakBonus(newStreak) {
  let bonus = 0;
  const milestones = Object.keys(STREAK_BONUS).map(Number).sort((a, b) => a - b);
  for (const milestone of milestones) {
    if (newStreak >= milestone) {
      bonus = Math.max(bonus, STREAK_BONUS[milestone]);
    }
  }
  return bonus;
}

// Lấy bonus điểm khi lên level mới
export function getLevelBonus(newLevel) {
  const milestones = Object.keys(LEVEL_BONUS).map(Number).sort((a, b) => a - b);
  for (const milestone of milestones) {
    if (newLevel >= milestone) {
      return LEVEL_BONUS[milestone];
    }
  }
  return 0;
}

// Lấy bonus điểm khi nhận badge
export function getBadgeBonus(rarity) {
  return BADGE_RARITY_BONUS[rarity] || BADGE_RARITY_BONUS.common;
}

// Lấy bonus điểm khi đạt XP milestone
export function getXpBonus(xp) {
  const milestones = Object.keys(XP_BONUS).map(Number).sort((a, b) => a - b);
  for (const milestone of milestones) {
    if (xp >= milestone) {
      return XP_BONUS[milestone];
    }
  }
  return 0;
}

// =========================
// BONUS POINT AWARD FUNCTIONS
// =========================
// Các function này được gọi từ authController / badgeController khi user đạt achievement

// Thưởng điểm khi đạt streak mới (gọi khi streak tăng)
export const awardStreakBonus = async (userId, newStreak) => {
  const bonus = getStreakBonus(newStreak);
  if (bonus <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;

  const newBalance = (user.studentProfile?.rewardPoints || 0) + bonus;
  await User.findByIdAndUpdate(userId, {
    'studentProfile.rewardPoints': newBalance
  });

  const record = await RewardPoint.create({
    user: userId,
    type: 'earn',
    points: bonus,
    reason: 'streak_milestone',
    description: `Đạt chuỗi học ${newStreak} ngày — thưởng ${bonus} điểm`,
    balanceAfter: newBalance
  });

  await Notification.create({
    user: userId,
    title: '🎉 Đạt chuỗi học!',
    message: `Chúc mừng bạn đạt chuỗi học ${newStreak} ngày! Nhận ngay ${bonus} điểm thưởng.`,
    type: 'success'
  });

  return record;
};

// Thưởng điểm khi lên level mới (gọi khi level tăng)
export const awardLevelBonus = async (userId, newLevel) => {
  const bonus = getLevelBonus(newLevel);
  if (bonus <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;

  const newBalance = (user.studentProfile?.rewardPoints || 0) + bonus;
  await User.findByIdAndUpdate(userId, {
    'studentProfile.rewardPoints': newBalance
  });

  const record = await RewardPoint.create({
    user: userId,
    type: 'earn',
    points: bonus,
    reason: 'level_up',
    description: `Lên cấp ${newLevel} — thưởng ${bonus} điểm`,
    balanceAfter: newBalance
  });

  await Notification.create({
    user: userId,
    title: '🎉 Lên cấp!',
    message: `Chúc mừng bạn đã đạt Level ${newLevel}! Nhận ngay ${bonus} điểm thưởng.`,
    type: 'success'
  });

  return record;
};

// Thưởng điểm khi nhận badge mới (gọi khi user nhận badge)
export const awardBadgeBonus = async (userId, badge) => {
  const bonus = getBadgeBonus(badge.rarity || 'common');
  if (bonus <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;

  const newBalance = (user.studentProfile?.rewardPoints || 0) + bonus;
  await User.findByIdAndUpdate(userId, {
    'studentProfile.rewardPoints': newBalance
  });

  const record = await RewardPoint.create({
    user: userId,
    type: 'earn',
    points: bonus,
    reason: 'badge_earned',
    description: `Nhận badge "${badge.name}" (${badge.rarity}) — thưởng ${bonus} điểm`,
    balanceAfter: newBalance
  });

  await Notification.create({
    user: userId,
    title: `🏅 Nhận badge mới: ${badge.name}`,
    message: `Bạn đã nhận badge "${badge.name}"! Nhận ngay ${bonus} điểm thưởng.`,
    type: 'success'
  });

  return record;
};

// Thưởng điểm khi đạt XP milestone (gọi khi XP vượt ngưỡng)
export const awardXpBonus = async (userId, xp) => {
  const bonus = getXpBonus(xp);
  if (bonus <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;

  const newBalance = (user.studentProfile?.rewardPoints || 0) + bonus;
  await User.findByIdAndUpdate(userId, {
    'studentProfile.rewardPoints': newBalance
  });

  const record = await RewardPoint.create({
    user: userId,
    type: 'earn',
    points: bonus,
    reason: 'xp_milestone',
    description: `Đạt ${xp} XP — thưởng ${bonus} điểm`,
    balanceAfter: newBalance
  });

  await Notification.create({
    user: userId,
    title: '⭐ Đạt XP mới!',
    message: `Bạn đã đạt ${xp} XP! Nhận ngay ${bonus} điểm thưởng.`,
    type: 'success'
  });

  return record;
};

// Earn points when user makes a purchase
export const earnPoints = async (userId, amountVnd, orderId, documentId = null) => {
  const points = calculatePointsFromPurchase(amountVnd);
  if (points <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;

  const newBalance = (user.studentProfile?.rewardPoints || 0) + points;

  // Update user balance
  await User.findByIdAndUpdate(userId, {
    'studentProfile.rewardPoints': newBalance
  });

  // Record point transaction
  const record = await RewardPoint.create({
    user: userId,
    type: 'earn',
    points,
    reason: 'purchase',
    description: `Nhận ${points} điểm khi mua tài liệu`,
    orderId,
    documentId,
    balanceAfter: newBalance
  });

  return record;
};

// Spend points when user redeems for a document
export const spendPoints = async (userId, points, orderId, documentId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'student') return null;

  const currentBalance = user.studentProfile?.rewardPoints || 0;
  if (currentBalance < points) return null;

  const newBalance = currentBalance - points;

  // Update user balance
  await User.findByIdAndUpdate(userId, {
    'studentProfile.rewardPoints': newBalance
  });

  // Record point transaction
  const record = await RewardPoint.create({
    user: userId,
    type: 'redeem',
    points: -points,
    reason: 'redeem_document',
    description: `Đổi ${points} điểm lấy tài liệu`,
    orderId,
    documentId,
    balanceAfter: newBalance
  });

  return record;
};

// Get user's current point balance
export const getPointBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(apiError('User not found', 404));

    const currentBalance = user.studentProfile?.rewardPoints || 0;

    res.json(apiSuccess({
      currentBalance,
      totalEarned: currentBalance,
      totalSpent: 0,
      pointsValue: calculateVndFromPoints(currentBalance),
      minRedeemPoints: MIN_REDEEM_POINTS,
      pointsPerVnd: POINTS_PER_VND,
      vndPerPoint: VND_PER_POINT,
      exchangeRate: `1 điểm = ${VND_PER_POINT} VNĐ (điểm × ${2} = VNĐ)`,
      bonusTables: {
        streak: STREAK_BONUS,
        level: LEVEL_BONUS,
        badge: BADGE_RARITY_BONUS,
        xp: XP_BONUS
      }
    }));
  } catch (error) {
    next(error);
  }
};

// Get point history (transactions)
export const getPointHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = { user: req.user.id };
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      RewardPoint.find(query)
        .populate('documentId', 'title')
        .populate('orderId', 'totalAmount status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RewardPoint.countDocuments(query)
    ]);

    res.json(apiSuccess({
      records: records.map(r => ({
        _id: r._id,
        type: r.type,
        points: Math.abs(r.points),
        reason: r.reason,
        description: r.description,
        balanceAfter: r.balanceAfter,
        documentTitle: r.documentId?.title,
        orderAmount: r.orderId?.totalAmount,
        createdAt: r.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error) {
    next(error);
  }
};

// Redeem points to get a document (free)
export const redeemPointsForDocument = async (req, res, next) => {
  try {
    const { orderId, pointsToUse } = req.body;

    const order = await Order.findById(orderId).populate('documents.document');
    if (!order) return next(apiError('Order not found', 404));

    if (order.user.toString() !== req.user.id) {
      return next(apiError('Not authorized', 403));
    }

    if (order.paymentStatus === 'paid') {
      return next(apiError('Order already paid', 400));
    }

    const user = await User.findById(req.user.id);
    const currentBalance = user.studentProfile?.rewardPoints || 0;

    if (currentBalance < pointsToUse) {
      return next(apiError('Insufficient points', 400));
    }

    // Calculate max points that can be used for this order
    // VND_PER_POINT = 0.5 → điểm × 2 = giá VNĐ → maxPoints = orderTotal / 2
    const orderTotal = order.totalAmount;
    const maxPoints = Math.floor(orderTotal / VND_PER_POINT);

    if (pointsToUse > maxPoints) {
      return next(apiError(`You can only use up to ${maxPoints} points for this order (max 50% of order value)`, 400));
    }

    // Điểm quy đổi ra VNĐ: points × 2 = VNĐ
    const pointsValueInVnd = calculateVndFromPoints(pointsToUse);
    const remainingAmount = orderTotal - pointsValueInVnd;

    // If remaining amount > 0, need additional payment method
    if (remainingAmount > 0) {
      return next(apiError('Points alone cannot cover the full order. Use points as partial payment or use another payment method.', 400));
    }

    // Process point redemption
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct points from user
      const newBalance = currentBalance - pointsToUse;
      await User.findByIdAndUpdate(req.user.id, {
        'studentProfile.rewardPoints': newBalance
      }, { session });

      // Create point transaction record
      for (const item of order.documents) {
        const itemPoints = Math.floor((item.price / orderTotal) * pointsToUse);
        await RewardPoint.create([{
          user: req.user.id,
          type: 'redeem',
          points: -itemPoints,
          reason: 'redeem_document',
          description: `Đổi điểm lấy tài liệu: ${item.document?.title || 'Tài liệu'}`,
          orderId: order._id,
          documentId: item.document?._id,
          balanceAfter: newBalance
        }], { session });
      }

      // Record full redemption
      await PointRedemption.create([{
        user: req.user.id,
        order: order._id,
        pointsSpent: pointsToUse,
        documents: order.documents.map(item => ({
          document: item.document?._id,
          pointsCost: Math.floor((item.price / orderTotal) * pointsToUse)
        })),
        status: 'completed',
        redeemedAt: new Date()
      }], { session });

      // Update order status to paid (no additional payment needed)
      order.status = 'completed';
      order.paymentStatus = 'paid';
      order.paymentMethod = 'points';
      order.pointsPaid = pointsToUse;
      order.totalAmount = 0;
      await order.save({ session });

      // Update document sales count
      for (const item of order.documents) {
        if (!item.document?._id) continue;
        await Document.findByIdAndUpdate(item.document._id, {
          $inc: { salesCount: 1 }
        }, { session });

        // Add to user download history
        await User.findByIdAndUpdate(req.user.id, {
          $push: {
            'studentProfile.downloadHistory': {
              document: item.document._id,
              downloadedAt: new Date()
            }
          }
        }, { session });
      }

      // Create notification
      await Notification.create([{
        user: req.user.id,
        title: 'Đổi điểm thành công!',
        message: `Bạn đã đổi ${pointsToUse} điểm lấy tài liệu miễn phí. Bây giờ có thể tải tài liệu ngay.`,
        type: 'success'
      }], { session });

      await session.commitTransaction();

      res.json(apiSuccess({
        order,
        pointsUsed: pointsToUse,
        pointsRemaining: newBalance,
        message: 'Đổi điểm thành công! Tài liệu đã được thêm vào thư viện của bạn.'
      }, 'Points redeemed successfully'));
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// Check how many points needed to redeem a document
export const getPointsRequired = async (req, res, next) => {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return next(apiError('Order ID is required', 400));
    }

    const order = await Order.findById(orderId);
    if (!order) return next(apiError('Order not found', 404));

    if (order.user.toString() !== req.user.id) {
      return next(apiError('Not authorized', 403));
    }

    const user = await User.findById(req.user.id);
    const currentBalance = user.studentProfile?.rewardPoints || 0;
    // VND_PER_POINT = 0.5 → điểm × 2 = giá VNĐ → maxPoints = orderTotal / 2
    const orderTotal = order.totalAmount;
    const maxPoints = Math.floor(orderTotal / VND_PER_POINT);

    const pointsNeeded = maxPoints;
    const canFullyRedeem = currentBalance >= maxPoints;
    const canPartiallyRedeem = currentBalance > 0;

    res.json(apiSuccess({
      orderTotal,
      currentBalance,
      pointsNeeded: canFullyRedeem ? maxPoints : Math.min(currentBalance, maxPoints),
      maxPointsAllowed: maxPoints,
      canFullyRedeem,
      canPartiallyRedeem,
      partialDiscountVnd: calculateVndFromPoints(Math.min(currentBalance, maxPoints)),
      pointsValueVnd: calculateVndFromPoints(currentBalance)
    }));
  } catch (error) {
    next(error);
  }
};

// Admin: Adjust user points manually
export const adjustPoints = async (req, res, next) => {
  try {
    const { userId, points, reason, description } = req.body;

    if (!userId || points === undefined) {
      return next(apiError('User ID and points are required', 400));
    }

    const user = await User.findById(userId);
    if (!user) return next(apiError('User not found', 404));

    const currentBalance = user.studentProfile?.rewardPoints || 0;
    let newBalance;

    if (points > 0) {
      newBalance = currentBalance + points;
      await User.findByIdAndUpdate(userId, {
        'studentProfile.rewardPoints': newBalance
      });
      await RewardPoint.create({
        user: userId,
        type: 'earn',
        points,
        reason: reason || 'admin_bonus',
        description: description || `Admin tặng thêm ${points} điểm`,
        balanceAfter: newBalance
      });
    } else {
      const deductPoints = Math.abs(points);
      if (currentBalance < deductPoints) {
        return next(apiError('Cannot deduct more points than user has', 400));
      }
      newBalance = currentBalance - deductPoints;
      await User.findByIdAndUpdate(userId, {
        'studentProfile.rewardPoints': newBalance
      });
      await RewardPoint.create({
        user: userId,
        type: 'redeem',
        points: -deductPoints,
        reason: reason || 'manual_adjust',
        description: description || `Admin trừ ${deductPoints} điểm`,
        balanceAfter: newBalance
      });
    }

    // Notify user
    await Notification.create({
      user: userId,
      title: points > 0 ? 'Bạn nhận được điểm thưởng!' : 'Điểm thưởng đã được điều chỉnh',
      message: points > 0
        ? `Bạn đã được tặng ${points} điểm. Lý do: ${description || 'Thưởng từ quản trị viên'}`
        : `Điểm của bạn đã được điều chỉnh. ${description || ''}`,
      type: points > 0 ? 'success' : 'info'
    });

    res.json(apiSuccess({
      userId,
      previousBalance: currentBalance,
      newBalance,
      pointsAdjusted: points
    }, 'Points adjusted successfully'));
  } catch (error) {
    next(error);
  }
};

// Get top users by points (leaderboard)
export const getPointsLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const users = await User.find({ role: 'student' })
      .select('name avatar studentProfile')
      .sort({ 'studentProfile.rewardPoints': -1 })
      .limit(Number(limit));

    const currentUserRank = await User.countDocuments({
      role: 'student',
      'studentProfile.rewardPoints': {
        $gt: (await User.findById(req.user.id))?.studentProfile?.rewardPoints || 0
      }
    }) + 1;

    const rankedUsers = users.map((u, i) => ({
      rank: i + 1,
      _id: u._id,
      name: u.name,
      avatar: u.avatar,
      rewardPoints: u.studentProfile?.rewardPoints || 0
    }));

    res.json(apiSuccess({
      leaderboard: rankedUsers,
      userRank: currentUserRank
    }));
  } catch (error) {
    next(error);
  }
};
