import React, { useState, useEffect } from 'react';
import { gamificationService } from '../../services/api';
import { Star, Trophy, Flame, Zap, Medal, Crown, ChevronRight, Award } from 'lucide-react';
import { LoginRequired } from "../../components/ui";
import toast from 'react-hot-toast';

const Gamification = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, leaderboardRes, badgesRes] = await Promise.all([
        gamificationService.getStats(),
        gamificationService.getLeaderboard({ limit: 20 }),
        gamificationService.getBadges(),
      ]);
      setStats(statsRes.data.data);
      setLeaderboard(leaderboardRes.data.data?.leaderboard || []);
      setBadges(badgesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load gamification data');
    } finally {
      setIsLoading(false);
    }
  };

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500',
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-500/50',
  };

  return (
    <LoginRequired title="Thành tựu" message="Bạn cần đăng nhập để xem thành tựu và bảng xếp hạng">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Trophy />
            Gamification & Achievements
          </h1>
          <p className="text-lg text-white/90">Track your progress, earn badges, and climb the leaderboard!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['overview', 'leaderboard', 'badges'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Zap className="text-yellow-500" />}
                label="XP"
                value={stats.xp.toLocaleString()}
                subtext={`Level ${stats.level}`}
                color="yellow"
              />
              <StatCard
                icon={<Star className="text-purple-500" />}
                label="Study Streak"
                value={`${stats.studyStreak} days`}
                subtext={stats.studyStreak > 0 ? 'On fire!' : 'Start today!'}
                color="purple"
              />
              <StatCard
                icon={<Award className="text-blue-500" />}
                label="Badges Earned"
                value={badges.filter(b => b.earned).length}
                subtext={`of ${badges.length} total`}
                color="blue"
              />
              <StatCard
                icon={<Flame className="text-red-500" />}
                label="Downloads"
                value={stats.downloadedDocs}
                subtext="documents owned"
                color="red"
              />
            </div>

            {stats.progress !== undefined && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8">
                <h3 className="font-bold mb-4">Level Progress</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-bold">
                    {stats.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Level {stats.level}</span>
                      <span>Level {stats.level + 1}</span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {stats.xp.toLocaleString()} / {stats.xpForNextLevel?.toLocaleString()} XP
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Leaderboard
              </h2>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {leaderboard.map((user, index) => (
                <div
                  key={user._id}
                  className={`p-4 flex items-center gap-4 ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">Level {user.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-500">{user.xp.toLocaleString()} XP</p>
                    <p className="text-sm text-gray-500">{user.studyStreak} day streak</p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No leaderboard data yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {badges.map(badge => (
              <div
                key={badge._id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 text-center relative overflow-hidden ${
                  badge.earned ? 'ring-2 ring-green-500' : 'opacity-60'
                }`}
              >
                <div className={`absolute top-0 right-0 px-2 py-1 text-xs font-medium rounded-bl-lg ${
                  badge.earned ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {badge.earned ? 'Earned' : 'Locked'}
                </div>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${rarityColors[badge.rarity]} flex items-center justify-center text-4xl shadow-lg ${rarityGlow[badge.rarity]} ${!badge.earned && 'grayscale'}`}>
                  {badge.icon}
                </div>
                <h3 className="font-bold mb-1">{badge.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{badge.description}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Star size={12} className="text-yellow-500" />
                  <span>{badge.xpReward} XP</span>
                  <span className="capitalize">{badge.rarity}</span>
                </div>
                {badge.earned && badge.earnedAt && (
                  <p className="text-xs text-green-500 mt-2">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </LoginRequired>
  );
};

const StatCard = ({ icon, label, value, subtext, color }) => {
  const colorClasses = {
    yellow: 'border-yellow-200 dark:border-yellow-800',
    purple: 'border-purple-200 dark:border-purple-800',
    blue: 'border-blue-200 dark:border-blue-800',
    red: 'border-red-200 dark:border-red-800',
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-400">{subtext}</p>
        </div>
      </div>
    </div>
  );
};

export default Gamification;
