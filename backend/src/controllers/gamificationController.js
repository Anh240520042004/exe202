import User from '../models/User.js';
import Badge from '../models/Badge.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import {
  awardStreakBonus,
  awardLevelBonus,
  awardBadgeBonus,
  awardXpBonus,
  getStreakBonus,
  getLevelBonus,
  getXpBonus
} from './rewardController.js';

export const getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(apiError('User not found', 404));
    }

    const stats = {
      xp: user.studentProfile?.xp || 0,
      level: user.studentProfile?.level || 1,
      studyStreak: user.studentProfile?.studyStreak || 0,
      badges: user.studentProfile?.achievements || [],
      downloadedDocs: user.studentProfile?.downloadHistory?.length || 0,
      bookedMentors: user.studentProfile?.bookedMentors?.length || 0
    };

    const xpForNextLevel = calculateXPForLevel(stats.level + 1);
    const currentLevelXP = calculateXPForLevel(stats.level);

    res.json(apiSuccess({
      ...stats,
      xpForNextLevel,
      currentLevelXP,
      progress: ((stats.xp - currentLevelXP) / (xpForNextLevel - currentLevelXP)) * 100
    }));
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, type = 'xp' } = req.query;

    let sortField;
    switch (type) {
      case 'streak':
        sortField = 'studentProfile.studyStreak';
        break;
      case 'gpa':
        sortField = 'studentProfile.gpa';
        break;
      default:
        sortField = 'studentProfile.xp';
    }

    const leaderboard = await User.find({
      role: 'student',
      'studentProfile': { $exists: true }
    })
      .select('name avatar studentProfile')
      .sort({ [sortField]: -1 })
      .limit(Number(limit));

    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      xp: user.studentProfile?.xp || 0,
      level: user.studentProfile?.level || 1,
      studyStreak: user.studentProfile?.studyStreak || 0,
      gpa: user.studentProfile?.gpa || 0
    }));

    const userRank = rankedLeaderboard.findIndex(u => u._id.toString() === req.user.id);

    res.json(apiSuccess({
      leaderboard: rankedLeaderboard,
      userRank: userRank !== -1 ? rankedLeaderboard[userRank] : null
    }));
  } catch (error) {
    next(error);
  }
};

export const getAllBadges = async (req, res, next) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ rarity: 1, category: 1 });

    const user = await User.findById(req.user.id);
    const userBadgeIds = user.studentProfile?.achievements?.map(a => a.badgeId.toString()) || [];

    const badgesWithStatus = badges.map(badge => ({
      ...badge.toObject(),
      earned: userBadgeIds.includes(badge._id.toString()),
      earnedAt: user.studentProfile?.achievements?.find(
        a => a.badgeId.toString() === badge._id.toString()
      )?.earnedAt
    }));

    res.json(apiSuccess(badgesWithStatus));
  } catch (error) {
    next(error);
  }
};

export const addXP = async (userId, amount, reason) => {
  try {
    const user = await User.findById(userId);

    if (!user || user.role !== 'student') return;

    const oldXP = user.studentProfile.xp || 0;
    const oldLevel = user.studentProfile.level || 1;

    user.studentProfile.xp = (user.studentProfile.xp || 0) + amount;
    const newXP = user.studentProfile.xp;

    const newLevel = calculateLevelFromXP(newXP);

    // Award XP milestone bonus
    if (oldXP !== newXP) {
      const milestones = [500, 1000, 2500, 5000, 10000];
      const claimed = user.studentProfile.rewardPointsClaimedMilestones?.xpMilestones || [];
      const reached = milestones.filter(m => newXP >= m && !claimed.includes(m));
      if (reached.length > 0) {
        const highestMilestone = reached[reached.length - 1];
        await awardXpBonus(userId, highestMilestone);
        user.studentProfile.rewardPointsClaimedMilestones = user.studentProfile.rewardPointsClaimedMilestones || { streaks: [], levels: [], xpMilestones: [] };
        user.studentProfile.rewardPointsClaimedMilestones.xpMilestones.push(highestMilestone);
      }
    }

    // Award level bonus
    if (newLevel > oldLevel) {
      user.studentProfile.level = newLevel;
      const claimedLevels = user.studentProfile.rewardPointsClaimedMilestones?.levels || [];
      if (!claimedLevels.includes(newLevel)) {
        await awardLevelBonus(userId, newLevel);
        user.studentProfile.rewardPointsClaimedMilestones = user.studentProfile.rewardPointsClaimedMilestones || { streaks: [], levels: [], xpMilestones: [] };
        user.studentProfile.rewardPointsClaimedMilestones.levels.push(newLevel);
      }
      await checkAndAwardBadges(user);
    }

    await user.save();
    return user;
  } catch (error) {
    console.error('Error adding XP:', error);
  }
};

export const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user || user.role !== 'student') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = user.studentProfile.lastStudyDate
      ? new Date(user.studentProfile.lastStudyDate)
      : null;

    const oldStreak = user.studentProfile.studyStreak || 0;
    let newStreak = oldStreak;

    if (!lastStudy) {
      newStreak = 1;
    } else {
      lastStudy.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastStudy.getTime() === today.getTime()) {
        return user;
      } else if (lastStudy.getTime() === yesterday.getTime()) {
        newStreak = oldStreak + 1;
      } else {
        newStreak = 1;
      }
    }

    user.studentProfile.studyStreak = newStreak;
    user.studentProfile.lastStudyDate = today;

    // Award streak bonus if milestone reached
    const claimedStreaks = user.studentProfile.rewardPointsClaimedMilestones?.streaks || [];
    const streakMilestones = [7, 14, 21, 30, 60, 90];
    const milestoneReached = streakMilestones.find(m => newStreak >= m && !claimedStreaks.includes(m));
    if (milestoneReached) {
      await awardStreakBonus(userId, newStreak);
      user.studentProfile.rewardPointsClaimedMilestones = user.studentProfile.rewardPointsClaimedMilestones || { streaks: [], levels: [], xpMilestones: [] };
      user.studentProfile.rewardPointsClaimedMilestones.streaks.push(milestoneReached);
    }

    await user.save();
    await checkAndAwardBadges(user);

    return user;
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};

export const checkAndAwardBadges = async (user) => {
  try {
    const badges = await Badge.find({ isActive: true });
    const currentBadgeIds = user.studentProfile?.achievements?.map(a => a.badgeId.toString()) || [];
    const newBadges = [];

    for (const badge of badges) {
      if (currentBadgeIds.includes(badge._id.toString())) continue;

      let earned = false;

      switch (badge.requirement?.type) {
        case 'gpa':
          earned = (user.studentProfile?.gpa || 0) >= (badge.requirement?.value || 0);
          break;
        case 'streak':
          earned = (user.studentProfile?.studyStreak || 0) >= (badge.requirement?.value || 0);
          break;
        case 'downloads':
          earned = (user.studentProfile?.downloadHistory?.length || 0) >= (badge.requirement?.value || 0);
          break;
        case 'mentor_sessions':
          earned = (user.studentProfile?.bookedMentors?.length || 0) >= (badge.requirement?.value || 0);
          break;
        case 'xp':
          earned = (user.studentProfile?.xp || 0) >= (badge.requirement?.value || 0);
          break;
        case 'level':
          earned = (user.studentProfile?.level || 1) >= (badge.requirement?.value || 0);
          break;
      }

      if (earned) {
        user.studentProfile.achievements = user.studentProfile.achievements || [];
        user.studentProfile.achievements.push({
          badgeId: badge._id,
          earnedAt: new Date()
        });

        user.studentProfile.xp = (user.studentProfile.xp || 0) + badge.xpReward;
        newBadges.push(badge);

        // Award reward points for earning badge
        await awardBadgeBonus(userId, badge);
      }
    }

    if (newBadges.length > 0) {
      await user.save();
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
};

export const getBadgeDetails = async (req, res, next) => {
  try {
    const { code } = req.params;

    const badge = await Badge.findOne({ code, isActive: true });

    if (!badge) {
      return next(apiError('Badge not found', 404));
    }

    const usersWithBadge = await User.find({
      'studentProfile.achievements.badgeId': badge._id
    })
      .select('name avatar studentProfile')
      .sort({ 'studentProfile.xp': -1 })
      .limit(20);

    res.json(apiSuccess({
      badge,
      topHolders: usersWithBadge.map(u => ({
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        level: u.studentProfile?.level || 1
      }))
    }));
  } catch (error) {
    next(error);
  }
};

function calculateXPForLevel(level) {
  return Math.floor(1000 * Math.pow(level - 1, 1.5));
}

function calculateLevelFromXP(xp) {
  let level = 1;
  while (calculateXPForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}
